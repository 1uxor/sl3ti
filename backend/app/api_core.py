from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .core import TEMPLATES, audit, fail, require, serialize, slugify, tenant, user_from_request
from .db import get_db
from .models import Category, Contact, Item, Location, Organization, OrganizationMember, StockBalance, StockMovement, User, uid

router = APIRouter(prefix="/api/v1", tags=["core"])
ITEM_FIELDS = ("id","category_id","sku","name","description","item_type","tracking_mode","unit","purchase_price","sale_price","low_stock_threshold","is_active","image_url","created_at")
LOCATION_FIELDS = ("id","name","type","description","is_active")
CONTACT_FIELDS = ("id","kind","name","phone","email","address")

class OrgCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    business_type: str = "commerce"
    main_location: str = Field(min_length=2, max_length=120)

@router.get("/organizations")
def organizations(db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    rows = db.execute(select(Organization, OrganizationMember.role).join(OrganizationMember, Organization.id == OrganizationMember.organization_id).where(OrganizationMember.user_id == user.id)).all()
    return [{**serialize(org, ("id","name","slug","business_type","enabled_modules","default_currency","timezone")), "role": role} for org, role in rows]

@router.post("/organizations", status_code=201)
def create_organization(body: OrgCreate, db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    if body.business_type not in TEMPLATES: fail(422, "Type d'activité invalide")
    org = Organization(name=body.name.strip(), slug=f"{slugify(body.name)}-{uid()[:8]}", business_type=body.business_type, enabled_modules=TEMPLATES[body.business_type].copy())
    db.add(org); db.flush()
    db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role="owner"))
    location = Location(organization_id=org.id, name=body.main_location.strip())
    db.add(location)
    audit(db, org.id, user.id, "create", "organization", org.id)
    db.commit()
    return serialize(org, ("id","name","slug","business_type","enabled_modules"))

class ModulesUpdate(BaseModel):
    enabled_modules: list[str]

@router.patch("/organizations/current/modules")
def update_modules(body: ModulesUpdate, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "settings")
    modules = sorted(set(body.enabled_modules))
    if any(x not in ("commerce", "equipment", "rental") for x in modules) or ("rental" in modules and "equipment" not in modules): fail(422, "Modules invalides")
    org = db.get(Organization, member.organization_id)
    org.enabled_modules = modules
    audit(db, org.id, user.id, "update_modules", "organization", org.id, {"modules": modules})
    db.commit()
    return {"enabled_modules": modules}

class MemberCreate(BaseModel):
    email: str
    role: str

@router.get("/members")
def members(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    rows = db.execute(select(User, OrganizationMember.role).join(OrganizationMember, User.id == OrganizationMember.user_id).where(OrganizationMember.organization_id == member.organization_id)).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": role} for u, role in rows]

@router.post("/members", status_code=201)
def add_member(body: MemberCreate, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "team")
    if body.role not in ("admin", "manager", "staff", "viewer"): fail(422, "Rôle invalide")
    target = db.scalar(select(User).where(User.email == body.email.lower()))
    if not target: fail(404, "Utilisateur introuvable")
    if db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == member.organization_id, OrganizationMember.user_id == target.id)): fail(409, "Déjà membre")
    db.add(OrganizationMember(organization_id=member.organization_id, user_id=target.id, role=body.role))
    audit(db, member.organization_id, user.id, "add_member", "user", target.id, {"role": body.role})
    db.commit()
    return {"user_id": target.id, "role": body.role}

class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = ""

