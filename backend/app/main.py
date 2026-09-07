import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db
from .models import Checkout, OrderItem, Product, SessionToken, Shop, Supplier, SupplierOrder, User
from .schemas import CheckoutRequest, LoginRequest, ProductRequest, ShopOwnerRegisterRequest, SupplierRegisterRequest, GruhUdyogRegisterRequest, StatusRequest

SESSION_COOKIE = "connecto_session"
SESSION_DAYS = 7
CLIENT_ORIGIN = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")
ROLES = {"SHOP_OWNER", "SUPPLIER", "GRUH_UDYOG"}
PAYMENT_METHODS = {"CASH_ON_DELIVERY", "PAY_LATER", "REQUEST_ORDER"}
TRANSITIONS = {
    "Pending": {"Accepted", "Cancelled"}, "Accepted": {"Preparing", "Cancelled"},
    "Preparing": {"Out for Delivery", "Cancelled"}, "Out for Delivery": {"Delivered"},
    "Delivered": set(), "Cancelled": set(),
}

app = FastAPI(title="Connecto API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[CLIENT_ORIGIN], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN area VARCHAR(100)"))
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


def safe_user(user: User) -> dict:
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
    return {"id": order.id, "checkoutId": order.checkout_id, "supplierId": order.supplier_id, "supplierName": order.supplier_name, "serviceArea": order.service_area, "shopOwnerId": order.shop_owner_id, "subtotal": float(order.subtotal), "amount": float(order.subtotal), "status": order.status, "createdAt": order.created_at.isoformat(), "updatedAt": order.updated_at.isoformat(), "items": [{"productId": item.product_id, "productNameSnapshot": item.product_name_snapshot, "name": item.product_name_snapshot, "imageUrl": item.product_image_url_snapshot or "", "quantity": item.quantity, "unitPriceSnapshot": float(item.unit_price_snapshot), "unitPrice": float(item.unit_price_snapshot), "lineTotal": float(item.line_total)} for item in order.items]}

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
    identifier: str | None = None
):
    if role not in ROLES:
        return error("Choose a supported Connecto role.", "VALIDATION_ERROR", 400, {"role": "Choose a supported Connecto role."})

    details = {}
    clean_name = name.strip() if name else ""
    if len(clean_name) < 2:
        details["name"] = "Full name must be at least 2 characters."
    
    clean_area = area.strip() if area else ""
    if len(clean_area) < 2:
        details["area"] = "Area is required."

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

    if role == "SHOP_OWNER":
        db.add(Shop(id=str(uuid4()), owner=user, name=shop_name.strip(), address=shop_address.strip(), area=clean_area))
    elif role == "SUPPLIER":
        db.add(Supplier(id=f"supplier-{user.id[:8]}", owner_id=user.id, name=f"{user.name}'s Supply Desk"))
    elif role == "GRUH_UDYOG":
        db.add(Supplier(id=f"supplier-{user.id[:8]}", owner_id=user.id, name=f"{user.name}'s Gruh Udyog"))

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
        confirm_password=payload.confirmPassword
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
        confirm_password=payload.confirmPassword
    )

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
    if not user or not verify_password(payload.password, user.password_hash):
        return error("The sign-in details are not valid.", "INVALID_CREDENTIALS", 401)
    set_session(response, db, user)
    return envelope({"user": safe_user(user)}, "Signed in")

@app.get("/api/auth/me")
def me(user: User = Depends(require_user)):
    return envelope({"user": safe_user(user)}, "Current user returned")

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if token and db.get(SessionToken, token): db.delete(db.get(SessionToken, token)); db.commit()
    response.delete_cookie(SESSION_COOKIE)
    return envelope(None, "Signed out")

