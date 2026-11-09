import csv, io
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .core import audit, fail, require, serialize, tenant, user_from_request
from .db import get_db
from .models import Item, Location, Organization, OrganizationMember, StockBalance, StockMovement, User, now

router = APIRouter(prefix="/api/v1", tags=["inventory"])
MOVEMENT_FIELDS = ("id","item_id","asset_id","movement_type","source_location_id","destination_location_id","quantity","reference","note","performed_by","created_at")
class MoveIn(BaseModel):
    item_id: str
    quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    source_location_id: str | None = None
    destination_location_id: str | None = None
    reference: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=2000)
class AdjustmentIn(BaseModel):
    item_id: str
    location_id: str
    counted_quantity: Decimal = Field(ge=0, max_digits=14, decimal_places=3)
    reason: str = Field(min_length=3, max_length=2000)

def checked(db, model, org_id, object_id, label):
    x = db.scalar(select(model).where(model.organization_id == org_id, model.id == object_id))
    if not x: fail(404, f"{label} introuvable")
    return x

def balance(db, org_id, item_id, location_id):
    x = db.get(StockBalance, (org_id, item_id, location_id))
    if not x:
        x = StockBalance(organization_id=org_id, item_id=item_id, location_id=location_id, quantity=Decimal("0"))
        db.add(x); db.flush()
    return x

def lock_org(db, org_id):
    # PostgreSQL row lock serializes all stock and asset operations in this tenant.
    db.scalar(select(Organization).where(Organization.id == org_id).with_for_update())

def move(db, member, user, key, kind, body):
    require(member, "stock")
    if not key or len(key) > 120: fail(400, "En-tête Idempotency-Key requis")
    org_id = member.organization_id
    lock_org(db, org_id)
    previous = db.scalar(select(StockMovement).where(StockMovement.organization_id == org_id, StockMovement.idempotency_key == key))
    if previous:
        if previous.movement_type != kind or previous.item_id != body.item_id or previous.quantity != body.quantity or previous.source_location_id != body.source_location_id or previous.destination_location_id != body.destination_location_id:
            fail(409, "Clé d'idempotence déjà utilisée pour une autre opération")
        return serialize(previous, MOVEMENT_FIELDS)
    item = checked(db, Item, org_id, body.item_id, "Article")
    if item.tracking_mode != "BULK" or not item.is_active: fail(422, "Article en vrac actif requis")
    src, dst = body.source_location_id, body.destination_location_id
    if kind in ("ISSUE", "ADJUSTMENT_OUT") and not src: fail(422, "Source requise")
    if kind in ("RECEIPT", "RETURN", "ADJUSTMENT_IN") and not dst: fail(422, "Destination requise")
    if kind == "TRANSFER" and (not src or not dst or src == dst): fail(422, "Deux emplacements distincts requis")
    if src:
        loc = checked(db, Location, org_id, src, "Emplacement")
        if not loc.is_active: fail(422, "Emplacement inactif")
    if dst:
        loc = checked(db, Location, org_id, dst, "Emplacement")
        if not loc.is_active: fail(422, "Emplacement inactif")
    qty = body.quantity
    if src:
        source = balance(db, org_id, item.id, src)
        if source.quantity < qty: fail(409, "Stock insuffisant")
        source.quantity -= qty
    if dst: balance(db, org_id, item.id, dst).quantity += qty
    movement = StockMovement(organization_id=org_id, item_id=item.id, movement_type=kind, source_location_id=src, destination_location_id=dst, quantity=qty, reference=body.reference, note=body.note, performed_by=user.id, idempotency_key=key)
    db.add(movement); db.flush()
    audit(db, org_id, user.id, kind.lower(), "movement", movement.id)
    db.commit()
    return serialize(movement, MOVEMENT_FIELDS)

