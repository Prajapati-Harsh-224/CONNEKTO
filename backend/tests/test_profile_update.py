from fastapi.testclient import TestClient
from uuid import uuid4
from sqlalchemy import select
from app.main import app
from app.database import SessionLocal
from app.models import Supplier, SupplierServiceArea, User

def test_profile_update_and_area_logic():
    suffix = uuid4().hex[:8]
    client = TestClient(app)

    # 1. Register a supplier
    resp = client.post("/api/auth/register/supplier", json={
        "name": f"Supplier {suffix}",
        "area": "Maninagar",
        "serviceAreas": ["Maninagar"],
        "category": "FMCG",
        "phone": f"987{suffix[:7]}",
        "email": f"supplier-{suffix}@test.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert resp.status_code == 201, resp.json()

    # 2. Update profile with new area, phone, multiple categories, and email
    new_categories = ["FMCG", "Beverages", "Dairy & Bakery"]
    new_areas = ["Maninagar", "Vastrapur", "Bopal"]
    update_resp = client.put("/api/auth/profile", json={
        "name": f"Updated Supplier {suffix}",
        "email": f"new-email-{suffix}@test.com",
        "phone": f"988{suffix[:7]}",
        "serviceAreas": new_areas,
        "categories": new_categories
    })
    assert update_resp.status_code == 200, update_resp.json()
    user_data = update_resp.json()["data"]["user"]
    assert user_data["name"] == f"Updated Supplier {suffix}"
    assert user_data["email"] == f"new-email-{suffix}@test.com"
    assert user_data["phone"] == f"988{suffix[:7]}"
    assert set(user_data["supplier"]["categories"]) == set(new_categories)
    assert set(user_data["supplier"]["serviceAreas"]) == set(new_areas)

    # 3. Check DB SupplierServiceArea logic
    with SessionLocal() as db:
        user_id = user_data["id"]
        supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user_id))
        stored_areas = db.scalars(select(SupplierServiceArea).where(SupplierServiceArea.supplier_id == supplier.id)).all()
        assert {sa.area_key for sa in stored_areas} == {"maninagar", "vastrapur", "bopal"}

    # 4. Register a shop owner in Bopal and verify area matching works!
    shop_client = TestClient(app)
    shop_resp = shop_client.post("/api/auth/register/shop-owner", json={
        "name": f"Shop Owner {suffix}",
        "shopName": f"Shop {suffix}",
        "shopAddress": "123 Bopal Cross Rd",
        "area": "Bopal",
        "phone": f"989{suffix[:7]}",
        "email": f"shop-{suffix}@test.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    })
    assert shop_resp.status_code == 201, shop_resp.json()

    # Shop owner should discover the updated supplier in Bopal!
    suppliers_resp = shop_client.get("/api/suppliers")
    assert suppliers_resp.status_code == 200
    matched_suppliers = suppliers_resp.json()["data"]["suppliers"]
    matched_ids = [s["id"] for s in matched_suppliers]
    assert supplier.id in matched_ids
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_profile_update_and_area_logic()
