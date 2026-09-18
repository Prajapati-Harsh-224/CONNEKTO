import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend folder is in path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from datetime import datetime

import pytest
from app.main import app, startup, hash_password
from app.database import Base, engine, SessionLocal
from app.models import Checkout, Supplier, SupplierOrder, User

@pytest.fixture(autouse=True, scope="module")
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        startup()
    except Exception:
        pass
    yield

client = TestClient(app)

def test_shop_owner_registration():
    response = client.post("/api/auth/register/shop-owner", json={
        "name": "Test Shop Owner",
        "shopName": "Owner Superstore",
        "shopAddress": "123 Main Market Street",
        "area": "Downtown",
        "phone": "9876543210",
        "email": "owner@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "SHOP_OWNER"
    assert data["data"]["user"]["name"] == "Test Shop Owner"
    assert data["data"]["user"]["area"] == "Downtown"

def test_supplier_registration():
    response = client.post("/api/auth/register/supplier", json={
        "name": "Test Supplier",
        "area": "Industrial Area Phase 1",
        "phone": "9876543211",
        "email": "supplier@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "SUPPLIER"
    assert data["data"]["user"]["name"] == "Test Supplier"
    assert data["data"]["user"]["area"] == "Industrial Area Phase 1"

def test_gruh_udyog_registration():
    response = client.post("/api/auth/register/gruh-udyog", json={
        "name": "Test Gruh Udyog",
        "area": "Rural Craft Zone",
        "phone": "9876543212",
        "email": "gruhudyog@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "GRUH_UDYOG"
    assert data["data"]["user"]["name"] == "Test Gruh Udyog"
    assert data["data"]["user"]["area"] == "Rural Craft Zone"

def test_login_with_phone_and_email():
    res_email = client.post("/api/auth/login", json={
        "emailOrPhone": "owner@example.com",
        "password": "Password123!"
    })
    assert res_email.status_code == 200, res_email.json()

    res_phone = client.post("/api/auth/login", json={
        "emailOrPhone": "9876543210",
        "password": "Password123!"
    })
    assert res_phone.status_code == 200, res_phone.json()

def test_registration_validation_errors():
    response = client.post("/api/auth/register/supplier", json={
        "name": "Test Fail Supplier",
        "area": "Area 51",
        "phone": "9876543213",
        "email": "fail@example.com",
        "password": "Password123!",
        "confirmPassword": "DifferentPassword!"
    })
    assert response.status_code == 400
    assert response.json()["error"]["details"]["confirmPassword"] == "Passwords do not match."


def test_supplier_dashboard_includes_today_revenue_metric():
    with SessionLocal() as db:
        shop_owner = User(
            id="shop-owner-revenue",
            name="Revenue Shop Owner",
            email="revenue-owner@example.com",
            phone="9876543219",
            area="North Bopal",
            login_identifier="9876543219",
            password_hash="placeholder",
            role="SHOP_OWNER",
        )
        db.add(shop_owner)

        supplier_user = User(
            id="supplier-revenue-user",
            name="Revenue Supplier",
            email="revenue-supplier@example.com",
            phone="9876543220",
            area="North Bopal",
            login_identifier="9876543220",
            password_hash=hash_password("Password123!"),
            role="SUPPLIER",
        )
        db.add(supplier_user)
        db.commit()

        supplier = Supplier(
            id="supplier-revenue-id",
            name="Revenue Supply Desk",
            owner_id=supplier_user.id,
            location="North Bopal",
            service_areas_raw="North Bopal",
            phone=supplier_user.phone,
            email=supplier_user.email,
        )
        db.add(supplier)
        db.commit()

        checkout = Checkout(
            id="checkout-revenue-id",
            shop_owner_id=shop_owner.id,
            total_amount=2000,
            payment_method="CASH_ON_DELIVERY",
            created_at=datetime.utcnow(),
        )
        db.add(checkout)
        db.commit()

        db.add(SupplierOrder(
            id="ORD-REVENUE-1",
            checkout_id=checkout.id,
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            service_area="North Bopal",
            shop_owner_id=shop_owner.id,
            subtotal=2000,
            status="Delivered",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ))
        db.commit()

    login_response = client.post("/api/auth/login", json={
        "emailOrPhone": "revenue-supplier@example.com",
        "password": "Password123!",
    })
    assert login_response.status_code == 200, login_response.json()

    response = client.get("/api/supplier/dashboard")
    assert response.status_code == 200, response.json()

    metrics = response.json()["data"]["metrics"]
    assert any(
        metric["label"] == "Today's Revenue"
        and metric["detail"] == "Revenue received today"
        and metric["value"] == "₹2,000"
        for metric in metrics
    )

def test_gruh_udyog_dashboard_and_orders_access():
    login_response = client.post("/api/auth/login", json={
        "emailOrPhone": "gruhudyog@example.com",
        "password": "Password123!",
    })
    assert login_response.status_code == 200, login_response.json()

    # Verify Gruh Udyog can access dashboard
    dashboard_res = client.get("/api/supplier/dashboard")
    assert dashboard_res.status_code == 200, dashboard_res.json()
    assert dashboard_res.json()["success"] is True

    # Verify Gruh Udyog can access orders
    orders_res = client.get("/api/supplier/orders")
    assert orders_res.status_code == 200, orders_res.json()
    assert orders_res.json()["success"] is True


def test_login_user_not_found_shows_register_message():
    response = client.post("/api/auth/login", json={
        "emailOrPhone": "nonexistent_user@example.com",
        "password": "AnyPassword123!",
    })
    assert response.status_code == 404, response.json()
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "USER_NOT_FOUND"
    assert data["error"]["message"] == "We couldn't find your account. Let's get you registered!"


def test_check_identifier():
    res_not_found = client.post("/api/auth/check-identifier", json={"emailOrPhone": "new_unregistered@example.com"})
    assert res_not_found.status_code == 200, res_not_found.json()
    data_not_found = res_not_found.json()
    assert data_not_found["success"] is True
    assert data_not_found["data"]["exists"] is False
    assert data_not_found["data"]["status"] == "USER_NOT_FOUND"
    assert data_not_found["data"]["message"] == "We couldn't find your account. Let's get you registered!"

    res_found = client.post("/api/auth/check-identifier", json={"emailOrPhone": "owner@example.com"})
    assert res_found.status_code == 200, res_found.json()
    data_found = res_found.json()
    assert data_found["success"] is True
    assert data_found["data"]["exists"] is True
    assert data_found["data"]["status"] == "USER_FOUND"
    assert data_found["data"]["role"] == "SHOP_OWNER"
    assert data_found["data"]["dashboardPath"] == "/dashboard/shop-owner"
    assert "connecto_session" in res_found.cookies


def test_role_enforcement_only_selected_role_can_login():
    # 1. When SUPPLIER role is selected, SHOP_OWNER cannot log in or check identifier
    res_mismatch_check = client.post("/api/auth/check-identifier", json={
        "emailOrPhone": "owner@example.com",
        "role": "SUPPLIER"
    })
    assert res_mismatch_check.status_code == 403
    assert res_mismatch_check.json()["error"]["code"] == "ROLE_MISMATCH"
    assert "registered as a Shop Owner" in res_mismatch_check.json()["error"]["message"]

    res_mismatch_login = client.post("/api/auth/login", json={
        "emailOrPhone": "owner@example.com",
        "password": "Password123!",
        "role": "SUPPLIER"
    })
    assert res_mismatch_login.status_code == 403
    assert res_mismatch_login.json()["error"]["code"] == "ROLE_MISMATCH"

    # 2. When SUPPLIER role is selected, SUPPLIER can log in and gets supplier dashboard
    res_supplier_check = client.post("/api/auth/check-identifier", json={
        "emailOrPhone": "supplier@example.com",
        "role": "SUPPLIER"
    })
    assert res_supplier_check.status_code == 200
    assert res_supplier_check.json()["data"]["role"] == "SUPPLIER"
    assert res_supplier_check.json()["data"]["dashboardPath"] == "/dashboard/supplier"

    res_supplier_login = client.post("/api/auth/login", json={
        "emailOrPhone": "supplier@example.com",
        "password": "Password123!",
        "role": "SUPPLIER"
    })
    assert res_supplier_login.status_code == 200
    assert res_supplier_login.json()["data"]["role"] == "SUPPLIER"
    assert res_supplier_login.json()["data"]["dashboardPath"] == "/dashboard/supplier"

    # 3. When SHOP_OWNER role is selected, SUPPLIER cannot log in
    res_owner_mismatch = client.post("/api/auth/check-identifier", json={
        "emailOrPhone": "supplier@example.com",
        "role": "SHOP_OWNER"
    })
    assert res_owner_mismatch.status_code == 403
    assert res_owner_mismatch.json()["error"]["code"] == "ROLE_MISMATCH"

    # 4. When GRUH_UDYOG role is selected, GRUH_UDYOG can log in and gets gruh-udyog dashboard
    res_gruh_check = client.post("/api/auth/check-identifier", json={
        "emailOrPhone": "gruhudyog@example.com",
        "role": "GRUH_UDYOG"
    })
    assert res_gruh_check.status_code == 200
    assert res_gruh_check.json()["data"]["role"] == "GRUH_UDYOG"
    assert res_gruh_check.json()["data"]["dashboardPath"] == "/dashboard/gruh-udyog"


if __name__ == "__main__":
    print("Resetting test database...")
    reset_db()
    print("Running registration and login tests...")
    test_shop_owner_registration()
    test_supplier_registration()
    test_gruh_udyog_registration()
    test_login_with_phone_and_email()
    test_registration_validation_errors()
    test_login_user_not_found_shows_register_message()
    test_check_identifier()
    test_role_enforcement_only_selected_role_can_login()
    print("ALL TESTS PASSED SUCCESSFULLY!")
