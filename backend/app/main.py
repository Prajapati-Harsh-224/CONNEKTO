from __future__ import annotations
import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.orm import Session, joinedload, object_session

from .database import Base, SessionLocal, engine, get_db
from .models import Checkout, OrderItem, Product, SessionToken, Shop, Supplier, SupplierOrder, SupplierServiceArea, User
from .schemas import CheckoutRequest, LoginRequest, CheckIdentifierRequest, ProductRequest, ShopOwnerRegisterRequest, SupplierRegisterRequest, GruhUdyogRegisterRequest, StatusRequest, ProfileUpdateRequest

SESSION_COOKIE = "connecto_session"
SESSION_DAYS = 7
CLIENT_ORIGINS = [origin.strip() for origin in os.getenv("CLIENT_ORIGIN", "http://localhost:5173").split(",") if origin.strip()]
ROLES = {"SHOP_OWNER", "SUPPLIER", "GRUH_UDYOG"}
PAYMENT_METHODS = {"CASH_ON_DELIVERY", "PAY_LATER", "REQUEST_ORDER"}
TRANSITIONS = {
    "Pending": {"Accepted", "Cancelled"}, "Accepted": {"Preparing", "Cancelled"},
    "Preparing": {"Out for Delivery", "Cancelled"}, "Out for Delivery": {"Delivered"},
    "Delivered": set(), "Cancelled": set(),
}

app = FastAPI(title="Connecto API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=CLIENT_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    alter_statements = [
        "ALTER TABLE users ADD COLUMN area VARCHAR(100)",
        "ALTER TABLE checkouts ADD COLUMN idempotency_key VARCHAR(100)",
        "ALTER TABLE suppliers ADD COLUMN category VARCHAR(100)",
        "ALTER TABLE suppliers ADD COLUMN description TEXT DEFAULT ''",
        "ALTER TABLE suppliers ADD COLUMN location VARCHAR(100) DEFAULT ''",
        "ALTER TABLE suppliers ADD COLUMN service_areas TEXT DEFAULT ''",
        "ALTER TABLE suppliers ADD COLUMN minimum_order VARCHAR(100) DEFAULT ''",
        "ALTER TABLE suppliers ADD COLUMN phone VARCHAR(30)",
        "ALTER TABLE suppliers ADD COLUMN email VARCHAR(255)",
        "ALTER TABLE suppliers ADD COLUMN is_verified BOOLEAN DEFAULT 0",
        "ALTER TABLE suppliers ADD COLUMN rating NUMERIC(3, 2)",
        "ALTER TABLE suppliers ADD COLUMN review_count INTEGER DEFAULT 0",
        "ALTER TABLE suppliers ADD COLUMN tags TEXT DEFAULT ''",
        "ALTER TABLE products ADD COLUMN units_per_box INTEGER DEFAULT 1",
        "ALTER TABLE products ADD COLUMN available_stock INTEGER DEFAULT 0",
        "ALTER TABLE products ADD COLUMN description TEXT DEFAULT ''",
        "ALTER TABLE supplier_order_items ADD COLUMN units_per_box_snapshot INTEGER DEFAULT 1",
    ]
    with engine.begin() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
    try:
        backfill_supplier_service_areas()
    except Exception:
        pass

try:
    startup()
except Exception:
    pass



def envelope(data=None, message="OK", success=True):
    return {"success": success, "message": message, "data": data}


def error(message, code, status, details=None):
    payload = {"success": False, "error": {"code": code, "message": message}}
    if details:
        payload["error"]["details"] = details
    return JSONResponse(payload, status_code=status)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split(":", 1)
        candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return hmac.compare_digest(candidate.hex(), digest)
    except (ValueError, TypeError):
        return False


def normalize_identifier(value: str) -> str:
    value = value.strip()
    return value.lower() if "@" in value else value.replace(" ", "").replace("-", "")


def normalize_area_label(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def normalize_area_key(value: str) -> str:
    return normalize_area_label(value).casefold()


def service_area_values(values: list[str]) -> list[str]:
    result = []
    seen = set()
    for value in values:
        for part in value.replace("\n", ",").split(","):
            label = normalize_area_label(part)
            key = normalize_area_key(label)
            if label and key not in seen:
                result.append(label)
                seen.add(key)
    return result


def backfill_supplier_service_areas() -> None:
    with SessionLocal() as db:
        changed = False
        rows = db.execute(select(Supplier, User.area).join(User, Supplier.owner_id == User.id, isouter=True)).all()
        for supplier, owner_area in rows:
            if db.scalar(select(SupplierServiceArea).where(SupplierServiceArea.supplier_id == supplier.id)):
                continue
            areas = service_area_values([owner_area] if owner_area else [])
            for area in areas:
                db.add(SupplierServiceArea(supplier_id=supplier.id, area_key=normalize_area_key(area), area=area))
                changed = True
        if changed:
            db.commit()


def safe_user(user: User, db: Session | None = None) -> dict:
    if db is None:
        try:
            db = object_session(user)
        except Exception:
            db = None
    if db is None:
        with SessionLocal() as fallback_db:
            return safe_user(user, db=fallback_db)
    user_area = user.area or (user.shop.area if user.shop else None)
    result = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "area": user_area,
        "role": user.role,
        "createdAt": user.created_at.isoformat()
    }
    if user.shop:
        result["shop"] = {"name": user.shop.name, "address": user.shop.address, "area": user.shop.area}

    if db and user.role in {"SUPPLIER", "GRUH_UDYOG"}:
        supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
        if supplier:
            db_areas = db.scalars(
                select(SupplierServiceArea.area)
                .where(SupplierServiceArea.supplier_id == supplier.id)
                .order_by(SupplierServiceArea.area)
            ).all()
            if db_areas:
                service_areas = list(db_areas)
            elif supplier.service_areas_raw:
                service_areas = [a.strip() for a in supplier.service_areas_raw.split(",") if a.strip()]
            else:
                service_areas = [sa.area for sa in supplier.service_areas]

            categories = [c.strip() for c in (supplier.category or "").split(",") if c.strip()]
            result["supplier"] = {
                "id": supplier.id,
                "name": supplier.name,
                "category": supplier.category or "",
                "categories": categories,
                "serviceAreas": service_areas,
                "area": supplier.location or (service_areas[0] if service_areas else user_area),
                "phone": supplier.phone or user.phone,
                "email": supplier.email or user.email
            }
            if service_areas:
                result["area"] = ", ".join(service_areas)
                result["serviceAreas"] = service_areas
            if categories:
                result["category"] = supplier.category
                result["categories"] = categories
    return result


