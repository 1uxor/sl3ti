import os
os.environ["DATABASE_URL"] = "sqlite://"
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.db import Base, get_db
from app import models
from app.main import app

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, expire_on_commit=False)
Base.metadata.create_all(engine)
def override_db():
    with TestingSession() as db:
        yield db
app.dependency_overrides[get_db] = override_db
client = TestClient(app)

import pytest
@pytest.fixture(scope="module", autouse=True)
def close_client():
    yield
    client.close()

def api(method, path, org=None, data=None, key=None, csrf=None):
    headers = {}
    if org: headers["X-Organization-ID"] = org
    if key: headers["Idempotency-Key"] = key
    token = csrf or client.cookies.get("sl3ti_csrf")
    if token: headers["X-CSRF-Token"] = token
    return client.request(method, "/api/v1" + path, json=data, headers=headers)

def test_workflow_and_isolation():
    email = "owner@example.com"
    r = api("POST", "/auth/register", data={"email": email, "password": "very-strong-password", "full_name": "Test Owner"})
    assert r.status_code == 200, r.text
    assert api("GET", "/auth/me").status_code == 200
    a = api("POST", "/organizations", data={"name":"Atlas A","business_type":"commerce","main_location":"Main A"}).json()
    b = api("POST", "/organizations", data={"name":"Atlas B","business_type":"commerce","main_location":"Main B"}).json()
    org = a["id"]
    loc = api("GET", "/locations", org).json()[0]["id"]
    other_loc = api("GET", "/locations", b["id"]).json()[0]["id"]
    assert api("POST","/items",org,{"sku":"SKU-1","name":"Cement","purchase_price":12,"low_stock_threshold":2}).status_code == 201
    item = api("GET","/items",org).json()["data"][0]["id"]
    assert api("GET",f"/items/{item}",b["id"]).status_code == 404
    assert api("POST","/inventory/receipts",org,{"item_id":item,"quantity":10,"destination_location_id":other_loc},key="badloc").status_code == 404
    receipt = {"item_id":item,"quantity":10,"destination_location_id":loc}
    r = api("POST","/inventory/receipts",org,receipt,key="receive-1")
    assert r.status_code == 201, r.text
    assert api("POST","/inventory/receipts",org,receipt,key="receive-1").json()["id"] == r.json()["id"]
    assert api("POST","/inventory/receipts",org,{"item_id":item,"quantity":1,"destination_location_id":loc},key="receive-1").status_code == 409
    assert api("POST","/inventory/issues",org,{"item_id":item,"quantity":11,"source_location_id":loc},key="over").status_code == 409
    assert api("POST","/inventory/issues",org,{"item_id":item,"quantity":3,"source_location_id":loc},key="issue-1").status_code == 201
    second = api("POST","/locations",org,{"name":"Second"}).json()["id"]
    assert api("POST","/inventory/transfers",org,{"item_id":item,"quantity":2,"source_location_id":loc,"destination_location_id":second},key="transfer-1").status_code == 201
    balances = api("GET","/inventory/balances",org).json()
    assert sorted(float(x["quantity"]) for x in balances) == [2,5]
    assert api("POST","/inventory/adjustments",org,{"item_id":item,"location_id":loc,"counted_quantity":4,"reason":"Physical count"},key="adjust-1").status_code == 201
    assert api("GET","/movements",org).json()["total"] == 4
    assert float(api("GET","/dashboard/summary",org).json()["total_quantity"]) == 6
    assert api("POST","/inventory/returns",org,{"item_id":item,"quantity":1,"destination_location_id":loc},key="return-1").status_code == 201

def test_staff_permissions_and_csrf():
    owner = api("POST","/auth/register",data={"email":"staff@example.com","password":"very-strong-password","full_name":"Staff"})
    assert owner.status_code == 200
    staff_csrf = client.cookies.get("sl3ti_csrf")
    assert api("POST","/organizations",data={"name":"Staff Org","main_location":"Main"}).status_code == 201
    org = api("GET","/organizations").json()[-1]["id"]
    assert api("POST","/items",org,{"sku":"X","name":"X"},csrf="wrong").status_code == 403
    assert api("GET","/items",org).status_code == 200



