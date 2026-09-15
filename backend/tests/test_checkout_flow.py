import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.main import app
from app.models import Product, Supplier, SupplierOrder, SupplierServiceArea


def owner_payload(suffix):
    return {
        "name": f"Checkout Owner {suffix}",
        "shopName": f"Checkout Shop {suffix}",
        "shopAddress": "123 Market Street",
        "area": "Maninagar",
        "phone": f"9{suffix[:9]}",
        "email": f"checkout-owner-{suffix}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def create_catalog(suffix):
    supplier_a_id = f"checkout-supplier-a-{suffix}"
    supplier_b_id = f"checkout-supplier-b-{suffix}"
    product_a1_id = f"checkout-product-a1-{suffix}"
    product_a2_id = f"checkout-product-a2-{suffix}"
    product_b1_id = f"checkout-product-b1-{suffix}"
    with SessionLocal() as db:
        supplier_a = Supplier(id=supplier_a_id, name=f"Supplier A {suffix}")
        supplier_b = Supplier(id=supplier_b_id, name=f"Supplier B {suffix}")
        db.add_all([supplier_a, supplier_b])
        db.add_all([
            SupplierServiceArea(supplier_id=supplier_a_id, area_key="maninagar", area="Maninagar"),
            SupplierServiceArea(supplier_id=supplier_b_id, area_key="maninagar", area="Maninagar"),
        ])
        db.add_all([
            Product(id=product_a1_id, supplier_id=supplier_a_id, name="Rice", brand="A", category="Grocery", pack_size="10 kg", price=10, minimum_quantity=1, is_active=True),
            Product(id=product_a2_id, supplier_id=supplier_a_id, name="Flour", brand="A", category="Grocery", pack_size="5 kg", price=5, minimum_quantity=1, is_active=True),
            Product(id=product_b1_id, supplier_id=supplier_b_id, name="Tea", brand="B", category="Beverages", pack_size="1 kg", price=7, minimum_quantity=2, is_active=True),
        ])
        db.commit()
    return supplier_a_id, supplier_b_id, product_a1_id, product_a2_id, product_b1_id


def register_owner(client, suffix):
    response = client.post("/api/auth/register/shop-owner", json=owner_payload(suffix))
    assert response.status_code == 201, response.json()


def test_checkout_creates_one_checkout_and_separate_supplier_orders():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, product_a1, product_a2, product_b1 = create_catalog(suffix)
        checkout_payload = {
            "paymentMethod": "REQUEST_ORDER",
            "idempotencyKey": f"checkout-key-{suffix}",
            "items": [
                {"supplierId": supplier_a, "productId": product_a1, "quantity": 2},
                {"supplierId": supplier_a, "productId": product_a2, "quantity": 1},
                {"supplierId": supplier_b, "productId": product_b1, "quantity": 3},
            ],
        }
        response = client.post("/api/checkout", json=checkout_payload)

        assert response.status_code == 201, response.json()
        checkout = response.json()["data"]["checkout"]
        assert checkout["totalAmount"] == 46.0
        assert len(checkout["supplierOrders"]) == 2
        assert {order["supplierId"] for order in checkout["supplierOrders"]} == {supplier_a, supplier_b}
        assert all(order["serviceArea"] == "Maninagar" for order in checkout["supplierOrders"])

        repeated = client.post("/api/checkout", json=checkout_payload)
        assert repeated.status_code == 201, repeated.json()
        assert repeated.json()["data"]["checkout"]["id"] == checkout["id"]

        with SessionLocal() as db:
            orders = db.scalars(select(SupplierOrder).where(SupplierOrder.checkout_id == checkout["id"])).all()
            assert len(orders) == 2
            assert {order.supplier_id for order in orders} == {supplier_a, supplier_b}
            assert sorted(float(order.subtotal) for order in orders) == [21.0, 25.0]
            assert sorted(len(order.items) for order in orders) == [1, 2]


def test_checkout_rejects_invalid_product_quantity_supplier_and_area():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, product_a1, _, product_b1 = create_catalog(suffix)

        cases = [
            ({"supplierId": supplier_a, "productId": "missing-product", "quantity": 1}, "NOT_FOUND"),
            ({"supplierId": supplier_b, "productId": product_a1, "quantity": 1}, "INVALID_PRODUCT_SUPPLIER"),
            ({"supplierId": supplier_b, "productId": product_b1, "quantity": 1}, "MINIMUM_QUANTITY_NOT_MET"),
        ]
        for item, code in cases:
            response = client.post("/api/checkout", json={"paymentMethod": "REQUEST_ORDER", "items": [item]})
            assert response.status_code in {400, 404}, response.json()
            assert response.json()["error"]["code"] == code

        with SessionLocal() as db:
            db.scalar(select(Product).where(Product.id == product_a1)).is_active = False
            db.commit()
        response = client.post("/api/checkout", json={"paymentMethod": "REQUEST_ORDER", "items": [{"supplierId": supplier_a, "productId": product_a1, "quantity": 1}]})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "PRODUCT_UNAVAILABLE"

        with SessionLocal() as db:
            db.query(SupplierServiceArea).filter(SupplierServiceArea.supplier_id == supplier_b).delete()
            db.add(SupplierServiceArea(supplier_id=supplier_b, area_key="bopal", area="Bopal"))
            db.commit()
        response = client.post("/api/checkout", json={"paymentMethod": "REQUEST_ORDER", "items": [{"supplierId": supplier_b, "productId": product_b1, "quantity": 2}]})
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "SUPPLIER_AREA_MISMATCH"


def test_checkout_requires_shop_owner_and_nonempty_cart():
    with TestClient(app) as client:
        empty = client.post("/api/checkout", json={"paymentMethod": "REQUEST_ORDER", "items": []})
        assert empty.status_code == 401

        suffix = uuid4().hex[:10]
        register_owner(client, suffix)
        response = client.post("/api/checkout", json={"paymentMethod": "REQUEST_ORDER", "items": []})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"