@router.get("/categories")
def categories(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    return [serialize(x, ("id","name","description")) for x in db.scalars(select(Category).where(Category.organization_id == member.organization_id).order_by(Category.name))]

@router.post("/categories", status_code=201)
def create_category(body: CategoryIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = Category(organization_id=member.organization_id, **body.model_dump())
    db.add(x)
    try: db.flush()
    except IntegrityError: db.rollback(); fail(409, "Catégorie déjà existante")
    audit(db, member.organization_id, user.id, "create", "category", x.id)
    db.commit()
    return serialize(x, ("id","name","description"))

class LocationIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = "warehouse"
    description: str = ""

@router.get("/locations")
def locations(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    return [serialize(x, LOCATION_FIELDS) for x in db.scalars(select(Location).where(Location.organization_id == member.organization_id).order_by(Location.name))]

@router.post("/locations", status_code=201)
def create_location(body: LocationIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = Location(organization_id=member.organization_id, **body.model_dump())
    db.add(x)
    try: db.flush()
    except IntegrityError: db.rollback(); fail(409, "Emplacement déjà existant")
    audit(db, member.organization_id, user.id, "create", "location", x.id)
    db.commit()
    return serialize(x, LOCATION_FIELDS)

class ItemIn(BaseModel):
    category_id: str | None = None
    sku: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=180)
    description: str = ""
    item_type: str = "product"
    tracking_mode: str = "BULK"
    unit: str = "unité"
    purchase_price: Decimal = Field(default=Decimal("0"), ge=0)
    sale_price: Decimal = Field(default=Decimal("0"), ge=0)
    low_stock_threshold: Decimal = Field(default=Decimal("0"), ge=0)
    image_url: str | None = None

class ItemPatch(BaseModel):
    category_id: str | None = None
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    unit: str | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, ge=0)
    low_stock_threshold: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None
    image_url: str | None = None

def check_category(db, org_id, category_id):
    if category_id and not db.scalar(select(Category.id).where(Category.organization_id == org_id, Category.id == category_id)): fail(404, "Catégorie introuvable")

@router.get("/items")
def items(q: str = "", category_id: str | None = None, tracking_mode: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    filters = [Item.organization_id == member.organization_id]
    if q: filters.append(Item.name.ilike(f"%{q}%") | Item.sku.ilike(f"%{q}%"))
    if category_id: filters.append(Item.category_id == category_id)
    if tracking_mode: filters.append(Item.tracking_mode == tracking_mode)
    total = db.scalar(select(func.count()).select_from(Item).where(*filters))
    rows = db.scalars(select(Item).where(*filters).order_by(Item.name).offset((page-1)*page_size).limit(page_size)).all()
    return {"data": [serialize(x, ITEM_FIELDS) for x in rows], "total": total, "page": page, "page_size": page_size}

@router.post("/items", status_code=201)
def create_item(body: ItemIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    if body.tracking_mode not in ("BULK", "SERIALIZED"): fail(422, "Suivi invalide")
    check_category(db, member.organization_id, body.category_id)
    x = Item(organization_id=member.organization_id, **body.model_dump())
    db.add(x)
    try: db.flush()
    except IntegrityError: db.rollback(); fail(409, "SKU déjà utilisé")
    audit(db, member.organization_id, user.id, "create", "item", x.id)
    db.commit()
    return serialize(x, ITEM_FIELDS)

@router.get("/items/{item_id}")
def get_item(item_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    x = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == item_id))
    if not x: fail(404, "Article introuvable")
    return serialize(x, ITEM_FIELDS)

@router.patch("/items/{item_id}")
def patch_item(item_id: str, body: ItemPatch, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == item_id))
    if not x: fail(404, "Article introuvable")
    values = body.model_dump(exclude_unset=True)
    if "category_id" in values: check_category(db, member.organization_id, values["category_id"])
    for key, value in values.items(): setattr(x, key, value)
    try: db.flush()
    except IntegrityError: db.rollback(); fail(409, "SKU déjà utilisé")
    audit(db, member.organization_id, user.id, "update", "item", x.id)
    db.commit()
    return serialize(x, ITEM_FIELDS)

@router.post("/items/{item_id}/image")
async def upload_item_image(item_id: str, file: UploadFile = File(...), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == item_id))
    if not x: fail(404, "Article introuvable")
    from .storage import upload_image, delete_image
    file_bytes = await file.read()
    try:
        url = await upload_image(org_id=member.organization_id, file_bytes=file_bytes, content_type=file.content_type or "image/jpeg", original_filename=file.filename or "image.jpg")
    except ValueError as e:
        fail(422, str(e))
    except RuntimeError as e:
        fail(502, str(e))
    if x.image_url:
        await delete_image(x.image_url)
    x.image_url = url
    audit(db, member.organization_id, user.id, "upload_image", "item", x.id)
    db.commit()
    return {"image_url": url}

@router.delete("/items/{item_id}/image", status_code=204)
async def delete_item_image(item_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == item_id))
    if not x: fail(404, "Article introuvable")
    if x.image_url:
        from .storage import delete_image
        await delete_image(x.image_url)
        x.image_url = None
        audit(db, member.organization_id, user.id, "delete_image", "item", x.id)
        db.commit()

