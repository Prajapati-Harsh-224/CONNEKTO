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

if __name__ == "__main__":
    print("Resetting test database...")
    reset_db()
    print("Running registration and login tests...")
    test_shop_owner_registration()
    test_supplier_registration()
    test_gruh_udyog_registration()
    test_login_with_phone_and_email()
    test_registration_validation_errors()
    print("ALL TESTS PASSED SUCCESSFULLY!")
