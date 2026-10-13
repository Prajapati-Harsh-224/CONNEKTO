from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True)
    area: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    login_identifier: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    shop: Mapped[Optional["Shop"]] = relationship(back_populates="owner", uselist=False, cascade="all, delete-orphan")

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
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="")
    service_areas_raw: Mapped[Optional[str]] = mapped_column("service_areas", Text, nullable=True, default="")
    minimum_order: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="")
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, default="")
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    rating: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True, default=None)
    review_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    owner_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True, unique=True)
    owner: Mapped[Optional[User]] = relationship(lazy="joined")
    service_areas: Mapped[List["SupplierServiceArea"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class SupplierServiceArea(Base):
    __tablename__ = "supplier_service_areas"
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), primary_key=True)
    area_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    area: Mapped[str] = mapped_column(String(100))

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
    units_per_box: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    available_stock: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    image_url: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False)

class Checkout(Base):
    __tablename__ = "checkouts"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    shop_owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    payment_method: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    orders: Mapped[List["SupplierOrder"]] = relationship(cascade="all, delete-orphan")

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
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    checkout: Mapped["Checkout"] = relationship(overlaps="orders")
    shop_owner: Mapped["User"] = relationship(foreign_keys=[shop_owner_id])
    supplier: Mapped[Optional["Supplier"]] = relationship(foreign_keys=[supplier_id])
    items: Mapped[List["OrderItem"]] = relationship(cascade="all, delete-orphan")
    history: Mapped[List["OrderStatusHistory"]] = relationship(cascade="all, delete-orphan", lazy="selectin")

class OrderItem(Base):
    __tablename__ = "supplier_order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("supplier_orders.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36))
    product_name_snapshot: Mapped[str] = mapped_column(String(150))
    product_image_url_snapshot: Mapped[Optional[str]] = mapped_column(Text, default="")
    quantity: Mapped[int] = mapped_column(Integer)
    units_per_box_snapshot: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    unit_price_snapshot: Mapped[float] = mapped_column(Numeric(10, 2))
    line_total: Mapped[float] = mapped_column(Numeric(10, 2))

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("supplier_orders.id"), index=True)
    from_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