def current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    session = db.get(SessionToken, token)
    if not session or session.expires_at <= datetime.utcnow():
        return None
    return db.get(User, session.user_id)


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = current_user(request, db)
    if not user:
        raise AuthError()
    return user

class AuthError(Exception):
    pass

@app.exception_handler(AuthError)
def auth_error(_: Request, __: AuthError):
    return error("Authentication is required.", "UNAUTHENTICATED", 401)


def set_session(response, db: Session, user: User):
    token = secrets.token_urlsafe(48)
    db.add(SessionToken(token=token, user_id=user.id, expires_at=datetime.utcnow() + timedelta(days=SESSION_DAYS)))
    db.commit()
    response.set_cookie(SESSION_COOKIE, token, max_age=SESSION_DAYS * 86400, httponly=True, samesite="lax", secure=os.getenv("NODE_ENV") == "production")


def role_error(expected: str, user: User):
    return error(f"Only {expected} can access this resource.", "FORBIDDEN", 403)


def order_json(order: SupplierOrder) -> dict:
    shop = order.shop_owner.shop if order.shop_owner else None
    items_json = []
    for item in order.items:
        upb = getattr(item, "units_per_box_snapshot", 1) or 1
        boxes = item.quantity // upb if upb > 0 else item.quantity
        items_json.append({
            "productId": item.product_id,
            "productNameSnapshot": item.product_name_snapshot,
            "name": item.product_name_snapshot,
            "imageUrl": item.product_image_url_snapshot or "",
            "quantity": item.quantity,
            "unitsPerBoxSnapshot": upb,
            "unitsPerBox": upb,
            "boxes": boxes,
            "unitPriceSnapshot": float(item.unit_price_snapshot),
            "unitPrice": float(item.unit_price_snapshot),
            "lineTotal": float(item.line_total)
        })
    customer_name = shop.name if shop else (order.shop_owner.name if order.shop_owner else "Retail Shop")
    return {
        "id": order.id,
        "checkoutId": order.checkout_id,
        "supplierId": order.supplier_id,
        "supplierName": order.supplier_name,
        "serviceArea": order.service_area,
        "area": order.service_area,
        "shopOwnerId": order.shop_owner_id,
        "shopOwner": order.shop_owner.name if order.shop_owner else "",
        "shopOwnerName": order.shop_owner.name if order.shop_owner else "",
        "shopOwnerPhone": order.shop_owner.phone if order.shop_owner else "",
        "shopName": shop.name if shop else "",
        "shopAddress": shop.address if shop else "",
        "customer": customer_name,
        "subtotal": float(order.subtotal),
        "amount": float(order.subtotal),
        "status": order.status,
        "paymentMethod": order.checkout.payment_method if order.checkout else None,
        "createdAt": order.created_at.isoformat(),
        "updatedAt": order.updated_at.isoformat(),
        "items": items_json
    }


def owned_supplier(user: User, db: Session):
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    if not supplier and user.role in {"SUPPLIER", "GRUH_UDYOG"}:
        clean_area = user.area or "Ahmedabad"
        name_suffix = "Gruh Udyog" if user.role == "GRUH_UDYOG" else "Supply Desk"
        supplier = Supplier(
            id=f"supplier-{user.id[:8]}",
            owner_id=user.id,
            name=f"{user.name}'s {name_suffix}",
            category="Food & Beverages" if user.role == "GRUH_UDYOG" else "FMCG",
            description="",
            location=clean_area,
            service_areas_raw=clean_area,
            minimum_order="",
            phone=user.phone or "",
            email=user.email or "",
            is_verified=False,
            rating=None,
            review_count=0
        )
        db.add(supplier)
        db.flush()
        db.add(SupplierServiceArea(supplier_id=supplier.id, area_key=normalize_area_key(clean_area), area=clean_area))
        db.commit()
        db.refresh(supplier)
    return supplier


@app.get("/api/health")
def health():
    return envelope({"service": "connecto-api", "status": "ok"}, "API is healthy")


def _process_registration(
    db: Session,
    response: Response,
    role: str,
    name: str,
    area: str,
    phone: str,
    email: str | None,
    password: str,
    confirm_password: str | None = None,
    shop_name: str | None = None,
    shop_address: str | None = None,
    identifier: str | None = None,
    category: str | None = None,
    service_areas: list[str] | None = None
):
    if role not in ROLES:
        return error("Choose a supported Connecto role.", "VALIDATION_ERROR", 400, {"role": "Choose a supported Connecto role."})

    details = {}
    clean_name = name.strip() if name else ""
    if len(clean_name) < 2:
        details["name"] = "Full name must be at least 2 characters."
    
    clean_area = normalize_area_label(area) if area else ""
    supplier_areas = service_area_values(service_areas or [area]) if role in {"SUPPLIER", "GRUH_UDYOG"} else []
    if supplier_areas:
        clean_area = supplier_areas[0]
    if len(clean_area) < 2:
        details["area"] = "Area is required."
    if role in {"SUPPLIER", "GRUH_UDYOG"} and not supplier_areas:
        details["area"] = "At least one service area is required."

    if confirm_password is not None and confirm_password != password:
        details["confirmPassword"] = "Passwords do not match."

    if role == "SHOP_OWNER":
        if not shop_name or len(shop_name.strip()) < 2:
            details["shopName"] = "Shop name is required."
        if not shop_address or len(shop_address.strip()) < 5:
            details["shopAddress"] = "Shop address is required."

    clean_phone = normalize_identifier(phone) if phone else ""
    if not phone or len(clean_phone) < 8:
        details["phone"] = "A valid phone number is required."

    clean_email = email.strip().lower() if email and email.strip() else None
    if email and email.strip() and "@" not in email:
        details["email"] = "A valid email address is required."

    if not password or len(password) < 8:
        details["password"] = "Password must be at least 8 characters."

    login_id = identifier if identifier else (clean_email or clean_phone)

    if clean_phone and db.scalar(select(User).where(User.phone == clean_phone)):
        details["phone"] = "An account with this phone number already exists."
    if clean_email and db.scalar(select(User).where(User.email == clean_email)):
        details["email"] = "An account with this email address already exists."
    if db.scalar(select(User).where(User.login_identifier == login_id)):
        details["identifier"] = "An account with this identifier already exists."

    if details:
        return error("Please correct the highlighted fields.", "VALIDATION_ERROR", 400, details)

    user = User(
        id=str(uuid4()),
        name=clean_name,
        email=clean_email,
        phone=clean_phone if clean_phone else None,
        area=clean_area,
        login_identifier=login_id,
        password_hash=hash_password(password),
        role=role
    )
    db.add(user)

    clean_category = category.strip() if category and category.strip() else "FMCG"

    if role == "SHOP_OWNER":
        db.add(Shop(id=str(uuid4()), owner=user, name=shop_name.strip(), address=shop_address.strip(), area=clean_area))
    elif role == "SUPPLIER":
        supplier = Supplier(id=f"supplier-{user.id[:8]}", owner_id=user.id, name=f"{user.name}'s Supply Desk", category=clean_category, description="", location=clean_area, service_areas_raw=", ".join(supplier_areas), minimum_order="", phone=clean_phone, email=clean_email or "", is_verified=False, rating=None, review_count=0)
        db.add(supplier)
        db.flush()
        db.add_all([SupplierServiceArea(supplier_id=supplier.id, area_key=normalize_area_key(area), area=area) for area in supplier_areas])
    elif role == "GRUH_UDYOG":
        supplier = Supplier(id=f"supplier-{user.id[:8]}", owner_id=user.id, name=f"{user.name}'s Gruh Udyog", category=clean_category, description="", location=clean_area, service_areas_raw=", ".join(supplier_areas), minimum_order="", phone=clean_phone, email=clean_email or "", is_verified=False, rating=None, review_count=0)
        db.add(supplier)
        db.flush()
        db.add_all([SupplierServiceArea(supplier_id=supplier.id, area_key=normalize_area_key(area), area=area) for area in supplier_areas])

    db.commit()
    db.refresh(user)
    set_session(response, db, user)
    return envelope({"user": safe_user(user)}, "Account created")


