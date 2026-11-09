"""Development-only deterministic demo data. Set DEMO_PASSWORD explicitly."""
import os
from datetime import timedelta
from decimal import Decimal
from sqlalchemy import select
from app.db import SessionLocal
from app.core import ph, TEMPLATES
from app.models import User, Organization, OrganizationMember, Category, Location, Item, Contact, Asset, Rental, StockBalance, StockMovement, now

def get_or_create(db, model, filters, values=None):
    obj = db.scalar(select(model).filter_by(**filters))
    if obj: return obj
    obj = model(**filters, **(values or {})); db.add(obj); db.flush(); return obj

def main():
    password = os.environ.get("DEMO_PASSWORD")
    if not password or len(password) < 12:
        raise SystemExit("Set DEMO_PASSWORD to at least 12 characters before seeding.")
    with SessionLocal() as db:
        user = get_or_create(db, User, {"email":"demo@sl3ti.ma"}, {"password_hash":ph.hash(password),"full_name":"Atlas Demo"})
        user.password_hash = ph.hash(password)
        data = [("Atlas Commerce","commerce"),("Atlas Equipment","equipment"),("Atlas Rental","rental")]
        for name, business_type in data:
            org = db.scalar(select(Organization).where(Organization.name == name, Organization.slug.like("demo-%")))
            if not org:
                org = Organization(name=name, slug="demo-"+business_type, business_type=business_type, enabled_modules=TEMPLATES[business_type].copy())
                db.add(org); db.flush()
            get_or_create(db, OrganizationMember, {"organization_id":org.id,"user_id":user.id},{"role":"owner"})
            mainloc = get_or_create(db, Location, {"organization_id":org.id,"name":"Dépôt principal"})
            second = get_or_create(db, Location, {"organization_id":org.id,"name":"Magasin secondaire"})
            if business_type == "commerce":
                categories = [get_or_create(db, Category, {"organization_id":org.id,"name":n}) for n in ("Alimentation","Matériaux","Accessoires")]
                products = ["Eau minérale 1L","Thé vert 200g","Café moulu 250g","Sucre 1kg","Farine 1kg","Huile 1L","Lait UHT","Riz 1kg","Pâtes 500g","Savon","Shampoing","Ciment 50kg","Peinture 5L","Vis 100 pièces","Ampoule LED","Câble USB","Chargeur USB-C","Carnet A5","Stylo bleu","Ruban adhésif"]
                for i, title in enumerate(products):
                    item = get_or_create(db, Item, {"organization_id":org.id,"sku":f"AT-{i+1:03}"}, {"name":title,"category_id":categories[i%3].id,"purchase_price":Decimal(5+i),"sale_price":Decimal(8+i),"low_stock_threshold":Decimal(5)})
                    qty = Decimal(2 if i%6==0 else 18+i)
                    bal = get_or_create(db, StockBalance, {"organization_id":org.id,"item_id":item.id,"location_id":mainloc.id},{"quantity":qty})
                    key = f"seed-receipt-{i}"
                    get_or_create(db, StockMovement, {"organization_id":org.id,"idempotency_key":key},{"item_id":item.id,"movement_type":"RECEIPT","destination_location_id":mainloc.id,"quantity":qty,"performed_by":user.id,"reference":"DEMO"})
                    if i%4==0:
                        moved = Decimal(1)
                        other = get_or_create(db, StockBalance, {"organization_id":org.id,"item_id":item.id,"location_id":second.id},{"quantity":moved})
                        if not db.scalar(select(StockMovement.id).where(StockMovement.organization_id==org.id,StockMovement.idempotency_key==f"seed-transfer-{i}")):
                            bal.quantity-=moved
                            db.add(StockMovement(organization_id=org.id,item_id=item.id,movement_type="TRANSFER",source_location_id=mainloc.id,destination_location_id=second.id,quantity=moved,performed_by=user.id,idempotency_key=f"seed-transfer-{i}",reference="DEMO"))
                    if i%5==0 and not db.scalar(select(StockMovement.id).where(StockMovement.organization_id==org.id,StockMovement.idempotency_key==f"seed-issue-{i}")):
                        bal.quantity -= Decimal(1)
                        db.add(StockMovement(organization_id=org.id,item_id=item.id,movement_type="ISSUE",source_location_id=mainloc.id,quantity=Decimal(1),performed_by=user.id,idempotency_key=f"seed-issue-{i}",reference="DEMO"))
                for n in ("Client Casablanca","Client Rabat"):
                    get_or_create(db, Contact, {"organization_id":org.id,"kind":"customer","name":n})
                for n in ("Fournisseur Atlas","Fournisseur Sud"):
                    get_or_create(db, Contact, {"organization_id":org.id,"kind":"supplier","name":n})
            else:
                item = get_or_create(db, Item, {"organization_id":org.id,"sku":"ASSET-001"}, {"name":"Perceuse professionnelle" if business_type=="equipment" else "Véhicule utilitaire","tracking_mode":"SERIALIZED","item_type":"equipment","purchase_price":Decimal(1200)})
                for i in range(3):
                    status = "available"
                    if business_type=="equipment" and i==1: status="assigned"
                    if business_type=="equipment" and i==2: status="maintenance"
                    if business_type=="rental" and i==1: status="rented"
                    asset = get_or_create(db, Asset, {"organization_id":org.id,"serial_number":f"{business_type.upper()}-{i+1:03}"}, {"item_id":item.id,"current_location_id":mainloc.id,"status":status,"assigned_to":"Samira" if status=="assigned" else None})
                    if business_type=="rental" and i==1:
                        customer = get_or_create(db, Contact, {"organization_id":org.id,"kind":"customer","name":"Client Démo"})
                        if not db.scalar(select(Rental.id).where(Rental.organization_id==org.id,Rental.asset_id==asset.id)):
                            db.add(Rental(organization_id=org.id,asset_id=asset.id,customer_id=customer.id,start_date=now()-timedelta(days=4),expected_return_date=now()-timedelta(days=1),status="active"))
        db.commit()
        print("Demo seeded. Login: demo@sl3ti.ma; password: DEMO_PASSWORD from your environment.")

if __name__=="__main__": main()