@app.get("/api/supplier/dashboard")
def supplier_dashboard(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    orders = db.scalars(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier.id).options(joinedload(SupplierOrder.items))).all() if supplier else []
    return envelope({"businessName": supplier.name if supplier else f"{user.name}'s Supply Desk", "supplierId": supplier.id if supplier else None, "metrics": [{"label": "New orders", "value": str(sum(o.status == "Pending" for o in orders)).zfill(2), "detail": "Received this week", "accent": "metric-primary"}, {"label": "Pending orders", "value": str(sum(o.status not in {"Delivered", "Cancelled"} for o in orders)).zfill(2), "detail": "Awaiting fulfilment", "accent": "metric-warning"}, {"label": "Completed orders", "value": str(sum(o.status == "Delivered" for o in orders)).zfill(2), "detail": "Delivered successfully", "accent": "metric-success"}], "valueSummary": {"value": f"Rs {sum(float(o.subtotal) for o in orders):,.0f}", "detail": "Estimated incoming order value this month"}, "recentOrders": [order_json(o) for o in orders], "isDemoData": not bool(orders)}, "Supplier dashboard returned")

@app.get("/api/supplier/orders")
def supplier_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    orders = db.scalars(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier.id).options(joinedload(SupplierOrder.items))).all() if supplier else []
    return envelope({"orders": [order_json(o) for o in orders]}, "Incoming orders returned")

