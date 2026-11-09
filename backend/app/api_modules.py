from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .core import audit, fail, require, serialize, tenant, user_from_request
from .db import get_db
from .models import Asset, AuditLog, Contact, Item, Location, Organization, OrganizationMember, Rental, StockMovement, User, now
from .api_inventory import lock_org

router = APIRouter(prefix="/api/v1", tags=["modules"])
ASSET_FIELDS = ("id","item_id","serial_number","status","current_location_id","assigned_to","created_at")
RENTAL_FIELDS = ("id","asset_id","customer_id","start_date","expected_return_date","actual_return_date","status","notes")

def module(db, member, name):
    org = db.get(Organization, member.organization_id)
    if name not in org.enabled_modules: fail(403, "Module désactivé")

def asset_for(db, member, asset_id):
    x = db.scalar(select(Asset).where(Asset.organization_id == member.organization_id, Asset.id == asset_id))
    if not x: fail(404, "Équipement introuvable")
    return x

class AssetIn(BaseModel):
    item_id: str
    serial_number: str = Field(min_length=1, max_length=120)
    current_location_id: str

@router.get("/assets")
def assets(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read"); module(db, member, "equipment")
    return [serialize(x, ASSET_FIELDS) for x in db.scalars(select(Asset).where(Asset.organization_id == member.organization_id).order_by(Asset.serial_number))]

@router.post("/assets", status_code=201)
def create_asset(body: AssetIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write"); module(db, member, "equipment")
    item = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == body.item_id))
    loc = db.scalar(select(Location).where(Location.organization_id == member.organization_id, Location.id == body.current_location_id))
    if not item or item.tracking_mode != "SERIALIZED" or not item.is_active or not loc or not loc.is_active: fail(422, "Article sérialisé et emplacement actifs requis")
    x = Asset(organization_id=member.organization_id, **body.model_dump())
    db.add(x)
    try: db.flush()
    except IntegrityError: db.rollback(); fail(409, "Numéro de série déjà utilisé")
    audit(db, member.organization_id, user.id, "register", "asset", x.id)
    db.commit()
    return serialize(x, ASSET_FIELDS)

class AssignmentIn(BaseModel):
    person: str = Field(min_length=2, max_length=150)

def asset_event(db, member, user, asset, action, note):
    x = StockMovement(organization_id=member.organization_id, item_id=asset.item_id, asset_id=asset.id, movement_type=action, source_location_id=asset.current_location_id, quantity=1, note=note, performed_by=user.id, idempotency_key=f"asset:{asset.id}:{action}:{now().timestamp()}")
    db.add(x); db.flush()
    audit(db, member.organization_id, user.id, action.lower(), "asset", asset.id)
    db.commit()
    return serialize(asset, ASSET_FIELDS)

@router.post("/assets/{asset_id}/assign")
def assign(asset_id: str, body: AssignmentIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "equipment"); lock_org(db, member.organization_id)
    x = asset_for(db, member, asset_id)
    if x.status != "available": fail(409, "Équipement indisponible")
    x.status = "assigned"; x.assigned_to = body.person.strip()
    return asset_event(db, member, user, x, "ASSIGNMENT", f"Assigné à {x.assigned_to}")

@router.post("/assets/{asset_id}/return")
def return_asset(asset_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "equipment"); lock_org(db, member.organization_id)
    x = asset_for(db, member, asset_id)
    if x.status != "assigned": fail(409, "Équipement non assigné")
    x.status = "available"; x.assigned_to = None
    return asset_event(db, member, user, x, "RETURN", "Retour d'affectation")

@router.post("/assets/{asset_id}/maintenance")
def maintenance(asset_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "equipment"); lock_org(db, member.organization_id)
    x = asset_for(db, member, asset_id)
    if x.status != "available": fail(409, "Équipement indisponible")
    x.status = "maintenance"
    audit(db, member.organization_id, user.id, "maintenance", "asset", x.id); db.commit()
    return serialize(x, ASSET_FIELDS)

@router.post("/assets/{asset_id}/available")
def available(asset_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "equipment"); lock_org(db, member.organization_id)
    x = asset_for(db, member, asset_id)
    if x.status != "maintenance": fail(409, "Équipement non en maintenance")
    x.status = "available"
    audit(db, member.organization_id, user.id, "available", "asset", x.id); db.commit()
    return serialize(x, ASSET_FIELDS)