def endpoint(kind):
    def run(body: MoveIn, idempotency_key: str = Header(...), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
        if kind in ("RECEIPT", "RETURN") and body.source_location_id: fail(422, "Source interdite pour une réception")
        if kind == "ISSUE" and body.destination_location_id: fail(422, "Destination interdite pour une sortie")
        if kind == "TRANSFER" and (not body.source_location_id or not body.destination_location_id): fail(422, "Emplacements requis")
        return move(db, member, user, idempotency_key, kind, body)
    return run
router.add_api_route("/inventory/receipts", endpoint("RECEIPT"), methods=["POST"], status_code=201)
router.add_api_route("/inventory/issues", endpoint("ISSUE"), methods=["POST"], status_code=201)
router.add_api_route("/inventory/returns", endpoint("RETURN"), methods=["POST"], status_code=201)
router.add_api_route("/inventory/transfers", endpoint("TRANSFER"), methods=["POST"], status_code=201)

@router.post("/inventory/adjustments", status_code=201)
def adjustment(body: AdjustmentIn, idempotency_key: str = Header(...), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "stock")
    lock_org(db, member.organization_id)
    old = db.scalar(select(StockMovement).where(StockMovement.organization_id == member.organization_id, StockMovement.idempotency_key == idempotency_key))
    if old:
        if old.item_id != body.item_id or old.note != body.reason or old.reference != str(body.counted_quantity) or (old.source_location_id or old.destination_location_id) != body.location_id:
            fail(409, "Clé d'idempotence déjà utilisée pour une autre opération")
        return serialize(old, MOVEMENT_FIELDS)
    checked(db, Item, member.organization_id, body.item_id, "Article")
    checked(db, Location, member.organization_id, body.location_id, "Emplacement")
    current = db.get(StockBalance, (member.organization_id, body.item_id, body.location_id))
    difference = body.counted_quantity - (current.quantity if current else Decimal("0"))
    if difference == 0: return {"changed": False, "quantity": body.counted_quantity}
    move_body = MoveIn(item_id=body.item_id, quantity=abs(difference), source_location_id=body.location_id if difference < 0 else None, destination_location_id=body.location_id if difference > 0 else None, note=body.reason, reference=str(body.counted_quantity))
    return move(db, member, user, idempotency_key, "ADJUSTMENT_IN" if difference > 0 else "ADJUSTMENT_OUT", move_body)

@router.get("/inventory/balances")
def balances(item_id: str | None = None, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    stmt = select(StockBalance, Item.name, Item.sku, Location.name).join(Item, (StockBalance.item_id == Item.id) & (StockBalance.organization_id == Item.organization_id)).join(Location, (StockBalance.location_id == Location.id) & (StockBalance.organization_id == Location.organization_id)).where(StockBalance.organization_id == member.organization_id)
    if item_id: stmt = stmt.where(StockBalance.item_id == item_id)
    return [{"item_id": b.item_id, "item_name": name, "sku": sku, "location_id": b.location_id, "location_name": loc, "quantity": b.quantity} for b,name,sku,loc in db.execute(stmt.order_by(Item.name, Location.name))]

@router.get("/movements")
def movements(item_id: str | None = None, movement_type: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    filters = [StockMovement.organization_id == member.organization_id]
    if item_id: filters.append(StockMovement.item_id == item_id)
    if movement_type: filters.append(StockMovement.movement_type == movement_type)
    total = db.scalar(select(func.count()).select_from(StockMovement).where(*filters))
    rows = db.execute(select(StockMovement, Item.name).join(Item, StockMovement.item_id == Item.id).where(*filters).order_by(StockMovement.created_at.desc(), StockMovement.id.desc()).offset((page-1)*page_size).limit(page_size)).all()
    return {"data": [{**serialize(m, MOVEMENT_FIELDS), "item_name": name} for m,name in rows], "total": total, "page": page, "page_size": page_size}

@router.get("/dashboard/summary")
def dashboard(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    org = member.organization_id
    items = db.scalars(select(Item).where(Item.organization_id == org, Item.is_active == True)).all()
    quantities = dict(db.execute(select(StockBalance.item_id, func.sum(StockBalance.quantity)).where(StockBalance.organization_id == org).group_by(StockBalance.item_id)).all())
    low = [{ "id": x.id, "name": x.name, "quantity": quantities.get(x.id, 0), "threshold": x.low_stock_threshold } for x in items if x.tracking_mode == "BULK" and quantities.get(x.id, 0) <= x.low_stock_threshold]
    recent = db.execute(select(StockMovement, Item.name).join(Item, StockMovement.item_id == Item.id).where(StockMovement.organization_id == org).order_by(StockMovement.created_at.desc()).limit(8)).all()
    return {"total_items": len(items), "total_quantity": sum(quantities.values(), Decimal("0")), "estimated_value": sum((quantities.get(x.id, 0) * x.purchase_price for x in items), Decimal("0")), "low_stock": low, "recent_movements": [{**serialize(m, MOVEMENT_FIELDS), "item_name": name} for m,name in recent], "valuation_method": "Quantité actuelle × dernier coût d'achat configuré"}

@router.get("/reports/stock")
def report_stock(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    org = member.organization_id
    rows = db.execute(select(Item, StockBalance, Location.name).join(StockBalance, (Item.id == StockBalance.item_id) & (Item.organization_id == StockBalance.organization_id), isouter=True).join(Location, Location.id == StockBalance.location_id, isouter=True).where(Item.organization_id == org).order_by(Item.name)).all()
    return [{"item_id": i.id, "sku": i.sku, "name": i.name, "location": location or "", "quantity": b.quantity if b else Decimal("0"), "purchase_price": i.purchase_price, "estimated_value": (b.quantity if b else 0) * i.purchase_price} for i,b,location in rows]

def safe_csv(value):
    text = str(value if value is not None else "")
    return "'" + text if text.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else text

@router.get("/reports/stock.csv")
def report_csv(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    rows = report_stock(member, db)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["SKU","Article","Emplacement","Quantité","Coût","Valeur estimée"])
    for row in rows: writer.writerow([safe_csv(row[k]) for k in ("sku","name","location","quantity","purchase_price","estimated_value")])
    return Response(out.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": "attachment; filename=stock.csv"})