@app.get("/api/supplier/orders/{order_id}")
def supplier_order(order_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    order = db.scalar(select(SupplierOrder).where(SupplierOrder.id == order_id, SupplierOrder.supplier_id == supplier.id).options(joinedload(SupplierOrder.items))) if supplier else None
    return envelope({"order": order_json(order)}, "Incoming order returned") if order else error("Incoming order not found.", "NOT_FOUND", 404)

@app.put("/api/supplier/orders/{order_id}/status")
def update_supplier_order(order_id: str, payload: StatusRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = db.scalar(select(Supplier).where(Supplier.owner_id == user.id))
    order = db.scalar(select(SupplierOrder).where(SupplierOrder.id == order_id, SupplierOrder.supplier_id == supplier.id).options(joinedload(SupplierOrder.items))) if supplier else None
    if not order: return error("Incoming order not found.", "NOT_FOUND", 404)
    if payload.status not in TRANSITIONS.get(order.status, set()): return error(f"Cannot move an order from {order.status} to {payload.status}.", "INVALID_STATUS_TRANSITION", 400)
    order.status = payload.status; db.commit(); db.refresh(order)
    return envelope({"order": order_json(order)}, "Order status updated")

def product_json(product: Product) -> dict:
    return {"id": product.id, "supplierId": product.supplier_id, "name": product.name, "brand": product.brand, "category": product.category, "packSize": product.pack_size, "price": float(product.price), "minimumQuantity": product.minimum_quantity, "imageUrl": product.image_url or "", "isActive": product.is_active, "isDemoData": product.is_demo_data}

def owned_supplier(user: User, db: Session):
    return db.scalar(select(Supplier).where(Supplier.owner_id == user.id))

def public_supplier_json(supplier: Supplier, products: list[Product]) -> dict:
    return {"id": supplier.id, "name": supplier.name, "category": "FMCG distribution", "description": "", "serviceAreas": [], "productCount": len(products), "minimumOrder": "", "phone": "", "isDemoData": any(product.is_demo_data for product in products)}

@app.get("/api/suppliers")
def shop_suppliers(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    suppliers = db.scalars(select(Supplier).order_by(Supplier.name)).all()
    return envelope({"suppliers": [public_supplier_json(supplier, db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()) for supplier in suppliers]}, "Suppliers returned")

@app.get("/api/suppliers/{supplier_id}")
def shop_supplier(supplier_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier: return error("Supplier not found.", "NOT_FOUND", 404)
    products = db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()
    return envelope({"supplier": public_supplier_json(supplier, products), "products": [product_json(product) for product in products]}, "Supplier returned")

@app.get("/api/suppliers/{supplier_id}/products")
def shop_supplier_products(supplier_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier: return error("Supplier not found.", "NOT_FOUND", 404)
    products = db.scalars(select(Product).where(Product.supplier_id == supplier.id, Product.is_active.is_(True))).all()
    return envelope({"supplier": public_supplier_json(supplier, products), "products": [product_json(product) for product in products]}, "Supplier products returned")

@app.get("/api/suppliers/{supplier_id}/products/{product_id}")
def shop_supplier_product(supplier_id: str, product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    supplier = db.get(Supplier, supplier_id)
    if not supplier: return error("Supplier not found.", "NOT_FOUND", 404)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id, Product.is_active.is_(True)))
    return envelope({"supplier": public_supplier_json(supplier, []), "product": product_json(product)}, "Product returned") if product else error("Product is no longer available.", "NOT_FOUND", 404)

@app.get("/api/supplier/products")
def products(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    rows = db.scalars(select(Product).where(Product.supplier_id == supplier.id)).all() if supplier else []
    return envelope({"products": [product_json(p) for p in rows]}, "Products returned")

@app.post("/api/supplier/products", status_code=201)
def create_product(payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    if not supplier: return error("Supplier profile not found.", "NOT_FOUND", 404)
    image_url = payload.imageUrl.strip() if payload.imageUrl else ""
    product = Product(id=str(uuid4()), supplier_id=supplier.id, name=payload.name.strip(), brand=payload.brand.strip(), category=payload.category.strip(), pack_size=payload.packSize.strip(), price=payload.price, minimum_quantity=payload.minimumQuantity, image_url=image_url, is_active=True)
    db.add(product); db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product created")

@app.get("/api/supplier/products/{product_id}")
def get_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    return envelope({"product": product_json(product)}, "Product returned") if product else error("Product not found.", "NOT_FOUND", 404)

@app.put("/api/supplier/products/{product_id}")
def edit_product(product_id: str, payload: ProductRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    if not product: return error("Product not found.", "NOT_FOUND", 404)
    product.name = payload.name.strip(); product.brand = payload.brand.strip(); product.category = payload.category.strip(); product.pack_size = payload.packSize.strip(); product.price = payload.price; product.minimum_quantity = payload.minimumQuantity; product.image_url = payload.imageUrl.strip() if payload.imageUrl else ""
    db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product updated")

@app.delete("/api/supplier/products/{product_id}")
def deactivate_product(product_id: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.supplier_id == supplier.id)) if supplier else None
    if not product: return error("Product not found.", "NOT_FOUND", 404)
    product.is_active = False; db.commit(); db.refresh(product)
    return envelope({"product": product_json(product)}, "Product deactivated")

@app.get("/api/orders")
def shop_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.role != "SHOP_OWNER": return role_error("Shop Owners", user)
    rows = db.scalars(select(SupplierOrder).where(SupplierOrder.shop_owner_id == user.id).options(joinedload(SupplierOrder.items))).all()
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
    checkout_id = f"CO-{uuid4().hex[:10].upper()}"
    checkout_row = Checkout(id=checkout_id, shop_owner_id=user.id, total_amount=0, payment_method=payload.paymentMethod)
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
        if quantity < product.minimum_quantity: return error(f"Minimum quantity for {product.name} is {product.minimum_quantity}.", "MINIMUM_QUANTITY_NOT_MET", 400)
        supplier = db.get(Supplier, supplier_id)
        if not supplier: return error("Supplier not found.", "NOT_FOUND", 404)
        price = Decimal(str(product.price))
        line_total = price * quantity
        order = orders_by_supplier.get(supplier_id)
        if not order:
            order = SupplierOrder(id=f"{str(supplier_id).upper()}-{checkout_id}-{index}", checkout_id=checkout_id, supplier_id=supplier_id, supplier_name=supplier.name, service_area="", shop_owner_id=user.id, subtotal=0, status="Pending")
            orders_by_supplier[supplier_id] = order; checkout_row.orders.append(order)
        order.subtotal = Decimal(str(order.subtotal)) + line_total
        order.items.append(OrderItem(product_id=product.id, product_name_snapshot=product.name, product_image_url_snapshot=product.image_url or "", quantity=quantity, unit_price_snapshot=price, line_total=line_total))
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
    if user.role != "SUPPLIER": return role_error("Suppliers", user)
    supplier = owned_supplier(user, db)
    rows = db.scalars(select(SupplierOrder).where(SupplierOrder.supplier_id == supplier.id)).all() if supplier else []
    return envelope({"isDemoData": not bool(rows), "ordersReceived": len(rows), "orderValue": sum(float(o.subtotal) for o in rows), "topProducts": [], "topCustomers": [], "orderStatus": {"pending": sum(o.status not in {"Delivered", "Cancelled"} for o in rows), "completed": sum(o.status == "Delivered" for o in rows)}}, "Supplier analytics returned")