@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Item).where(Item.organization_id == member.organization_id, Item.id == item_id))
    if not x: fail(404, "Article introuvable")
    has_stock = db.scalar(select(StockBalance.item_id).where(StockBalance.organization_id == member.organization_id, StockBalance.item_id == item_id, StockBalance.quantity > 0))
    if has_stock: fail(409, "Impossible de supprimer un article avec du stock. Archivez-le plutôt.")
    has_movements = db.scalar(select(StockMovement.id).where(StockMovement.organization_id == member.organization_id, StockMovement.item_id == item_id))
    if has_movements: fail(409, "Impossible de supprimer un article avec un historique de mouvements. Archivez-le plutôt.")
    db.delete(x)
    audit(db, member.organization_id, user.id, "delete", "item", item_id)
    db.commit()

@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Category).where(Category.organization_id == member.organization_id, Category.id == category_id))
    if not x: fail(404, "Catégorie introuvable")
    has_items = db.scalar(select(Item.id).where(Item.organization_id == member.organization_id, Item.category_id == category_id))
    if has_items: fail(409, "Catégorie utilisée par des articles")
    db.delete(x)
    audit(db, member.organization_id, user.id, "delete", "category", category_id)
    db.commit()

@router.delete("/locations/{location_id}", status_code=204)
def delete_location(location_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    x = db.scalar(select(Location).where(Location.organization_id == member.organization_id, Location.id == location_id))
    if not x: fail(404, "Emplacement introuvable")
    has_stock = db.scalar(select(StockBalance.location_id).where(StockBalance.organization_id == member.organization_id, StockBalance.location_id == location_id, StockBalance.quantity > 0))
    if has_stock: fail(409, "Emplacement contient du stock")
    db.delete(x)
    audit(db, member.organization_id, user.id, "delete", "location", location_id)
    db.commit()

class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    phone: str = ""
    email: str = ""
    address: str = ""

@router.get("/contacts/{kind}")
def contacts(kind: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    if kind not in ("customer","supplier"): fail(404, "Type introuvable")
    return [serialize(x, CONTACT_FIELDS) for x in db.scalars(select(Contact).where(Contact.organization_id == member.organization_id, Contact.kind == kind).order_by(Contact.name))]

@router.post("/contacts/{kind}", status_code=201)
def create_contact(kind: str, body: ContactIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    if kind not in ("customer","supplier"): fail(404, "Type introuvable")
    x = Contact(organization_id=member.organization_id, kind=kind, **body.model_dump())
    db.add(x); db.flush(); audit(db, member.organization_id, user.id, "create", kind, x.id); db.commit()
    return serialize(x, CONTACT_FIELDS)

@router.patch("/contacts/{kind}/{contact_id}")
def update_contact(kind: str, contact_id: str, body: ContactIn, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    if kind not in ("customer","supplier"): fail(404, "Type introuvable")
    x = db.scalar(select(Contact).where(Contact.organization_id == member.organization_id, Contact.id == contact_id, Contact.kind == kind))
    if not x: fail(404, "Contact introuvable")
    for key, value in body.model_dump(exclude_unset=True).items(): setattr(x, key, value)
    audit(db, member.organization_id, user.id, "update", kind, contact_id)
    db.commit()
    return serialize(x, CONTACT_FIELDS)

@router.delete("/contacts/{kind}/{contact_id}", status_code=204)
def delete_contact(kind: str, contact_id: str, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    if kind not in ("customer","supplier"): fail(404, "Type introuvable")
    x = db.scalar(select(Contact).where(Contact.organization_id == member.organization_id, Contact.id == contact_id, Contact.kind == kind))
    if not x: fail(404, "Contact introuvable")
    db.delete(x)
    audit(db, member.organization_id, user.id, "delete", kind, contact_id)
    db.commit()

class OrgUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=150)

@router.patch("/organizations/current")
def update_organization(body: OrgUpdate, member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "settings")
    org = db.get(Organization, member.organization_id)
    org.name = body.name.strip()
    audit(db, org.id, user.id, "update", "organization", org.id, {"name": org.name})
    db.commit()
    return serialize(org, ("id","name","slug","business_type","enabled_modules"))


# CSV catalog exchange. The full file is validated before committing any row.
import csv
import io
from fastapi import File, UploadFile, Response
from pydantic import ValidationError

@router.get("/items.csv")
def export_items(member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db)):
    require(member, "read")
    from .api_inventory import safe_csv
    out = io.StringIO()
    writer = csv.writer(out)
    columns = ["sku","name","description","tracking_mode","unit","purchase_price","sale_price","low_stock_threshold"]
    writer.writerow(columns)
    for x in db.scalars(select(Item).where(Item.organization_id == member.organization_id).order_by(Item.sku)):
        writer.writerow([safe_csv(getattr(x,k)) for k in columns])
    return Response(out.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition":"attachment; filename=items.csv"})

@router.post("/items/import", status_code=201)
async def import_items(file: UploadFile = File(...), member: OrganizationMember = Depends(tenant), db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    require(member, "write")
    if not file.filename.lower().endswith(".csv"): fail(422, "Fichier CSV requis")
    raw = await file.read(1_000_001)
    if len(raw) > 1_000_000: fail(413, "Fichier trop volumineux")
    try: content = raw.decode("utf-8-sig")
    except UnicodeDecodeError: fail(422, "CSV UTF-8 requis")
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames or not {"sku","name"}.issubset(reader.fieldnames): fail(422, "Colonnes SKU et name requises")
    if len(set(reader.fieldnames)) != len(reader.fieldnames): fail(422, "Colonnes dupliquées")
    allowed = set(ItemIn.model_fields)
    if any(k not in allowed for k in reader.fieldnames): fail(422, "Colonne inconnue")
    rows = []
    for index, row in enumerate(reader, start=2):
        if index > 1001: fail(413, "Maximum 1000 lignes")
        try: data = ItemIn.model_validate({k:v for k,v in row.items() if v not in (None,"")})
        except ValidationError: fail(422, f"Ligne {index} invalide")
        if data.tracking_mode not in ("BULK","SERIALIZED"): fail(422, f"Ligne {index}: mode de suivi invalide")
        rows.append(data)
    seen = set()
    for row in rows:
        if row.sku in seen or db.scalar(select(Item.id).where(Item.organization_id == member.organization_id, Item.sku == row.sku)): fail(409, f"SKU déjà utilisé: {row.sku}")
        seen.add(row.sku)
        check_category(db, member.organization_id, row.category_id)
    for row in rows:
        x = Item(organization_id=member.organization_id, **row.model_dump())
        db.add(x); db.flush()
        audit(db, member.organization_id, user.id, "import", "item", x.id)
    db.commit()
    return {"imported": len(rows)}

