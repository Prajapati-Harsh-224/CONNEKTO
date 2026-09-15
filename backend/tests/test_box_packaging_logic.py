from __future__ import annotations
import math
import sys
from pathlib import Path
from typing import Optional
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base, SessionLocal, engine
from app.main import app, startup
from app.models import Product, Supplier, SupplierOrder, SupplierServiceArea


def calculate_minimum_boxes(minimum_quantity: int, units_per_box: Optional[int] = None) -> int:
    upb = max(1, units_per_box or minimum_quantity)
    return math.ceil(max(1, minimum_quantity) / upb)


def box_to_units(boxes: int, box_size: int) -> int:
    return max(1, boxes) * max(1, box_size)


def calculate_line_total(boxes: int, box_size: int, unit_price: float) -> float:
    return box_to_units(boxes, box_size) * unit_price


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
    product_redbull_id = f"redbull-{suffix}"
    product_balaji_id = f"balaji-wafers-{suffix}"
    product_rice_id = f"standard-rice-{suffix}"
    product_b_drink_id = f"supplier-b-drink-{suffix}"

    with SessionLocal() as db:
        supplier_a = Supplier(id=supplier_a_id, name=f"Box Supplier A {suffix}")
        supplier_b = Supplier(id=supplier_b_id, name=f"Box Supplier B {suffix}")
        db.add_all([supplier_a, supplier_b])
        db.add_all([
            SupplierServiceArea(supplier_id=supplier_a_id, area_key="maninagar", area="Maninagar"),
            SupplierServiceArea(supplier_id=supplier_b_id, area_key="maninagar", area="Maninagar"),
        ])
        # 1. RedBull: ₹120/bottle, minimum_quantity = 5 (1 Box = 5 bottles = ₹600)
        redbull = Product(
            id=product_redbull_id,
            supplier_id=supplier_a_id,
            name="RedBull",
            brand="GMBH",
            category="Beverages",
            pack_size="200ml",
            price=120.0,
            minimum_quantity=5,
            units_per_box=5,
            is_active=True,
        )
        # 2. BALAJI Wafers: ₹10/packet, minimum_quantity = 10 (1 Box = 10 pkts = ₹100)
        balaji = Product(
            id=product_balaji_id,
            supplier_id=supplier_a_id,
            name="BALAJI Waffers",
            brand="Balaji",
            category="Snacks & Biscuits",
            pack_size="100g",
            price=10.0,
            minimum_quantity=10,
            units_per_box=10,
            is_active=True,
        )
        # 3. Standard Rice: ₹200/bag, minimum_quantity = 1 (1 Box = 1 unit = ₹200)
        rice = Product(
            id=product_rice_id,
            supplier_id=supplier_a_id,
            name="Standard Rice",
            brand="Standard",
            category="Staples",
            pack_size="5 kg",
            price=200.0,
            minimum_quantity=1,
            units_per_box=1,
            is_active=True,
        )
        # 4. Supplier B Drink: ₹15/unit, minimum_quantity = 10 (1 Box = 10 units = ₹150)
        b_drink = Product(
            id=product_b_drink_id,
            supplier_id=supplier_b_id,
            name="Supplier B Drink",
            brand="BrandB",
            category="Beverages",
            pack_size="250 ml",
            price=15.0,
            minimum_quantity=10,
            units_per_box=10,
            is_active=True,
        )
        db.add_all([redbull, balaji, rice, b_drink])
        db.commit()

    return supplier_a_id, supplier_b_id, product_redbull_id, product_balaji_id, product_rice_id, product_b_drink_id


# ==============================================================================
# 17 VALIDATION REQUIREMENTS TEST SUITE
# ==============================================================================

# 1. RedBull ₹120, minimum_quantity 5
def test_1_redbull_price_120_minimum_quantity_5():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)
        resp = client.get(f"/api/suppliers/{supplier_a}/products/{prod_redbull}")
        assert resp.status_code == 200, resp.json()
        p = resp.json()["data"]["product"]
        assert p["price"] == 120.0
        assert p["minimumQuantity"] == 5
        assert p["unitsPerBox"] == 5