@app.post("/api/auth/register/shop-owner", status_code=201, summary="Shop Owner Register API")
def register_shop_owner(payload: ShopOwnerRegisterRequest, response: Response, db: Session = Depends(get_db)):
    return _process_registration(
        db=db,
        response=response,
        role="SHOP_OWNER",
        name=payload.name,
        area=payload.area,
        phone=payload.phone,
        email=payload.email,
        password=payload.password,
        confirm_password=payload.confirmPassword,
        shop_name=payload.shopName,
        shop_address=payload.shopAddress
    )


@app.post("/api/auth/register/supplier", status_code=201, summary="Supplier Register API")
def register_supplier(payload: SupplierRegisterRequest, response: Response, db: Session = Depends(get_db)):
    return _process_registration(
        db=db,
        response=response,
        role="SUPPLIER",
        name=payload.name,
        area=payload.area,
        phone=payload.phone,
        email=payload.email,
        password=payload.password,
        confirm_password=payload.confirmPassword,
        category=payload.category,
        service_areas=payload.serviceAreas
    )


@app.post("/api/auth/register/gruh-udyog", status_code=201, summary="Gruh Udyog Register API")
def register_gruh_udyog(payload: GruhUdyogRegisterRequest, response: Response, db: Session = Depends(get_db)):
    return _process_registration(
        db=db,
        response=response,
        role="GRUH_UDYOG",
        name=payload.name,
        area=payload.area,
        phone=payload.phone,
        email=payload.email,
        password=payload.password,
        confirm_password=payload.confirmPassword,
        category=payload.category,
        service_areas=payload.serviceAreas
    )

def get_role_mismatch_alert(actual_role: str) -> str:
    role = (actual_role or "").upper()
    if role == "SHOP_OWNER":
        return "you are a shopowner change role and then sign in"
    elif role == "SUPPLIER":
        return "you are a supplier change role and then sign in"
    elif role == "GRUH_UDYOG":
        return "you are a Gruh Udhyog change role and then sign in"
    return "change role and then sign in"


@app.post("/api/auth/check-identifier")
def check_identifier(payload: CheckIdentifierRequest, response: Response, db: Session = Depends(get_db)):
    raw_input = payload.emailOrPhone.strip()
    if not raw_input:
        return error("Email or phone number is required.", "VALIDATION_ERROR", 400, {"emailOrPhone": "Email or phone number is required."})

    clean_email = raw_input.lower()
    norm_phone = normalize_identifier(raw_input)

    query = select(User).where(
        or_(
            func.lower(User.email) == clean_email,
            func.lower(User.login_identifier) == clean_email,
            User.phone == norm_phone,
            User.phone == raw_input,
            User.login_identifier == norm_phone,
            User.login_identifier == raw_input
        )
    )

    user = db.scalar(query)
    if not user:
        return envelope({
            "exists": False,
            "status": "USER_NOT_FOUND",
            "message": "We couldn't find your account. Let's get you registered!"
        }, "Identifier check completed")

    if payload.role:
        expected_role = payload.role.strip().upper()
        if user.role != expected_role:
            role_display = {
                "SHOP_OWNER": "Shop Owner",
                "SUPPLIER": "Supplier",
                "GRUH_UDYOG": "Gruh Udyog"
            }
            actual_label = role_display.get(user.role, user.role.replace("_", " ").title())
            alert_msg = get_role_mismatch_alert(user.role)
            return error(
                f"{alert_msg}. This account is registered as a {actual_label}.",
                "ROLE_MISMATCH",
                403,
                {"actualRole": user.role, "expectedRole": expected_role, "alertMessage": alert_msg}
            )

    set_session(response, db, user)
    dashboard_path = "/dashboard/shop-owner" if user.role == "SHOP_OWNER" else f"/dashboard/{user.role.lower().replace('_', '-')}"

    return envelope({
        "exists": True,
        "status": "USER_FOUND",
        "role": user.role,
        "name": user.name,
        "user": safe_user(user, db=db),
        "dashboardPath": dashboard_path
    }, "User found and authenticated")

