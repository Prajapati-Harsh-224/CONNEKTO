import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.main import app
from app.models import Product, Supplier


def registration_payload(role, suffix, area="Maninagar"):
    return {
        "name": f"{role.title()} {suffix}",
        "area": area,
        "phone": f"9{suffix[:9]}",
        "email": f"{role.lower()}-{suffix}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def shop_owner_payload(suffix):
    return {
        "name": f"Owner {suffix}",
        "shopName": f"Owner Shop {suffix}",
        "shopAddress": "123 Market Street",
        "area": "Maninagar",
        "phone": f"8{suffix[:9]}",
        "email": f"owner-{suffix}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def register_supplier(client, suffix):
    response = client.post("/api/auth/register/supplier", json=registration_payload("supplier", suffix))
    assert response.status_code == 201, response.json()
    return f"supplier-{response.json()['data']['user']['id'][:8]}"


def register_owner(client, suffix):
    response = client.post("/api/auth/register/shop-owner", json=shop_owner_payload(suffix))
    assert response.status_code == 201, response.json()


def add_product(supplier_id, product_id, name, price):
    with SessionLocal() as db:
        db.add(Product(
            id=product_id,
            supplier_id=supplier_id,
            name=name,
            brand="Test Brand",
            category="Grocery",
            pack_size="1 kg",
            price=price,
            minimum_quantity=1,
            is_active=True,
        ))
        db.commit()


def test_supplier_order_ownership_status_workflow_and_shop_owner_visibility():
    suffix = uuid4().hex[:10]
    with TestClient(app) as supplier_a_client, TestClient(app) as supplier_b_client, TestClient(app) as owner_client:
        supplier_a = register_supplier(supplier_a_client, f"a{suffix}")
        supplier_b = register_supplier(supplier_b_client, f"b{suffix}")
        register_owner(owner_client, suffix)
        product_a = f"lifecycle-product-a-{suffix}"
        product_b = f"lifecycle-product-b-{suffix}"
        add_product(supplier_a, product_a, "Supplier A Product", 12)
        add_product(supplier_b, product_b, "Supplier B Product", 8)

        checkout = owner_client.post("/api/checkout", json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "idempotencyKey": f"lifecycle-{suffix}",
            "items": [
                {"supplierId": supplier_a, "productId": product_a, "quantity": 2},
                {"supplierId": supplier_b, "productId": product_b, "quantity": 3},
            ],
        })
        assert checkout.status_code == 201, checkout.json()
        supplier_orders = checkout.json()["data"]["checkout"]["supplierOrders"]
        order_a = next(order for order in supplier_orders if order["supplierId"] == supplier_a)
        order_b = next(order for order in supplier_orders if order["supplierId"] == supplier_b)

        supplier_a_orders = supplier_a_client.get("/api/supplier/orders")
        assert supplier_a_orders.status_code == 200
        assert [order["id"] for order in supplier_a_orders.json()["data"]["orders"]] == [order_a["id"]]
        assert supplier_b_client.get("/api/supplier/orders").json()["data"]["orders"][0]["id"] == order_b["id"]

        assert supplier_a_client.get(f"/api/supplier/orders/{order_b['id']}").status_code == 404
        assert supplier_a_client.put(f"/api/supplier/orders/{order_b['id']}/status", json={"status": "Accepted"}).status_code == 404

        accepted = supplier_a_client.put(f"/api/supplier/orders/{order_a['id']}/status", json={"status": "Accepted"})
        assert accepted.status_code == 200, accepted.json()
        assert accepted.json()["data"]["order"]["status"] == "Accepted"
        assert accepted.json()["data"]["order"]["paymentMethod"] == "CASH_ON_DELIVERY"

        invalid_transition = supplier_a_client.put(f"/api/supplier/orders/{order_a['id']}/status", json={"status": "Delivered"})
        assert invalid_transition.status_code == 400
        assert invalid_transition.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

        invalid_status = supplier_a_client.put(f"/api/supplier/orders/{order_a['id']}/status", json={"status": "Unknown"})
        assert invalid_status.status_code == 400
        assert invalid_status.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

        owner_orders = owner_client.get("/api/orders")
        assert owner_orders.status_code == 200
        owner_order = next(order for order in owner_orders.json()["data"]["orders"] if order["id"] == order_a["id"])
        assert owner_order["status"] == "Accepted"
        assert {order["supplierId"] for order in owner_orders.json()["data"]["orders"]} == {supplier_a, supplier_b}


def test_supplier_order_routes_require_authentication_and_role():
    with TestClient(app) as client:
        assert client.get("/api/supplier/orders").status_code == 401
        assert client.get("/api/orders").status_code == 401

    suffix = uuid4().hex[:10]
    with TestClient(app) as owner_client:
        register_owner(owner_client, suffix)
        assert owner_client.get("/api/supplier/orders").status_code == 403
        assert owner_client.put("/api/supplier/orders/missing/status", json={"status": "Accepted"}).status_code == 403


def test_shop_owner_order_cancellation_lifecycle():
    from datetime import datetime, timedelta
    from app.models import OrderStatusHistory, SupplierOrder
    suffix = uuid4().hex[:10]
    with TestClient(app) as supplier_client, TestClient(app) as owner_client:
        supplier_id = register_supplier(supplier_client, suffix)
        register_owner(owner_client, suffix)
        product_id = f"cancel-prod-{suffix}"
        add_product(supplier_id, product_id, "Cancel Product", 20)

        # 1. Cancel in Pending state (immediately)
        checkout = owner_client.post("/api/checkout", json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "idempotencyKey": f"cancel-pending-{suffix}",
            "items": [{"supplierId": supplier_id, "productId": product_id, "quantity": 1}],
        })
        assert checkout.status_code == 201
        order_pending = checkout.json()["data"]["checkout"]["supplierOrders"][0]

        cancel_res = owner_client.post(f"/api/orders/{order_pending['id']}/cancel", json={
            "reason": "Mistake order",
        })
        assert cancel_res.status_code == 200
        assert cancel_res.json()["data"]["order"]["status"] == "Cancelled"
        assert cancel_res.json()["data"]["order"]["cancellationReason"] == "Mistake order"

        # 2. Cancel in Accepted state (immediately)
        checkout2 = owner_client.post("/api/checkout", json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "idempotencyKey": f"cancel-accepted-{suffix}",
            "items": [{"supplierId": supplier_id, "productId": product_id, "quantity": 1}],
        })
        assert checkout2.status_code == 201
        order_accepted = checkout2.json()["data"]["checkout"]["supplierOrders"][0]

        supplier_client.put(f"/api/supplier/orders/{order_accepted['id']}/status", json={"status": "Accepted"})
        cancel_res2 = owner_client.post(f"/api/orders/{order_accepted['id']}/cancel", json={
            "reason": "Change of mind",
        })
        assert cancel_res2.status_code == 200
        assert cancel_res2.json()["data"]["order"]["status"] == "Cancelled"

        # 3. Cancel in Preparing state within 2 minutes
        checkout3 = owner_client.post("/api/checkout", json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "idempotencyKey": f"cancel-prep-ok-{suffix}",
            "items": [{"supplierId": supplier_id, "productId": product_id, "quantity": 1}],
        })
        assert checkout3.status_code == 201
        order_prep = checkout3.json()["data"]["checkout"]["supplierOrders"][0]

        supplier_client.put(f"/api/supplier/orders/{order_prep['id']}/status", json={"status": "Accepted"})
        supplier_client.put(f"/api/supplier/orders/{order_prep['id']}/status", json={"status": "Preparing"})

        cancel_res3 = owner_client.post(f"/api/orders/{order_prep['id']}/cancel", json={
            "reason": "Cancelled during preparation window",
        })
        assert cancel_res3.status_code == 200
        assert cancel_res3.json()["data"]["order"]["status"] == "Cancelled"

        # 4. Cancel in Preparing state after 2 minutes window has expired
        checkout4 = owner_client.post("/api/checkout", json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "idempotencyKey": f"cancel-prep-exp-{suffix}",
            "items": [{"supplierId": supplier_id, "productId": product_id, "quantity": 1}],
        })
        assert checkout4.status_code == 201
        order_prep_exp = checkout4.json()["data"]["checkout"]["supplierOrders"][0]

        supplier_client.put(f"/api/supplier/orders/{order_prep_exp['id']}/status", json={"status": "Accepted"})
        supplier_client.put(f"/api/supplier/orders/{order_prep_exp['id']}/status", json={"status": "Preparing"})

        # Backdate the Preparing status history entry by 3 minutes
        with SessionLocal() as db:
            prep_hist = db.scalar(
                select(OrderStatusHistory)
                .where(OrderStatusHistory.order_id == order_prep_exp["id"], OrderStatusHistory.to_status == "Preparing")
            )
            if prep_hist:
                prep_hist.created_at = datetime.utcnow() - timedelta(minutes=3)
            order_db = db.get(SupplierOrder, order_prep_exp["id"])
            if order_db:
                order_db.updated_at = datetime.utcnow() - timedelta(minutes=3)
            db.commit()

        cancel_res4 = owner_client.post(f"/api/orders/{order_prep_exp['id']}/cancel", json={
            "reason": "Too late cancel",
        })
        assert cancel_res4.status_code == 400
        assert cancel_res4.json()["error"]["code"] == "CANCELLATION_WINDOW_EXPIRED"