@router.get("/assets/{asset_id}/history")
def asset_history(asset_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read"); module(db, member, "equipment"); asset_for(db, member, asset_id)
    rows = db.scalars(select(AuditLog).where(AuditLog.organization_id == member.organization_id, AuditLog.entity_type == "asset", AuditLog.entity_id == asset_id).order_by(AuditLog.timestamp.desc())).all()
    return [serialize(x, ("action","actor_id","details","timestamp")) for x in rows]

class RentalIn(BaseModel):
    asset_id: str
    customer_id: str
    start_date: datetime
    expected_return_date: datetime
    notes: str = ""

def utc(dt):
    if not dt.tzinfo: fail(422, "Date avec fuseau horaire requise")
    return dt.astimezone(timezone.utc)

@router.get("/rentals")
def rentals(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read"); module(db, member, "rental")
    rows = db.scalars(select(Rental).where(Rental.organization_id == member.organization_id).order_by(Rental.start_date.desc())).all()
    return [{**serialize(x, RENTAL_FIELDS), "overdue": x.status == "active" and x.expected_return_date.replace(tzinfo=timezone.utc) < now()} for x in rows]

@router.post("/rentals", status_code=201)
def create_rental(body: RentalIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "rental"); lock_org(db, member.organization_id)
    start, end = utc(body.start_date), utc(body.expected_return_date)
    if end <= start or end <= now(): fail(422, "Période invalide")
    asset = asset_for(db, member, body.asset_id)
    if asset.status != "available": fail(409, "Équipement indisponible")
    customer = db.scalar(select(Contact).where(Contact.organization_id == member.organization_id, Contact.id == body.customer_id, Contact.kind == "customer"))
    if not customer: fail(404, "Client introuvable")
    conflicts = db.scalar(select(Rental.id).where(Rental.organization_id == member.organization_id, Rental.asset_id == asset.id, Rental.status.in_(("active","reserved")), Rental.start_date < end, Rental.expected_return_date > start))
    if conflicts: fail(409, "Réservation chevauchante")
    active = start <= now()
    x = Rental(organization_id=member.organization_id, asset_id=asset.id, customer_id=customer.id, start_date=start, expected_return_date=end, status="active" if active else "reserved", notes=body.notes)
    db.add(x); db.flush()
    if active: asset.status = "rented"
    audit(db, member.organization_id, user.id, "create", "rental", x.id)
    db.commit()
    return serialize(x, RENTAL_FIELDS)

@router.post("/rentals/{rental_id}/activate")
def activate_rental(rental_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "rental"); lock_org(db, member.organization_id)
    x = db.scalar(select(Rental).where(Rental.organization_id == member.organization_id, Rental.id == rental_id))
    if not x: fail(404, "Location introuvable")
    asset = asset_for(db, member, x.asset_id)
    if x.status != "reserved" or x.start_date.replace(tzinfo=timezone.utc) > now() or asset.status != "available": fail(409, "Location non activable")
    x.status = "active"; asset.status = "rented"
    audit(db, member.organization_id, user.id, "activate", "rental", x.id); db.commit()
    return serialize(x, RENTAL_FIELDS)

@router.post("/rentals/{rental_id}/return")
def return_rental(rental_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "rental"); lock_org(db, member.organization_id)
    x = db.scalar(select(Rental).where(Rental.organization_id == member.organization_id, Rental.id == rental_id))
    if not x: fail(404, "Location introuvable")
    if x.status != "active": fail(409, "Location non active")
    x.status = "returned"; x.actual_return_date = now()
    asset = asset_for(db, member, x.asset_id); asset.status = "available"
    audit(db, member.organization_id, user.id, "return", "rental", x.id); db.commit()
    return serialize(x, RENTAL_FIELDS)

@router.post("/rentals/{rental_id}/cancel")
def cancel_rental(rental_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock"); module(db, member, "rental"); lock_org(db, member.organization_id)
    x = db.scalar(select(Rental).where(Rental.organization_id == member.organization_id, Rental.id == rental_id))
    if not x: fail(404, "Location introuvable")
    if x.status != "reserved": fail(409, "Seules les réservations peuvent être annulées")
    x.status = "cancelled"
    audit(db, member.organization_id, user.id, "cancel", "rental", x.id); db.commit()
    return serialize(x, RENTAL_FIELDS)

