from __future__ import annotations
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Shop, Supplier, SupplierServiceArea, User


def test_supplier_shop_owners_matching_areas():
    suffix = uuid4().hex[:8]
    with TestClient(app) as client:
        # 1. Register supplier in Maninagar
        supplier_reg = client.post("/api/auth/register/supplier", json={
            "name": f"Area Supplier {suffix}",
            "businessName": f"Area Supply Desk {suffix}",
            "category": "FMCG",
            "phone": f"9{suffix[:9]}",
            "email": f"supplier-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
            "area": "Maninagar, Bopal",
        })
        assert supplier_reg.status_code == 201, supplier_reg.json()

        # 2. Register matching shop owner in Maninagar
        owner_maninagar = client.post("/api/auth/register/shop-owner", json={
            "name": f"Maninagar Owner {suffix}",
            "shopName": f"Maninagar Mart {suffix}",
            "shopAddress": "12 Station Road",
            "area": "Maninagar",
            "phone": f"8{suffix[:9]}",
            "email": f"owner-mani-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
        })
        assert owner_maninagar.status_code == 201, owner_maninagar.json()

        # 3. Register non-matching shop owner in Surat
        owner_surat = client.post("/api/auth/register/shop-owner", json={
            "name": f"Surat Owner {suffix}",
            "shopName": f"Surat Mart {suffix}",
            "shopAddress": "5 Ring Road",
            "area": "Surat Central",
            "phone": f"7{suffix[:9]}",
            "email": f"owner-surat-{suffix}@example.com",
            "password": "Password123!",
            "confirmPassword": "Password123!",
        })
        assert owner_surat.status_code == 201, owner_surat.json()

        # 4. Supplier logs in and fetches shop owners
        login_resp = client.post("/api/auth/login", json={
            "emailOrPhone": f"supplier-{suffix}@example.com",
            "password": "Password123!",
        })
        assert login_resp.status_code == 200, login_resp.json()

        resp = client.get("/api/supplier/shop-owners")
        assert resp.status_code == 200, resp.json()
        data = resp.json()["data"]
        shop_owners = data["shopOwners"]
        names = [s["shopName"] for s in shop_owners]

        assert f"Maninagar Mart {suffix}" in names
        assert f"Surat Mart {suffix}" not in names
