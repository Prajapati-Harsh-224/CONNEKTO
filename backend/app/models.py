from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
    login_identifier: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    shop: Mapped["Shop | None"] = relationship(back_populates="owner", uselist=False, cascade="all, delete-orphan")

class Shop(Base):
    __tablename__ = "shops"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str] = mapped_column(String(250))
    area: Mapped[str] = mapped_column(String(100))
    owner: Mapped[User] = relationship(back_populates="shop")

class SessionToken(Base):
    __tablename__ = "sessions"
    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)

class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, unique=True)

class Product(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    brand: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(100))
    pack_size: Mapped[str] = mapped_column(String(80))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    minimum_quantity: Mapped[int] = mapped_column(Integer)
    image_url: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False)

class Checkout(Base):
    __tablename__ = "checkouts"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    shop_owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    payment_method: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    orders: Mapped[list["SupplierOrder"]] = relationship(cascade="all, delete-orphan")

class SupplierOrder(Base):
    __tablename__ = "supplier_orders"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    checkout_id: Mapped[str] = mapped_column(ForeignKey("checkouts.id"), index=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)
    supplier_name: Mapped[str] = mapped_column(String(150))
    service_area: Mapped[str] = mapped_column(String(100), default="")
    shop_owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(30), index=True, default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    items: Mapped[list["OrderItem"]] = relationship(cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "supplier_order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("supplier_orders.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36))
    product_name_snapshot: Mapped[str] = mapped_column(String(150))
    product_image_url_snapshot: Mapped[str | None] = mapped_column(Text, default="")
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_snapshot: Mapped[float] = mapped_column(Numeric(10, 2))
    line_total: Mapped[float] = mapped_column(Numeric(10, 2))