@app.post("/api/auth/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    raw_input = payload.emailOrPhone.strip()
    if not raw_input:
        return error("Email or phone number is required.", "VALIDATION_ERROR", 400, {"emailOrPhone": "Email or phone number is required."})

    clean_email = raw_input.lower()
    norm_phone = normalize_identifier(raw_input)

    # Robust case-insensitive search across email, phone, and login_identifier
    query = select(User).where(
        or_(
            func.lower(User.email) == clean_email,
            func.lower(User.login_identifier) == clean_email,
            User.phone == norm_phone,
            User.phone == raw_input,
            User.login_identifier == norm_phone,
            User.login_identifier == raw_input
        )
    )

    user = db.scalar(query)
    if not user:
        return error("We couldn't find your account. Let's get you registered!", "USER_NOT_FOUND", 404)

    if not verify_password(payload.password, user.password_hash):
        return error("The sign-in details are not valid.", "INVALID_CREDENTIALS", 401)

    if payload.role:
        expected_role = payload.role.strip().upper()
        if user.role != expected_role:
            role_display = {
                "SHOP_OWNER": "Shop Owner",
                "SUPPLIER": "Supplier",
                "GRUH_UDYOG": "Gruh Udyog"
            }
            actual_label = role_display.get(user.role, user.role.replace("_", " ").title())
            alert_msg = get_role_mismatch_alert(user.role)
            return error(
                f"{alert_msg}. This account is registered as a {actual_label}.",
                "ROLE_MISMATCH",
                403,
                {"actualRole": user.role, "expectedRole": expected_role, "alertMessage": alert_msg}
            )

    set_session(response, db, user)
    dashboard_path = "/dashboard/shop-owner" if user.role == "SHOP_OWNER" else f"/dashboard/{user.role.lower().replace('_', '-')}"

    return envelope({
        "user": safe_user(user, db=db),
        "role": user.role,
        "dashboardPath": dashboard_path
    }, "Signed in")

@app.get("/api/auth/me")
def me(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return envelope({"user": safe_user(user, db=db)}, "Current user returned")

@app.put("/api/auth/profile")
def update_profile(payload: ProfileUpdateRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    details = {}
    clean_name = payload.name.strip() if payload.name else ""
    if len(clean_name) < 2:
        details["name"] = "Full name must be at least 2 characters."

    clean_phone = normalize_identifier(payload.phone) if payload.phone else ""
    if payload.phone is not None:
        if clean_phone and len(clean_phone) < 8:
            details["phone"] = "A valid phone number is required."
        elif clean_phone and clean_phone != user.phone:
            existing_user = db.scalar(select(User).where(User.phone == clean_phone, User.id != user.id))
            if existing_user:
                details["phone"] = "An account with this phone number already exists."

    clean_email = payload.email.strip().lower() if payload.email and payload.email.strip() else None
    if payload.email is not None and clean_email:
        if "@" not in clean_email:
            details["email"] = "A valid email address is required."
        elif clean_email != (user.email or "").lower():
            existing_user = db.scalar(select(User).where(func.lower(User.email) == clean_email, User.id != user.id))
            if existing_user:
                details["email"] = "An account with this email address already exists."

    # Parse and clean categories
    selected_categories = []
    if payload.categories is not None:
        selected_categories = [c.strip() for c in payload.categories if c and c.strip()]
    elif payload.category:
        selected_categories = [c.strip() for c in payload.category.split(",") if c and c.strip()]
    clean_category_str = ", ".join(selected_categories) if selected_categories else "FMCG"

    # Area logic
    raw_areas = []
    if payload.serviceAreas is not None and len(payload.serviceAreas) > 0:
        raw_areas = payload.serviceAreas
    elif payload.area and payload.area.strip():
        raw_areas = [payload.area.strip()]

    clean_areas = service_area_values(raw_areas) if raw_areas else []
    primary_area = clean_areas[0] if clean_areas else (normalize_area_label(payload.area) if payload.area else (user.area or ""))

    if user.role in {"SUPPLIER", "GRUH_UDYOG"} and not clean_areas and not primary_area:
        details["area"] = "At least one service area is required."

    if details:
        return error("Please correct the highlighted fields.", "VALIDATION_ERROR", 400, details)

    # Update User entity
    user.name = clean_name
    if clean_email is not None:
        user.email = clean_email
    if clean_phone:
        user.phone = clean_phone
    if clean_areas:
        user.area = (", ".join(clean_areas))[:100]
    elif primary_area:
        user.area = primary_area[:100]

    # Keep login_identifier synchronized
    if user.email and (not user.login_identifier or "@" in user.login_identifier):
        user.login_identifier = user.email
    elif user.phone and (not user.login_identifier or "@" not in user.login_identifier):
        user.login_identifier = user.phone

    # Role-specific updates & area logic
    if user.role in {"SUPPLIER", "GRUH_UDYOG"}:
        supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
        if not supplier:
            supplier = Supplier(
                id=f"supplier-{user.id[:8]}",
                owner_id=user.id,
                name=f"{user.name}'s Supply Desk",
                category=clean_category_str,
                location=primary_area,
                service_areas_raw=", ".join(clean_areas) if clean_areas else primary_area,
                phone=user.phone or "",
                email=user.email or "",
                is_verified=False,
                rating=None,
                review_count=0
            )
            db.add(supplier)
            db.flush()
        else:
            supplier.name = f"{user.name}'s Supply Desk" if not supplier.name else supplier.name
            supplier.category = clean_category_str
            supplier.location = primary_area
            supplier.phone = user.phone or supplier.phone
            supplier.email = user.email or supplier.email
            supplier.service_areas_raw = ", ".join(clean_areas) if clean_areas else primary_area

        # Update SupplierServiceArea records to synchronize service areas
        if clean_areas:
            supplier.service_areas.clear()
            db.flush()
            for area in clean_areas:
                supplier.service_areas.append(SupplierServiceArea(
                    supplier_id=supplier.id,
                    area_key=normalize_area_key(area),
                    area=normalize_area_label(area)
                ))
            db.flush()

    elif user.role == "SHOP_OWNER":
        if user.shop:
            if primary_area:
                user.shop.area = primary_area
            if payload.shopName and payload.shopName.strip():
                user.shop.name = payload.shopName.strip()
            if payload.shopAddress and payload.shopAddress.strip():
                user.shop.address = payload.shopAddress.strip()

    db.commit()
    db.refresh(user)
    return envelope({"user": safe_user(user, db=db)}, "Profile updated successfully")

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if token and db.get(SessionToken, token): db.delete(db.get(SessionToken, token)); db.commit()
    response.delete_cookie(SESSION_COOKIE)
    return envelope(None, "Signed out")

@app.get("/api/supplier/dashboard")
def supplier_dashboard(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in {"SUPPLIER", "GRUH_UDYOG"}: return role_error("Suppliers", user)
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    orders = db.scalars(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier.id).options(joinedload(SupplierOrder.items))).unique().all() if supplier else []

    def local_date(value):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone().date()

    today = datetime.now().astimezone().date()
    today_revenue = sum(
        float(order.subtotal)
        for order in orders
        if order.status == "Delivered" and local_date(order.updated_at) == today
    )

    metrics = [
        {"label": "New orders", "value": str(sum(o.status == "Pending" for o in orders)).zfill(2), "detail": "Received this week", "accent": "metric-primary"},
        {"label": "Pending orders", "value": str(sum(o.status not in {"Delivered", "Cancelled"} for o in orders)).zfill(2), "detail": "Awaiting fulfilment", "accent": "metric-warning"},
        {"label": "Completed orders", "value": str(sum(o.status == "Delivered" for o in orders)).zfill(2), "detail": "Delivered successfully", "accent": "metric-success"},
        {"label": "Today's Revenue", "value": f"₹{today_revenue:,.0f}", "detail": "Revenue received today", "accent": "metric-primary"},
    ]

    return envelope({"businessName": supplier.name if supplier else f"{user.name}'s Supply Desk", "supplierId": supplier.id if supplier else None, "metrics": metrics, "valueSummary": {"value": f"Rs {sum(float(o.subtotal) for o in orders):,.0f}", "detail": "Estimated incoming order value this month"}, "recentOrders": [order_json(o) for o in orders], "isDemoData": not bool(orders)}, "Supplier dashboard returned")

@app.get("/api/supplier/orders")
def supplier_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in {"SUPPLIER", "GRUH_UDYOG"}: return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    orders = db.scalars(
        select(SupplierOrder)
        .where(SupplierOrder.supplier_id == supplier.id)
        .options(
            joinedload(SupplierOrder.items),
            joinedload(SupplierOrder.shop_owner).joinedload(User.shop)
        )
        .order_by(SupplierOrder.created_at.desc())
    ).unique().all() if supplier else []
    return envelope({"orders": [order_json(o) for o in orders]}, "Incoming orders returned")

@app.get("/api/supplier/orders/{order_id}")
def supplier_order(order_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in {"SUPPLIER", "GRUH_UDYOG"}: return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    order = db.scalar(
        select(SupplierOrder)
        .where(SupplierOrder.id == order_id, SupplierOrder.supplier_id == supplier.id)
        .options(
            joinedload(SupplierOrder.items),
            joinedload(SupplierOrder.shop_owner).joinedload(User.shop)
        )
    ) if supplier else None
    return envelope({"order": order_json(order)}, "Incoming order returned") if order else error("Incoming order not found.", "NOT_FOUND", 404)

@app.put("/api/supplier/orders/{order_id}/status")
def update_supplier_order(order_id: str, payload: StatusRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in {"SUPPLIER", "GRUH_UDYOG"}: return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    order = db.scalar(
        select(SupplierOrder)
        .where(SupplierOrder.id == order_id, SupplierOrder.supplier_id == supplier.id)
        .options(
            joinedload(SupplierOrder.items),
            joinedload(SupplierOrder.shop_owner).joinedload(User.shop)
        )
    ) if supplier else None
    if not order: return error("Incoming order not found.", "NOT_FOUND", 404)
    if payload.status not in TRANSITIONS.get(order.status, set()): return error(f"Cannot move an order from {order.status} to {payload.status}.", "INVALID_STATUS_TRANSITION", 400)
    order.status = payload.status; db.commit(); db.refresh(order)
    return envelope({"order": order_json(order)}, "Order status updated")


@app.get("/api/supplier/shop-owners")
def supplier_shop_owners(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in {"SUPPLIER", "GRUH_UDYOG"}:
        return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    if not supplier:
        return envelope({"shopOwners": [], "serviceAreas": []}, "Shop owners returned")

    # Collect supplier's service areas
    service_areas = [sa.area for sa in supplier.service_areas]
    service_area_map = {sa.area_key: sa.area for sa in supplier.service_areas}
    if not service_area_map and supplier.service_areas_raw:
        for raw in supplier.service_areas_raw.split(","):
            raw_clean = raw.strip()
            if raw_clean:
                service_area_map[normalize_area_key(raw_clean)] = raw_clean
                if raw_clean not in service_areas:
                    service_areas.append(raw_clean)

    # Fetch all shop owners with their shops
    shop_owners = db.scalars(
        select(User)
        .where(User.role == "SHOP_OWNER")
        .options(joinedload(User.shop))
    ).unique().all()

    # Pre-fetch orders placed with this supplier
    supplier_orders = db.scalars(
        select(SupplierOrder)
        .where(SupplierOrder.supplier_id == supplier.id)
    ).all()
    orders_by_owner: dict[str, list[SupplierOrder]] = {}
    for ord in supplier_orders:
        orders_by_owner.setdefault(ord.shop_owner_id, []).append(ord)

    matched_shops = []
    for owner in shop_owners:
        shop = owner.shop
        shop_area_str = (shop.area if shop and shop.area else owner.area) or ""
        clean_shop_area = normalize_area_key(shop_area_str)
        if not clean_shop_area:
            continue

        matched_area_label = None
        for sa_key, sa_label in service_area_map.items():
            if sa_key == clean_shop_area or sa_key in clean_shop_area or clean_shop_area in sa_key:
                matched_area_label = sa_label
                break

        if matched_area_label:
            owner_orders = orders_by_owner.get(owner.id, [])
            total_orders = len(owner_orders)
            total_spent = sum(float(o.subtotal) for o in owner_orders)
            last_order_date = max((o.created_at.isoformat() for o in owner_orders), default=None)

            matched_shops.append({
                "id": owner.id,
                "shopId": shop.id if shop else owner.id,
                "shopName": (shop.name if shop and shop.name else f"{owner.name}'s Shop").strip(),
                "ownerName": owner.name.strip(),
                "email": owner.email or "",
                "phone": (owner.phone or "").strip(),
                "area": shop_area_str.strip(),
                "address": (shop.address if shop and shop.address else shop_area_str).strip(),
                "matchingArea": matched_area_label,
                "totalOrders": total_orders,
                "totalSpent": total_spent,
                "lastOrder": last_order_date,
                "status": "Existing Customer" if total_orders > 0 else "Potential Retailer",
                "createdAt": owner.created_at.isoformat() if owner.created_at else ""
            })

    matched_shops.sort(key=lambda s: (-s["totalOrders"], s["shopName"].lower()))

    return envelope({
        "shopOwners": matched_shops,
        "serviceAreas": service_areas,
        "supplierName": supplier.name,
        "supplierId": supplier.id,
    }, "Shop owners in matching areas returned")


@app.get("/api/gruh-udyog/dashboard")
def gruh_udyog_dashboard(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    supplier = owned_supplier(user, db)
    orders = db.scalars(
        select(SupplierOrder)
        .where(SupplierOrder.supplier_id == supplier.id)
        .options(
            joinedload(SupplierOrder.items),
            joinedload(SupplierOrder.shop_owner).joinedload(User.shop)
        )
        .order_by(SupplierOrder.created_at.desc())
    ).unique().all() if supplier else []

    total_orders = len(orders)
    pending_orders = sum(1 for o in orders if o.status in {"Pending", "Preparing", "Accepted", "Out for Delivery"})
    completed_orders = sum(1 for o in orders if o.status == "Delivered")
    total_sales = sum(float(o.subtotal) for o in orders if o.status != "Cancelled")

    orders_data = [order_json(o) for o in orders]
    attention_orders = [o for o in orders_data if o["status"] in {"Pending", "Preparing", "Accepted", "Out for Delivery"}]

    return envelope({
        "businessName": supplier.name if supplier else f"{user.name}'s Gruh Udyog",
        "supplierId": supplier.id if supplier else None,
        "metrics": {
            "totalOrders": total_orders,
            "pendingOrders": pending_orders,
            "completedOrders": completed_orders,
            "totalSales": total_sales,
            "totalSalesFormatted": f"₹{total_sales:,.0f}",
        },
        "orders": orders_data,
        "recentOrders": orders_data[:10],
        "needsAttentionOrders": attention_orders[:5],
        "hasRealOrders": total_orders > 0,
    }, "Gruh Udyog dashboard returned")


@app.get("/api/gruh-udyog/orders")
def gruh_udyog_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return supplier_orders(user=user, db=db)


@app.get("/api/gruh-udyog/orders/{order_id}")
def gruh_udyog_order(order_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return supplier_order(order_id=order_id, user=user, db=db)


@app.put("/api/gruh-udyog/orders/{order_id}/status")
def update_gruh_udyog_order(order_id: str, payload: StatusRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return update_supplier_order(order_id=order_id, payload=payload, user=user, db=db)


@app.get("/api/gruh-udyog/customers")
def gruh_udyog_customers(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    supplier = owned_supplier(user, db)
    if not supplier:
        return envelope({"customers": []}, "Gruh Udyog customers returned")

    orders = db.scalars(
        select(SupplierOrder)
        .where(SupplierOrder.supplier_id == supplier.id)
        .options(
            joinedload(SupplierOrder.items),
            joinedload(SupplierOrder.shop_owner).joinedload(User.shop)
        )
        .order_by(SupplierOrder.created_at.desc())
    ).unique().all()

    customers_map = {}
    for order in orders:
        owner = order.shop_owner
        shop = owner.shop if owner else None
        cid = owner.id if owner else (order.shop_owner_id or order.id)

        if cid not in customers_map:
            shop_name = shop.name if shop else (owner.name if owner else "Retail Store")
            area = shop.area if shop else (owner.area if owner else order.service_area or "Ahmedabad")
            address = shop.address if shop else f"{area}, Ahmedabad"
            
            # Determine status: inactive if order status is Cancelled or marked
            is_inactive = order.status == "Cancelled"

            created_date = order.created_at.isoformat() if hasattr(order.created_at, "isoformat") else str(order.created_at)
            since_date = owner.created_at.isoformat() if owner and hasattr(owner.created_at, "isoformat") else created_date

            customers_map[cid] = {
                "id": cid,
                "name": shop_name,
                "shopOwner": owner.name if owner else "Shop Owner",
                "phone": owner.phone if owner and owner.phone else "",
                "email": owner.email if owner and owner.email else "",
                "area": area,
                "city": "Ahmedabad",
                "address": address,
                "location": f"{area}, Ahmedabad" if area else "Ahmedabad",
                "totalOrders": 0,
                "totalSpent": 0.0,
                "lastOrder": created_date,
                "customerSince": since_date,
                "status": "Inactive" if is_inactive else "Active",
                "category": "Retail Store",
                "orders": []
            }

        customer_entry = customers_map[cid]
        customer_entry["totalOrders"] += 1
        customer_entry["totalSpent"] = round(customer_entry["totalSpent"] + float(order.subtotal), 2)
        customer_entry["orders"].append(order_json(order))

        # Keep latest order as lastOrder
        order_date_str = order.created_at.isoformat() if hasattr(order.created_at, "isoformat") else str(order.created_at)
        if order_date_str > customer_entry["lastOrder"]:
            customer_entry["lastOrder"] = order_date_str
            if order.status == "Cancelled":
                customer_entry["status"] = "Inactive"
        if order_date_str < customer_entry["customerSince"]:
            customer_entry["customerSince"] = order_date_str

    customers_list = list(customers_map.values())
    return envelope({"customers": customers_list}, "Gruh Udyog customers returned")


@app.get("/api/gruh-udyog/customers/{customer_id}")
def gruh_udyog_customer(customer_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    all_customers = gruh_udyog_customers(user=user, db=db)
    cust_list = all_customers.get("data", {}).get("customers", [])
    found = next((c for c in cust_list if c["id"] == customer_id), None)
    return envelope({"customer": found}, "Customer returned") if found else error("Customer not found.", "NOT_FOUND", 404)


def product_json(product: Product) -> dict:
    upb = product.minimum_quantity or getattr(product, "units_per_box", 1) or 1
    return {
        "id": product.id,
        "supplierId": product.supplier_id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "description": getattr(product, "description", "") or "",
        "packSize": product.pack_size,
        "price": float(product.price),
        "minimumQuantity": product.minimum_quantity,
        "unitsPerBox": upb,
        "availableStock": getattr(product, "available_stock", 0) or 0,
        "imageUrl": product.image_url or "",
        "isActive": product.is_active,
        "isDemoData": product.is_demo_data
    }


def public_supplier_json(supplier: Supplier, products: list[Product]) -> dict:
    product_categories = [product.category.strip() for product in products if product.category and product.category.strip()]
    mapped_categories = {
        "fmcg": "FMCG",
        "grocery": "Grocery & Staples",
        "staples": "Grocery & Staples",
        "beverages": "Beverages",
        "personal care": "Personal Care",
        "personal-care": "Personal Care",
        "cleaning": "Cleaning & Household",
        "household": "Cleaning & Household",
        "dairy": "Dairy & Bakery",
        "bakery": "Dairy & Bakery",
        "snacks": "Snacks & Packaged Foods",
        "packaged foods": "Snacks & Packaged Foods",
        "manufacturing": "Local Manufacturers",
        "local manufacturers": "Local Manufacturers",
        "handmade": "Local Manufacturers",
        "food & beverages": "Food & Beverages",
        "handicrafts": "Handicrafts",
        "pooja items": "Pooja Items",
        "home decor": "Home Decor",
        "health & wellness": "Health & Wellness",
    }
    category_values = [mapped_categories.get(category.lower(), category) for category in product_categories]
    category = supplier.category.strip() if (supplier.category and supplier.category.strip()) else next((value for value in category_values if value), "FMCG")
    unique_tags = []
    seen = set()
    for tag in category_values:
        key = tag.lower()
        if key not in seen:
            unique_tags.append(tag)
            seen.add(key)
    if not unique_tags:
        unique_tags = [category]
    description = {
        "FMCG": "A reliable wholesale supplier for everyday essentials and quick-turn retail restocking.",
        "Grocery & Staples": "Supplies core grocery staples and high-turn household essentials for active local stores.",
        "Beverages": "Delivers soft drinks, packaged beverages, and local refreshment favourites.",
        "Personal Care": "Stocks trusted personal care essentials for daily store demand and repeat replenishment.",
        "Cleaning & Household": "Provides cleaning essentials, household basics, and value-led hygiene products.",
        "Dairy & Bakery": "Sources fresh dairy, bakery staples, and ready-to-sell everyday food favourites.",
        "Snacks & Packaged Foods": "Carries crunchy, ready-to-ship packaged food items for fast-moving demand.",
        "Local Manufacturers": "Supports locally manufactured goods and regionally trusted speciality products.",
        "Food & Beverages": "Crafts authentic homemade snacks, pickles, and traditional delicacies.",
        "Handicrafts": "Offers handcrafted artisan goods, festive items, and decorative creations.",
        "Pooja Items": "Provides pure, traditional incense, pooja essentials, and spiritual items.",
        "Home Decor": "Handmade decorative candles, artistic pieces, and home accessories.",
        "Health & Wellness": "Natural, herbal preparations and wellness formulations made with care.",
    }.get(category, f"Offers {len(products)} active products across {len(unique_tags)} categories.")

    service_areas = [service_area.area for service_area in sorted(supplier.service_areas, key=lambda service_area: service_area.area_key)]
    location = service_areas[0] if service_areas else (supplier.owner.area if (supplier.owner and supplier.owner.area) else "")
    phone = supplier.owner.phone if (supplier.owner and supplier.owner.phone) else "+91 98765 43210"
    email = supplier.owner.email if (supplier.owner and supplier.owner.email) else ""
    return {
        "id": supplier.id,
        "name": supplier.name,
        "category": category,
        "categoryLabel": category,
        "description": description,
        "location": location,
        "serviceAreas": service_areas,
        "serviceAreaCount": len(supplier.service_areas),
        "productCount": len(products),
        "minimumOrder": "",
        "phone": phone,
        "email": email,
        "isVerified": False,
        "rating": None,
        "reviewCount": 0,
        "tags": unique_tags[:3],
        "isDemoData": any(product.is_demo_data for product in products),
    }


def supplier_serves_shop_area(user: User, supplier: Supplier) -> bool:
    shop_area = user.shop.area if user.shop else user.area
    area_key = normalize_area_key(shop_area) if shop_area else ""
    return bool(area_key) and any(service_area.area_key == area_key for service_area in supplier.service_areas)

@app.get("/api/suppliers")
def shop_suppliers(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    shop_area = user.shop.area if user.shop else user.area
    area_key = normalize_area_key(shop_area) if shop_area else ""
    suppliers = db.scalars(select(Supplier).join(SupplierServiceArea).where(SupplierServiceArea.area_key == area_key).order_by(Supplier.name).distinct()).all() if area_key else []
    return envelope({"suppliers": [public_supplier_json(supplier, db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()) for supplier in suppliers]}, "Suppliers returned")

@app.get("/api/suppliers/{supplier_id}")
def shop_supplier(supplier_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier or not supplier_serves_shop_area(user, supplier): return error("Supplier not found.", "NOT_FOUND", 404)
    products = db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()
    return envelope({"supplier": public_supplier_json(supplier, products), "products": [product_json(product) for product in products]}, "Supplier returned")

@app.get("/api/suppliers/{supplier_id}/products")
def shop_supplier_products(supplier_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier or not supplier_serves_shop_area(user, supplier): return error("Supplier not found.", "NOT_FOUND", 404)
    products = db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()
    return envelope({"supplier": public_supplier_json(supplier, products), "products": [product_json(product) for product in products]}, "Supplier products returned")

@app.get("/api/suppliers/{supplier_id}/products/{product_id}")
def shop_supplier_product(supplier_id: str, product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier or not supplier_serves_shop_area(user, supplier): return error("Supplier not found.", "NOT_FOUND", 404)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id, Product.is_active.is_(True)))
    return envelope({"supplier": public_supplier_json(supplier, []), "product": product_json(product)}, "Product returned") if product else error("Product is no longer available.", "NOT_FOUND", 404)

@app.get("/api/supplier/products")
def products(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    rows = db.scalars(select(Product).where(Product.supplier_id == supplier.id)).all() if supplier else []
    return envelope({"products": [product_json(p) for p in rows]}, "Products returned")

@app.post("/api/supplier/products", status_code=201)
def create_product(payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    if not supplier: return error("Supplier profile not found.", "NOT_FOUND", 404)
    image_url = payload.imageUrl.strip() if payload.imageUrl else ""
    desc = (getattr(payload, "description", "") or "").strip()
    is_active = payload.isActive if hasattr(payload, 'isActive') and payload.isActive is not None else True
    product = Product(
        id=str(uuid4()),
        supplier_id=supplier.id,
        name=payload.name.strip(),
        brand=(payload.brand or "Handmade").strip(),
        category=payload.category.strip(),
        description=desc,
        pack_size=payload.packSize.strip(),
        price=payload.price,
        minimum_quantity=payload.minimumQuantity or 1,
        units_per_box=payload.unitsPerBox or 1,
        available_stock=payload.availableStock or 0,
        image_url=image_url,
        is_active=is_active
    )
    db.add(product); db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product created")

@app.get("/api/supplier/products/{product_id}")
def get_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    return envelope({"product": product_json(product)}, "Product returned") if product else error("Product not found.", "NOT_FOUND", 404)

@app.put("/api/supplier/products/{product_id}")
def edit_product(product_id: str, payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    if not product: return error("Product not found.", "NOT_FOUND", 404)
    product.name = payload.name.strip()
    product.brand = (payload.brand or "Handmade").strip()
    product.category = payload.category.strip()
    if hasattr(payload, 'description') and payload.description is not None:
        product.description = payload.description.strip()
    product.pack_size = payload.packSize.strip()
    product.price = payload.price
    product.minimum_quantity = payload.minimumQuantity or 1
    product.units_per_box = payload.unitsPerBox or 1
    product.available_stock = payload.availableStock or 0
    product.image_url = payload.imageUrl.strip() if payload.imageUrl else ""
    if hasattr(payload, 'isActive') and payload.isActive is not None:
        product.is_active = payload.isActive
    db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product updated")

@app.delete("/api/supplier/products/{product_id}")
def deactivate_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    if not product: return error("Product not found.", "NOT_FOUND", 404)
    product.is_active = False; db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product deactivated")


@app.get("/api/gruh-udyog/products")
def gruh_udyog_products(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return products(user=user, db=db)


@app.post("/api/gruh-udyog/products", status_code=201)
def gruh_udyog_create_product(payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return create_product(payload=payload, user=user, db=db)


@app.get("/api/gruh-udyog/products/{product_id}")
def gruh_udyog_get_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return get_product(product_id=product_id, user=user, db=db)


@app.put("/api/gruh-udyog/products/{product_id}")
def gruh_udyog_edit_product(product_id: str, payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return edit_product(product_id=product_id, payload=payload, user=user, db=db)


@app.delete("/api/gruh-udyog/products/{product_id}")
def gruh_udyog_deactivate_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "GRUH_UDYOG":
        return role_error("Gruh Udyog", user)
    return deactivate_product(product_id=product_id, user=user, db=db)

@app.get("/api/orders")
def shop_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    rows = db.scalars(select(SupplierOrder).where(SupplierOrder.shop_owner_id == user.id).options(joinedload(SupplierOrder.items))).unique().all()
    return envelope({"orders": [order_json(o) for o in rows]}, "Orders returned")

@app.get("/api/orders/{order_id}")
def shop_order(order_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    order = db.scalar(select(SupplierOrder).where(SupplierOrder.id == order_id, SupplierOrder.shop_owner_id == user.id).options(joinedload(SupplierOrder.items)))
    return envelope({"order": order_json(order)}, "Order returned") if order else error("Order not found.", "NOT_FOUND", 404)

@app.post("/api/checkout", status_code=201)
def checkout(payload: CheckoutRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    if payload.paymentMethod not in PAYMENT_METHODS or not payload.items:
        return error("Please correct the checkout details.", "VALIDATION_ERROR", 400)
    if payload.idempotencyKey:
        existing = db.scalar(select(Checkout).where(Checkout.idempotency_key == payload.idempotencyKey, Checkout.shop_owner_id == user.id))
        if existing:
            existing_orders = db.scalars(select(SupplierOrder).where(SupplierOrder.checkout_id == existing.id).options(joinedload(SupplierOrder.items))).unique().all()
            return envelope({"checkout": {"id": existing.id, "shopOwnerId": existing.shop_owner_id, "totalAmount": float(existing.total_amount), "paymentMethod": existing.payment_method, "supplierOrders": [order_json(order) for order in existing_orders], "createdAt": existing.created_at.isoformat()}}, "Order request already created")
    checkout_id = f"CO-{uuid4().hex[:10].upper()}"
    checkout_row = Checkout(id=checkout_id, idempotency_key=payload.idempotencyKey, shop_owner_id=user.id, total_amount=0, payment_method=payload.paymentMethod)
    total = Decimal("0")
    orders_by_supplier = {}
    for index, item in enumerate(payload.items, 1):
        supplier_id = item.supplierId; product_id = item.productId; quantity = item.quantity
        if not supplier_id or not product_id or quantity < 1:
            return error("Please correct the checkout details.", "VALIDATION_ERROR", 400)
        product = db.get(Product, product_id)
        if not product: return error("Product not found.", "NOT_FOUND", 404)
        if product.supplier_id != supplier_id: return error("Product does not belong to supplier.", "INVALID_PRODUCT_SUPPLIER", 400)
        if not product.is_active: return error("Product is no longer available.", "PRODUCT_UNAVAILABLE", 400)
        units_per_box = product.minimum_quantity or getattr(product, "units_per_box", 1) or 1
        if units_per_box <= 0:
            return error(f"Invalid packaging configuration for {product.name}.", "VALIDATION_ERROR", 400)
        if quantity < product.minimum_quantity:
            return error(f"Minimum quantity for {product.name} is {product.minimum_quantity}.", "MINIMUM_QUANTITY_NOT_MET", 400)
        if quantity % units_per_box != 0:
            return error(f"Quantity for {product.name} must be ordered in full boxes of {units_per_box} units.", "INVALID_BOX_QUANTITY", 400)
        supplier = db.get(Supplier, supplier_id)
        if not supplier: return error("Supplier not found.", "NOT_FOUND", 404)
        if not supplier_serves_shop_area(user, supplier): return error("Supplier is not available in your shop area.", "SUPPLIER_AREA_MISMATCH", 403)
        matched_area = next(service_area.area for service_area in supplier.service_areas if service_area.area_key == normalize_area_key(user.shop.area if user.shop else user.area))
        price = Decimal(str(product.price))
        line_total = price * quantity
        order = orders_by_supplier.get(supplier_id)
        if not order:
            order = SupplierOrder(id=f"{str(supplier_id).upper()}-{checkout_id}-{index}", checkout_id=checkout_id, supplier_id=supplier_id, supplier_name=supplier.name, service_area=matched_area, shop_owner_id=user.id, subtotal=0, status="Pending")
            orders_by_supplier[supplier_id] = order; checkout_row.orders.append(order)
        order.subtotal = Decimal(str(order.subtotal)) + line_total
        order.items.append(OrderItem(product_id=product.id, product_name_snapshot=product.name, product_image_url_snapshot=product.image_url or "", quantity=quantity, units_per_box_snapshot=units_per_box, unit_price_snapshot=price, line_total=line_total))
        total += line_total
    checkout_row.total_amount = total; db.add(checkout_row); db.commit(); db.refresh(checkout_row)
    return envelope({"checkout": {"id": checkout_id, "shopOwnerId": user.id, "totalAmount": float(total), "paymentMethod": payload.paymentMethod, "supplierOrders": [order_json(o) for o in checkout_row.orders], "createdAt": checkout_row.created_at.isoformat()}}, "Order request created")

@app.get("/api/analytics/shop")
def shop_analytics(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    rows = db.scalars(select(SupplierOrder).where(SupplierOrder.shop_owner_id == user.id)).all()
    return envelope({"isDemoData": not bool(rows), "totalOrderValue": sum(float(o.subtotal) for o in rows), "ordersOverTime": [], "topProducts": [], "supplierSpending": [], "statusDistribution": []}, "Shop analytics returned")

@app.get("/api/analytics/supplier")
def supplier_analytics(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role == "SHOP_OWNER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    rows = db.scalars(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier.id)).all() if supplier else []
    return envelope({"isDemoData": not bool(rows), "ordersReceived": len(rows), "orderValue": sum(float(o.subtotal) for o in rows), "topProducts": [], "topCustomers": [], "orderStatus": {"pending": sum(o.status not in {"Delivered", "Cancelled"} for o in rows), "completed": sum(o.status == "Delivered" for o in rows)}}, "Supplier analytics returned")