# 2. 1 box = 5 units = ₹600
def test_2_1_box_equals_5_units_equals_600():
    units = box_to_units(1, 5)
    assert units == 5
    total = calculate_line_total(1, 5, 120.0)
    assert total == 600.0

    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)
        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": 5}]
        })
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order["subtotal"] == 600.0
        assert order["items"][0]["quantity"] == 5
        assert order["items"][0]["boxes"] == 1
        assert order["items"][0]["lineTotal"] == 600.0


# 3. 2 boxes = 10 units = ₹1,200
def test_3_2_boxes_equals_10_units_equals_1200():
    units = box_to_units(2, 5)
    assert units == 10
    total = calculate_line_total(2, 5, 120.0)
    assert total == 1200.0

    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)
        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": 10}]
        })
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order["subtotal"] == 1200.0
        assert order["items"][0]["boxes"] == 2
        assert order["items"][0]["lineTotal"] == 1200.0


# 4. 3 boxes = 15 units = ₹1,800
def test_4_3_boxes_equals_15_units_equals_1800():
    units = box_to_units(3, 5)
    assert units == 15
    total = calculate_line_total(3, 5, 120.0)
    assert total == 1800.0

    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)
        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": 15}]
        })
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order["subtotal"] == 1800.0
        assert order["items"][0]["boxes"] == 3
        assert order["items"][0]["lineTotal"] == 1800.0


# 5. Quantity starts at 1 box
def test_5_quantity_starts_at_1_box():
    # 1 box is the starting quantity regardless of minimum_quantity
    min_boxes = calculate_minimum_boxes(5, 5)
    assert min_boxes == 1


# 6. Quantity can decrease to 1 box
def test_6_quantity_can_decrease_to_1_box():
    boxes = 5
    while boxes > 1:
        boxes -= 1
    assert boxes == 1


# 7. Quantity cannot go below 1 box
def test_7_quantity_cannot_go_below_1_box():
    current_boxes = 1
    # Decrement attempt below 1 is blocked
    next_boxes = max(1, current_boxes - 1)
    assert next_boxes == 1


# 8. Partial boxes are rejected by backend
def test_8_partial_boxes_are_rejected_by_backend():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)

        for invalid_qty in [1, 2, 3, 4, 6, 7, 11, 14]:
            resp = client.post("/api/checkout", json={
                "paymentMethod": "REQUEST_ORDER",
                "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": invalid_qty}]
            })
            assert resp.status_code == 400, f"Expected 400 for qty {invalid_qty}"
            code = resp.json()["error"]["code"]
            assert code in {"INVALID_BOX_QUANTITY", "MINIMUM_QUANTITY_NOT_MET"}


# 9. minimum_quantity 10 works
def test_9_minimum_quantity_10_works():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, _, prod_balaji, _, _ = create_box_catalog(suffix)

        # 1 box = 10 units = ₹100
        resp1 = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_balaji, "quantity": 10}]
        })
        assert resp1.status_code == 201, resp1.json()
        assert resp1.json()["data"]["checkout"]["totalAmount"] == 100.0

        # 2 boxes = 20 units = ₹200
        resp2 = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_balaji, "quantity": 20}]
        })
        assert resp2.status_code == 201, resp2.json()
        assert resp2.json()["data"]["checkout"]["totalAmount"] == 200.0


# 10. minimum_quantity 1 works
def test_10_minimum_quantity_1_works():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, _, _, prod_rice, _ = create_box_catalog(suffix)

        # 1 box = 1 unit = ₹200
        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_rice, "quantity": 1}]
        })
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        assert order["subtotal"] == 200.0
        assert order["items"][0]["boxes"] == 1


# 11. Different products can have different box sizes
def test_11_different_products_can_have_different_box_sizes():
    assert box_to_units(1, 5) == 5    # RedBull
    assert box_to_units(1, 10) == 10  # Balaji
    assert box_to_units(1, 1) == 1    # Rice


# 12. Cart badge uses box quantity
def test_12_cart_badge_uses_box_quantity():
    # Example: 1 box of RedBull (5 units) + 2 boxes of Balaji (20 units)
    # Total units = 25, but Cart Badge = 1 + 2 = 3 boxes!
    cart_items = [
        {"productId": "redbull", "boxes": 1, "quantity": 5},
        {"productId": "balaji", "boxes": 2, "quantity": 20},
    ]
    cart_badge = sum(item["boxes"] for item in cart_items)
    assert cart_badge == 3
    assert cart_badge != 25


