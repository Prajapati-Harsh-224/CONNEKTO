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
        "name": f"Box Owner {suffix}",
        "shopName": f"Box Shop {suffix}",
        "shopAddress": "456 Market Road",
        "area": "Maninagar",
        "phone": f"8{suffix[:9]}",
        "email": f"box-owner-{suffix}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def register_owner(client, suffix):
    response = client.post("/api/auth/register/shop-owner", json=owner_payload(suffix))
    assert response.status_code == 201, response.json()


def create_box_catalog(suffix):
    supplier_a_id = f"box-supplier-a-{suffix}"
    supplier_b_id = f"box-supplier-b-{suffix}"
    product_balaji_id = f"balaji-wafers-{suffix}"
    product_standard_id = f"standard-rice-{suffix}"
    product_b1_id = f"box-product-b1-{suffix}"

    with SessionLocal() as db:
        supplier_a = Supplier(id=supplier_a_id, name=f"Box Supplier A {suffix}")
        supplier_b = Supplier(id=supplier_b_id, name=f"Box Supplier B {suffix}")
        db.add_all([supplier_a, supplier_b])
        db.add_all([
            SupplierServiceArea(supplier_id=supplier_a_id, area_key="maninagar", area="Maninagar"),
            SupplierServiceArea(supplier_id=supplier_b_id, area_key="maninagar", area="Maninagar"),
        ])
        # BALAJI Wafers: ₹10/packet, min 10 packets, 10 units/box (1 Box = 10 pkts = ₹100)
        balaji = Product(
            id=product_balaji_id,
            supplier_id=supplier_a_id,
            name="BALAJI Waffers",
            brand="Balaji",
            category="Snacks",
            pack_size="100g",
            price=10.0,
            minimum_quantity=10,
            units_per_box=10,
            is_active=True
        )
        # Standard product: units_per_box = 1
        rice = Product(
            id=product_standard_id,
            supplier_id=supplier_a_id,
            name="Standard Rice",
            brand="Standard",
            category="Staples",
            pack_size="5 kg",
            price=200.0,
            minimum_quantity=1,
            units_per_box=1,
            is_active=True
        )
        # Supplier B product: ₹15/unit, min 20, units_per_box = 10
        prod_b = Product(
            id=product_b1_id,
            supplier_id=supplier_b_id,
            name="Supplier B Drink",
            brand="BrandB",
            category="Beverages",
            pack_size="250 ml",
            price=15.0,
            minimum_quantity=20,
            units_per_box=10,
            is_active=True
        )
        db.add_all([balaji, rice, prod_b])
        db.commit()

    return supplier_a_id, supplier_b_id, product_balaji_id, product_standard_id, product_b1_id


def test_box_packaging_calculations_and_checkout():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, product_balaji, product_standard, product_b1 = create_box_catalog(suffix)

        # 1. 1 Box = 10 packets = ₹100
        checkout_payload_1box = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": product_balaji, "quantity": 10}
            ]
        }
        resp = client.post("/api/checkout", json=checkout_payload_1box)
        assert resp.status_code == 201, resp.json()
        order_1box = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order_1box["subtotal"] == 100.0
        item = order_1box["items"][0]
        assert item["quantity"] == 10
        assert item["unitsPerBoxSnapshot"] == 10
        assert item["boxes"] == 1
        assert item["lineTotal"] == 100.0

        # 2. 3 Boxes = 30 packets = ₹300
        checkout_payload_3boxes = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": product_balaji, "quantity": 30}
            ]
        }
        resp3 = client.post("/api/checkout", json=checkout_payload_3boxes)
        assert resp3.status_code == 201, resp3.json()
        order_3boxes = resp3.json()["data"]["checkout"]["supplierOrders"][0]
        assert order_3boxes["subtotal"] == 300.0
        item3 = order_3boxes["items"][0]
        assert item3["quantity"] == 30
        assert item3["boxes"] == 3
        assert item3["lineTotal"] == 300.0


def test_invalid_non_multiple_box_quantity_rejected():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, product_balaji, _, _ = create_box_catalog(suffix)

        # Quantity 15 is not a multiple of units_per_box = 10
        invalid_payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": product_balaji, "quantity": 15}
            ]
        }
        resp = client.post("/api/checkout", json=invalid_payload)
        assert resp.status_code == 400
        assert resp.json()["error"]["code"] == "INVALID_BOX_QUANTITY"


def test_units_per_box_equals_1_standard_ordering():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, _, product_standard, _ = create_box_catalog(suffix)

        # Standard product: 2 units = ₹400
        payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": product_standard, "quantity": 2}
            ]
        }
        resp = client.post("/api/checkout", json=payload)
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order["subtotal"] == 400.0
        item = order["items"][0]
        assert item["quantity"] == 2
        assert item["unitsPerBoxSnapshot"] == 1
        assert item["boxes"] == 2


def test_multi_supplier_box_checkout_and_snapshots():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, product_balaji, _, product_b1 = create_box_catalog(suffix)

        # Supplier A: 2 boxes of Balaji (20 packets @ ₹10 = ₹200)
        # Supplier B: 2 boxes of Prod B (20 packets @ ₹15 = ₹300)
        multi_payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": product_balaji, "quantity": 20},
                {"supplierId": supplier_b, "productId": product_b1, "quantity": 20}
            ]
        }
        resp = client.post("/api/checkout", json=multi_payload)
        assert resp.status_code == 201, resp.json()
        checkout = resp.json()["data"]["checkout"]
        assert checkout["totalAmount"] == 500.0
        assert len(checkout["supplierOrders"]) == 2

        with SessionLocal() as db:
            order_a = db.scalar(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier_a, SupplierOrder.checkout_id == checkout["id"]))
            assert order_a is not None
            assert order_a.subtotal == 200.0
            assert order_a.items[0].units_per_box_snapshot == 10
            assert order_a.items[0].quantity == 20

            order_b = db.scalar(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier_b, SupplierOrder.checkout_id == checkout["id"]))
            assert order_b is not None
            assert order_b.subtotal == 300.0
            assert order_b.items[0].units_per_box_snapshot == 10
            assert order_b.items[0].quantity == 20