def test_equipment_and_rental_workflows():
    assert api("POST","/auth/register",data={"email":"renter@example.com","password":"very-strong-password","full_name":"Renter"}).status_code == 200
    org = api("POST","/organizations",data={"name":"Rental Lab","business_type":"rental","main_location":"Depot"}).json()["id"]
    loc = api("GET","/locations",org).json()[0]["id"]
    item = api("POST","/items",org,{"sku":"CAR-1","name":"Car","tracking_mode":"SERIALIZED"}).json()["id"]
    a = api("POST","/assets",org,{"item_id":item,"serial_number":"CAR-001","current_location_id":loc})
    assert a.status_code == 201, a.text
    asset = a.json()["id"]
    assert api("POST",f"/assets/{asset}/assign",org,{"person":"Nadia"}).status_code == 200
    assert api("POST",f"/assets/{asset}/assign",org,{"person":"Samira"}).status_code == 409
    assert api("POST",f"/assets/{asset}/return",org,{}).status_code == 200
    customer = api("POST","/contacts/customer",org,{"name":"Client"}).json()["id"]
    from datetime import datetime, timedelta, timezone
    start = (datetime.now(timezone.utc)-timedelta(hours=1)).isoformat()
    end = (datetime.now(timezone.utc)+timedelta(days=2)).isoformat()
    body = {"asset_id":asset,"customer_id":customer,"start_date":start,"expected_return_date":end}
    r = api("POST","/rentals",org,body)
    assert r.status_code == 201, r.text
    rental = r.json()["id"]
    assert api("POST","/rentals",org,body).status_code == 409
    assert api("POST",f"/rentals/{rental}/return",org,{}).status_code == 200
    assert api("POST",f"/rentals/{rental}/return",org,{}).status_code == 409
    future = {"asset_id":asset,"customer_id":customer,"start_date":(datetime.now(timezone.utc)+timedelta(days=3)).isoformat(),"expected_return_date":(datetime.now(timezone.utc)+timedelta(days=4)).isoformat()}
    assert api("POST","/rentals",org,future).json()["status"] == "reserved"
    assert api("GET","/assets",org).json()[0]["status"] == "available"

def test_unrelated_user_cannot_read_tenant():
    assert api("POST","/auth/register",data={"email":"outsider@example.com","password":"very-strong-password","full_name":"Outsider"}).status_code == 200
    existing_org = models.Organization.__table__  # avoid relying on a guessed object ID
    from sqlalchemy import select
    with TestingSession() as db:
        org_id = db.scalar(select(models.Organization.id).where(models.Organization.name == "Atlas A"))
    assert api("GET","/items",org_id).status_code == 404


def test_viewer_is_read_only():
    assert api("POST","/auth/register",data={"email":"viewer2@example.com","password":"very-strong-password","full_name":"Viewer"}).status_code == 200
    viewer_session, viewer_csrf = client.cookies.get("sl3ti_session"), client.cookies.get("sl3ti_csrf")
    assert api("POST","/auth/register",data={"email":"owner2@example.com","password":"very-strong-password","full_name":"Owner Two"}).status_code == 200
    org = api("POST","/organizations",data={"name":"Role Lab","main_location":"Depot"}).json()["id"]
    assert api("POST","/members",org,{"email":"viewer2@example.com","role":"viewer"}).status_code == 201
    client.cookies.clear()
    client.cookies.set("sl3ti_session",viewer_session,domain="testserver.local",path="/")
    client.cookies.set("sl3ti_csrf",viewer_csrf,domain="testserver.local",path="/")
    assert api("GET","/items",org).status_code == 200
    assert api("POST","/items",org,{"sku":"NO","name":"No"}).status_code == 403

def test_catalog_csv_import_is_atomic_and_export_safe():
    assert api("POST","/auth/register",data={"email":"csv@example.com","password":"very-strong-password","full_name":"CSV Owner"}).status_code == 200
    org = api("POST","/organizations",data={"name":"CSV Lab","main_location":"Depot"}).json()["id"]
    headers={"X-Organization-ID":org,"X-CSRF-Token":client.cookies.get("sl3ti_csrf")}
    r=client.post("/api/v1/items/import",headers=headers,files={"file":("items.csv",b"sku,name,purchase_price\nCSV-1,Safe item,12\nCSV-2,Second item,8\n","text/csv")})
    assert r.status_code == 201, r.text
    assert r.json()["imported"] == 2
    bad=client.post("/api/v1/items/import",headers=headers,files={"file":("items.csv",b"sku,name\nCSV-3,New item\nCSV-1,Duplicate\n","text/csv")})
    assert bad.status_code == 409
    assert api("GET","/items",org).json()["total"] == 2
    assert client.get("/api/v1/items.csv",headers={"X-Organization-ID":org}).status_code == 200

