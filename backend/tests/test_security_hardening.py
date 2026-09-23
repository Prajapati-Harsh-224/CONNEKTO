import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from app.main import app, limiter, startup
from app.database import Base, engine

@pytest.fixture(autouse=True, scope="module")
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        startup()
    except Exception:
        pass
    yield

client = TestClient(app)

def test_check_identifier_never_issues_session():
    """Verify that /api/auth/check-identifier checks user existence but NEVER creates or returns a session cookie."""
    suffix = uuid4().hex[:8]
    reg = client.post("/api/auth/register/shop-owner", json={
        "name": f"Check User {suffix}",
        "shopName": f"Check Shop {suffix}",
        "shopAddress": "123 Safe Street",
        "area": "Secure Area",
        "phone": f"91000{suffix[:5]}",
        "email": f"checkuser-{suffix}@example.com",
        "password": "SecurePassword123!",
        "confirmPassword": "SecurePassword123!"
    })
    assert reg.status_code == 201

    # Now make request to check-identifier using a clean client without cookies
    clean_client = TestClient(app)
    check_res = clean_client.post("/api/auth/check-identifier", json={
        "emailOrPhone": f"checkuser-{suffix}@example.com",
        "role": "SHOP_OWNER"
    })
    assert check_res.status_code == 200
    data = check_res.json()
    assert data["success"] is True
    assert data["data"]["exists"] is True
    assert data["data"]["status"] == "USER_FOUND"
    # Ensure NO session cookie is set
    assert "connecto_session" not in check_res.cookies
    assert "user" not in data["data"]  # Full user data not exposed without password

def test_login_rejects_invalid_password():
    """Verify that sign in with bad password strictly fails with 401."""
    suffix = uuid4().hex[:8]
    client.post("/api/auth/register/shop-owner", json={
        "name": f"Login User {suffix}",
        "shopName": f"Login Shop {suffix}",
        "shopAddress": "456 Street",
        "area": "Downtown",
        "phone": f"92000{suffix[:5]}",
        "email": f"loginuser-{suffix}@example.com",
        "password": "CorrectPassword123!",
        "confirmPassword": "CorrectPassword123!"
    })

    bad_login = client.post("/api/auth/login", json={
        "emailOrPhone": f"loginuser-{suffix}@example.com",
        "password": "WrongPassword999!"
    })
    assert bad_login.status_code == 401
    assert bad_login.json()["success"] is False
    assert bad_login.json()["error"]["code"] == "INVALID_CREDENTIALS"

def test_unauthenticated_checkout_denied():
    """Verify unauthenticated user cannot access checkout."""
    clean_client = TestClient(app)
    res = clean_client.post("/api/checkout", json={
        "paymentMethod": "CASH_ON_DELIVERY",
        "items": [{"supplierId": "any", "productId": "any", "quantity": 1}]
    })
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHENTICATED"

def test_shop_owner_forbidden_from_supplier_routes():
    """Verify shop owner is blocked from modifying supplier orders or managing supplier products."""
    suffix = uuid4().hex[:8]
    shop_client = TestClient(app)
    reg = shop_client.post("/api/auth/register/shop-owner", json={
        "name": f"Restricted Owner {suffix}",
        "shopName": f"Restricted Shop {suffix}",
        "shopAddress": "789 Street",
        "area": "Market",
        "phone": f"93000{suffix[:5]}",
        "email": f"restricted-{suffix}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert reg.status_code == 201

    # Try to access supplier dashboard
    dash_res = shop_client.get("/api/supplier/dashboard")
    assert dash_res.status_code == 403
    assert dash_res.json()["error"]["code"] == "FORBIDDEN"

    # Try to access supplier products
    prod_res = shop_client.get("/api/supplier/products")
    assert prod_res.status_code == 403

def test_input_validation_bounds():
    """Verify that inputs exceeding bounds or violating constraints are rejected with 400."""
    # Price <= 0 rejected
    res = client.post("/api/supplier/products", json={
        "name": "Invalid Price Product",
        "category": "FMCG",
        "packSize": "1 kg",
        "price": -10.0
    })
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"

    # Extremely long name rejected
    res2 = client.post("/api/supplier/products", json={
        "name": "A" * 200,
        "category": "FMCG",
        "packSize": "1 kg",
        "price": 100.0
    })
    assert res2.status_code == 400
    assert res2.json()["error"]["code"] == "VALIDATION_ERROR"

def test_rate_limiting_enforced():
    """Verify rate limiter triggers 429 when enabled."""
    limiter.enabled = True
    try:
        rate_client = TestClient(app)
        responses = []
        for _ in range(16):
            r = rate_client.post("/api/auth/check-identifier", json={"emailOrPhone": "nonexistent@test.com"})
            responses.append(r.status_code)
        assert 429 in responses
    finally:
        limiter.enabled = False
