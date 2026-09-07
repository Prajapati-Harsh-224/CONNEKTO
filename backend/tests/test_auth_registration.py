import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend folder is in path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.database import Base, engine

def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

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