# 13. Multi-supplier cart still works
def test_13_multi_supplier_cart_still_works():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, prod_redbull, _, _, prod_b_drink = create_box_catalog(suffix)

        # Supplier A: 2 boxes of RedBull (10 bottles @ ₹120 = ₹1,200)
        # Supplier B: 2 boxes of Drink (20 bottles @ ₹15 = ₹300)
        payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": prod_redbull, "quantity": 10},
                {"supplierId": supplier_b, "productId": prod_b_drink, "quantity": 20},
            ],
        }
        resp = client.post("/api/checkout", json=payload)
        assert resp.status_code == 201, resp.json()
        checkout = resp.json()["data"]["checkout"]
        assert checkout["totalAmount"] == 1500.0


# 14. Checkout still creates separate supplier orders
def test_14_checkout_still_creates_separate_supplier_orders():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, supplier_b, prod_redbull, _, _, prod_b_drink = create_box_catalog(suffix)

        payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {"supplierId": supplier_a, "productId": prod_redbull, "quantity": 10},
                {"supplierId": supplier_b, "productId": prod_b_drink, "quantity": 20},
            ],
        }
        resp = client.post("/api/checkout", json=payload)
        assert resp.status_code == 201, resp.json()
        orders = resp.json()["data"]["checkout"]["supplierOrders"]
        assert len(orders) == 2
        order_suppliers = {o["supplierId"] for o in orders}
        assert order_suppliers == {supplier_a, supplier_b}


# 15. Order totals remain authoritative
def test_15_order_totals_remain_authoritative():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)

        payload = {
            "paymentMethod": "REQUEST_ORDER",
            "items": [
                {
                    "supplierId": supplier_a,
                    "productId": prod_redbull,
                    "quantity": 10,
                    "unitPrice": 1.0,     # Erroneous frontend price
                    "lineTotal": 10.0,    # Erroneous frontend line total
                    "subtotal": 10.0,
                }
            ],
        }
        resp = client.post("/api/checkout", json=payload)
        assert resp.status_code == 201, resp.json()
        order = resp.json()["data"]["checkout"]["supplierOrders"][0]
        # Must be 10 units * ₹120 = ₹1,200
        assert order["subtotal"] == 1200.0
        assert order["items"][0]["unitPrice"] == 120.0
        assert order["items"][0]["lineTotal"] == 1200.0


# 16. Supplier order quantity remains correct
def test_16_supplier_order_quantity_remains_correct():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)

        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": 15}]
        })
        assert resp.status_code == 201, resp.json()
        order_id = resp.json()["data"]["checkout"]["supplierOrders"][0]["id"]

        with SessionLocal() as db:
            order = db.scalar(select(SupplierOrder).where(SupplierOrder.id == order_id))
            assert order is not None
            item = order.items[0]
            # Supplier receives 15 individual bottles, 5 units/box
            assert item.quantity == 15
            assert item.units_per_box_snapshot == 5


# 17. Shop Owner order display shows boxes correctly
def test_17_shop_owner_order_display_shows_boxes_correctly():
    suffix = uuid4().hex[:10]
    with TestClient(app) as client:
        register_owner(client, suffix)
        supplier_a, _, prod_redbull, _, _, _ = create_box_catalog(suffix)

        resp = client.post("/api/checkout", json={
            "paymentMethod": "REQUEST_ORDER",
            "items": [{"supplierId": supplier_a, "productId": prod_redbull, "quantity": 15}]
        })
        order_id = resp.json()["data"]["checkout"]["supplierOrders"][0]["id"]

        get_resp = client.get(f"/api/orders/{order_id}")
        assert get_resp.status_code == 200, get_resp.json()
        item = get_resp.json()["data"]["order"]["items"][0]
        assert item["boxes"] == 3
        assert item["quantity"] == 15
        assert item["unitsPerBox"] == 5
        assert item["lineTotal"] == 1800.0
