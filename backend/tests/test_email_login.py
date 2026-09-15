import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from app.main import app, startup
from app.database import Base, engine

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

def test_shop_owner_login_with_email():
    # 1. Register Shop Owner with email
    reg = client.post("/api/auth/register/shop-owner", json={
        "name": "Shop Owner One",
        "shopName": "Owner Store",
        "shopAddress": "123 Street",
        "area": "Central",
        "phone": "9999900001",
        "email": "ShopOwner@Example.Com",
        "password": "MySecretPassword123!",
        "confirmPassword": "MySecretPassword123!"
    })
    assert reg.status_code == 201, reg.json()

    # 2. Login with lowercase email
    log1 = client.post("/api/auth/login", json={
        "emailOrPhone": "shopowner@example.com",
        "password": "MySecretPassword123!"
    })
    assert log1.status_code == 200, log1.json()
    assert log1.json()["data"]["user"]["email"] == "shopowner@example.com"

    # 3. Login with mixed-case email
    log2 = client.post("/api/auth/login", json={
        "emailOrPhone": "ShopOwner@Example.Com",
        "password": "MySecretPassword123!"
    })
    assert log2.status_code == 200, log2.json()

    # 4. Login with phone number
    log3 = client.post("/api/auth/login", json={
        "emailOrPhone": "9999900001",
        "password": "MySecretPassword123!"
    })
    assert log3.status_code == 200, log3.json()

def test_supplier_login_with_email():
    # Register Supplier with email
    reg = client.post("/api/auth/register/supplier", json={
        "name": "Supplier One",
        "area": "Industrial Park",
        "phone": "9999900002",
        "email": "supplier.one@testdomain.com",
        "password": "SupplierPassword123!",
        "confirmPassword": "SupplierPassword123!"
    })
    assert reg.status_code == 201, reg.json()

    # Login with email
    log = client.post("/api/auth/login", json={
        "emailOrPhone": "supplier.one@testdomain.com",
        "password": "SupplierPassword123!"
    })
    assert log.status_code == 200, log.json()

def test_gruh_udyog_login_with_email():
    # Register Gruh Udyog with email
    reg = client.post("/api/auth/register/gruh-udyog", json={
        "name": "Gruh Udyog One",
        "area": "Village Zone",
        "phone": "9999900003",
        "email": "gruh.udyog@village.org",
        "password": "GruhPassword123!",
        "confirmPassword": "GruhPassword123!"
    })
    assert reg.status_code == 201, reg.json()

    # Login with email
    log = client.post("/api/auth/login", json={
        "emailOrPhone": "gruh.udyog@village.org",
        "password": "GruhPassword123!"
    })
    assert log.status_code == 200, log.json()

if __name__ == "__main__":
    reset_db()
    print("Testing email logins across all roles...")
    test_shop_owner_login_with_email()
    test_supplier_login_with_email()
    test_gruh_udyog_login_with_email()
    print("ALL EMAIL LOGIN TESTS PASSED SUCCESSFULLY!")
