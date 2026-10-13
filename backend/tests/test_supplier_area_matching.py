import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.main import app
from app.models import Supplier, SupplierServiceArea, User


def registration_payload(name, email, phone, area):
    return {
        "name": name,
        "area": area,
        "phone": phone,
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def shop_owner_payload(name, email, phone, area):
    return {
        "name": name,
        "shopName": f"{name} Store",
        "shopAddress": "123 Market Street",
        "area": area,
        "phone": phone,
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
    }


def test_supplier_service_area_matching_is_case_insensitive_and_supports_multiple_areas():
    suffix = uuid4().hex[:8]
    matching_name = f"Matching Supplier {suffix}"
    excluded_name = f"Excluded Supplier {suffix}"

    with TestClient(app) as client:
        matching = client.post(
            "/api/auth/register/supplier",
            json={
                **registration_payload(matching_name, f"matching-{suffix}@example.com", f"90000{suffix[:5]}", "Maninagar, Bapunagar"),
                "serviceAreas": ["Maninagar", " Bapunagar "],
            },
        )
        assert matching.status_code == 201, matching.json()

        excluded = client.post(
            "/api/auth/register/supplier",
            json={
                **registration_payload(excluded_name, f"excluded-{suffix}@example.com", f"91111{suffix[:5]}", "Bopal, Satellite"),
                "serviceAreas": ["Bopal", "Satellite"],
            },
        )
        assert excluded.status_code == 201, excluded.json()

        with SessionLocal() as db:
            supplier = db.scalar(select(Supplier).where(Supplier.name == f"{matching_name}'s Supply Desk"))
            stored_areas = db.scalars(select(SupplierServiceArea).where(SupplierServiceArea.supplier_id == supplier.id)).all()
            assert {area.area_key for area in stored_areas} == {"maninagar", "bapunagar"}

        owner_email = f"owner-{suffix}@example.com"
        owner = client.post(
            "/api/auth/register/shop-owner",
            json=shop_owner_payload(f"Owner {suffix}", owner_email, f"92222{suffix[:5]}", "  mANINAGAR  "),
        )
        assert owner.status_code == 201, owner.json()

        response = client.get("/api/suppliers")
        assert response.status_code == 200, response.json()
        suppliers = response.json()["data"]["suppliers"]
        supplier_names = {supplier["name"] for supplier in suppliers}
        assert f"{matching_name}'s Supply Desk" in supplier_names
        assert f"{excluded_name}'s Supply Desk" not in supplier_names

        matching_supplier = next(supplier for supplier in suppliers if supplier["name"] == f"{matching_name}'s Supply Desk")
        assert matching_supplier["serviceAreas"] == ["Bapunagar", "Maninagar"]

        with SessionLocal() as db:
            excluded_supplier = db.scalar(select(Supplier).where(Supplier.name == f"{excluded_name}'s Supply Desk"))
            assert client.get(f"/api/suppliers/{excluded_supplier.id}").status_code == 404


def test_supplier_discovery_returns_empty_for_an_area_without_suppliers_and_requires_authentication():
    suffix = uuid4().hex[:8]
    with TestClient(app) as client:
        response = client.get("/api/suppliers")
        assert response.status_code == 401

        owner = client.post(
            "/api/auth/register/shop-owner",
            json=shop_owner_payload(f"No Match Owner {suffix}", f"no-match-{suffix}@example.com", f"93333{suffix[:5]}", f"NoMatchArea{suffix}"),
        )
        assert owner.status_code == 201, owner.json()

        response = client.get("/api/suppliers")
        assert response.status_code == 200, response.json()
        assert response.json()["data"]["suppliers"] == []
