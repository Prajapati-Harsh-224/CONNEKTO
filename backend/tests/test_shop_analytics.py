import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.main import app
from app.models import Product


def test_shop_analytics_empty_and_with_orders():
    client = TestClient(app)
    suffix = uuid4().hex[:8]

    # Register supplier
    supp_res = client.post(
        "/api/auth/register/supplier",
        json={
            "name": f"Supplier {suffix}",
            "area": "Maninagar",
            "phone": f"9{suffix[:9]}",
            "email": f"supp-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
        },
    )
    assert supp_res.status_code == 201
    supp_id = f"supplier-{supp_res.json()['data']['user']['id'][:8]}"

    # Add product
    prod_id = f"prod-{suffix}"
    with SessionLocal() as db:
        db.add(
            Product(
                id=prod_id,
                supplier_id=supp_id,
                name="Test Chai Biscuit",
                brand="Test Brand",
                category="Snacks",
                pack_size="200g",
                price=60.0,
                minimum_quantity=1,
                available_stock=100,
                is_active=True,
            )
        )
        db.commit()

    # Register shop owner
    owner_res = client.post(
        "/api/auth/register/shop-owner",
        json={
            "name": f"Owner {suffix}",
            "shopName": f"Shop {suffix}",
            "shopAddress": "123 Market Rd",
            "area": "Maninagar",
            "phone": f"8{suffix[:9]}",
            "email": f"owner-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
        },
    )
    assert owner_res.status_code == 201

    # Verify empty analytics
    analytics_empty = client.get("/api/analytics/shop")
    assert analytics_empty.status_code == 200, analytics_empty.text
    data_empty = analytics_empty.json()["data"]
    assert data_empty["totalOrderValue"] == 0
    assert data_empty["totalOrders"] == 0
    assert len(data_empty["ordersOverTime"]) == 6
    assert data_empty["topProducts"] == []
    assert data_empty["supplierSpending"] == []

    # Place order
    checkout_res = client.post(
        "/api/checkout",
        json={
            "paymentMethod": "CASH_ON_DELIVERY",
            "items": [
                {
                    "supplierId": supp_id,
                    "productId": prod_id,
                    "quantity": 10,
                }
            ],
        },
    )
    assert checkout_res.status_code == 201, checkout_res.text

    # Fetch analytics with order
    analytics_res = client.get("/api/analytics/shop")
    assert analytics_res.status_code == 200, analytics_res.text
    data = analytics_res.json()["data"]
    assert data["totalOrders"] == 1
    assert data["totalOrderValue"] == 600.0
    assert len(data["supplierSpending"]) == 1
    assert data["supplierSpending"][0]["value"] == 600.0
    assert len(data["topProducts"]) == 1
    assert data["topProducts"][0]["name"] == "Test Chai Biscuit"
    assert data["topProducts"][0]["quantity"] == 10
    assert data["topProducts"][0]["spent"] == 600.0


def test_shop_analytics_requires_shop_owner_role():
    client = TestClient(app)
    suffix = uuid4().hex[:8]

    # Register supplier and try to access shop analytics
    supp_res = client.post(
        "/api/auth/register/supplier",
        json={
            "name": f"Supplier {suffix}",
            "area": "Maninagar",
            "phone": f"9{suffix[:9]}",
            "email": f"supp-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
        },
    )
    assert supp_res.status_code == 201

    analytics_res = client.get("/api/analytics/shop")
    assert analytics_res.status_code == 403
