import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, ForeignKeyConstraint, Index, Numeric, String, Text, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

def uid(): return str(uuid.uuid4())
def now(): return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    preferred_language: Mapped[str] = mapped_column(String(5), default="fr")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

class Session(Base):
    __tablename__ = "sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    csrf_token: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(150))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    business_type: Mapped[str] = mapped_column(String(20), default="commerce")
    enabled_modules: Mapped[list] = mapped_column(JSON, default=list)
    default_currency: Mapped[str] = mapped_column(String(3), default="MAD")
    timezone: Mapped[str] = mapped_column(String(64), default="Africa/Casablanca")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (UniqueConstraint("organization_id", "user_id"),)

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (UniqueConstraint("organization_id", "id"), UniqueConstraint("organization_id", "name"))

class Location(Base):
    __tablename__ = "locations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(30), default="warehouse")
    description: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    __table_args__ = (UniqueConstraint("organization_id", "id"), UniqueConstraint("organization_id", "name"))

class Item(Base):
    __tablename__ = "items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    category_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    sku: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text, default="")
    item_type: Mapped[str] = mapped_column(String(30), default="product")
    tracking_mode: Mapped[str] = mapped_column(String(20), default="BULK")
    unit: Mapped[str] = mapped_column(String(30), default="unité")
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    sale_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    low_stock_threshold: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (UniqueConstraint("organization_id", "id"), UniqueConstraint("organization_id", "sku"), ForeignKeyConstraint(["organization_id", "category_id"], ["categories.organization_id", "categories.id"]), CheckConstraint("purchase_price >= 0 AND sale_price >= 0 AND low_stock_threshold >= 0"))

class Contact(Base):
    __tablename__ = "contacts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(10))
    name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str] = mapped_column(String(40), default="")
    email: Mapped[str] = mapped_column(String(320), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (UniqueConstraint("organization_id", "id"), CheckConstraint("kind IN ('customer','supplier')"), Index("ix_contacts_org_kind", "organization_id", "kind"))

class Asset(Base):
    __tablename__ = "assets"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    item_id: Mapped[str] = mapped_column(String(36))
    serial_number: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), default="available")
    current_location_id: Mapped[str] = mapped_column(String(36))
    assigned_to: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (UniqueConstraint("organization_id", "id"), UniqueConstraint("organization_id", "serial_number"), ForeignKeyConstraint(["organization_id", "item_id"], ["items.organization_id", "items.id"]), ForeignKeyConstraint(["organization_id", "current_location_id"], ["locations.organization_id", "locations.id"]))

class StockBalance(Base):
    __tablename__ = "stock_balances"
    organization_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    location_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    __table_args__ = (ForeignKeyConstraint(["organization_id", "item_id"], ["items.organization_id", "items.id"]), ForeignKeyConstraint(["organization_id", "location_id"], ["locations.organization_id", "locations.id"]), CheckConstraint("quantity >= 0"))

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    item_id: Mapped[str] = mapped_column(String(36))
    asset_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    movement_type: Mapped[str] = mapped_column(String(30))
    source_location_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    destination_location_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    reference: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    performed_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    idempotency_key: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (UniqueConstraint("organization_id", "idempotency_key"), ForeignKeyConstraint(["organization_id", "item_id"], ["items.organization_id", "items.id"]), ForeignKeyConstraint(["organization_id", "asset_id"], ["assets.organization_id", "assets.id"]), ForeignKeyConstraint(["organization_id", "source_location_id"], ["locations.organization_id", "locations.id"]), ForeignKeyConstraint(["organization_id", "destination_location_id"], ["locations.organization_id", "locations.id"]), CheckConstraint("quantity > 0"), Index("ix_movement_org_date", "organization_id", "created_at"))

class Rental(Base):
    __tablename__ = "rentals"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    asset_id: Mapped[str] = mapped_column(String(36))
    customer_id: Mapped[str] = mapped_column(String(36))
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expected_return_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actual_return_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20))
    notes: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (UniqueConstraint("organization_id", "id"), ForeignKeyConstraint(["organization_id", "asset_id"], ["assets.organization_id", "assets.id"]), ForeignKeyConstraint(["organization_id", "customer_id"], ["contacts.organization_id", "contacts.id"]), Index("ix_rentals_asset_status", "organization_id", "asset_id", "status"))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"))
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(80))
    entity_type: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[str] = mapped_column(String(36))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

