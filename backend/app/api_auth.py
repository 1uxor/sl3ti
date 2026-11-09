import hashlib, os, secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from argon2.exceptions import VerifyMismatchError
from .core import ph, fail, rate_limit, serialize, user_from_request
from .db import get_db
from .models import User, Session as LoginSession, now

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
USER_FIELDS = ("id", "email", "full_name", "preferred_language")

class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=200)

class Registration(Credentials):
    full_name: str = Field(min_length=2, max_length=150)
    preferred_language: str = "fr"

def establish(db, user, response):
    raw, csrf = secrets.token_urlsafe(48), secrets.token_urlsafe(32)
    db.add(LoginSession(token_hash=hashlib.sha256(raw.encode()).hexdigest(), user_id=user.id, csrf_token=csrf, expires_at=now() + timedelta(days=7)))
    db.commit()
    secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie("sl3ti_session", raw, httponly=True, secure=secure, samesite="lax", max_age=604800, path="/")
    response.set_cookie("sl3ti_csrf", csrf, httponly=False, secure=secure, samesite="lax", max_age=604800, path="/")
    return {"user": serialize(user, USER_FIELDS), "csrf_token": csrf}

@router.post("/register")
def register(body: Registration, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limit("register:" + (request.client.host if request.client else "unknown"))
    email = str(body.email).lower()
    if db.scalar(select(User.id).where(User.email == email)): fail(409, "Adresse e-mail déjà utilisée")
    if body.preferred_language not in ("fr", "ar", "en"): fail(422, "Langue invalide")
    user = User(email=email, password_hash=ph.hash(body.password), full_name=body.full_name.strip(), preferred_language=body.preferred_language)
    db.add(user); db.flush()
    return establish(db, user, response)

@router.post("/login")
def login(body: Credentials, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limit("login:" + (request.client.host if request.client else "unknown"))
    user = db.scalar(select(User).where(User.email == str(body.email).lower()))
    try:
        valid = bool(user and ph.verify(user.password_hash, body.password))
    except VerifyMismatchError:
        valid = False
    if not valid: fail(401, "Identifiants invalides")
    return establish(db, user, response)

@router.post("/logout")
def logout(request: Request, response: Response, user: User = Depends(user_from_request), db: Session = Depends(get_db)):
    raw = request.cookies.get("sl3ti_session")
    db.delete(db.get(LoginSession, hashlib.sha256(raw.encode()).hexdigest()))
    db.commit()
    response.delete_cookie("sl3ti_session", path="/")
    response.delete_cookie("sl3ti_csrf", path="/")
    return {"ok": True}

@router.get("/me")
def me(user: User = Depends(user_from_request)):
    return serialize(user, USER_FIELDS)

class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    preferred_language: str | None = None
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=10, max_length=200)

@router.patch("/me")
def update_profile(body: ProfileUpdate, user: User = Depends(user_from_request), db: Session = Depends(get_db)):
    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.preferred_language is not None:
        if body.preferred_language not in ("fr", "ar", "en"): fail(422, "Langue invalide")
        user.preferred_language = body.preferred_language
    if body.new_password is not None:
        if not body.current_password: fail(400, "Mot de passe actuel requis")
        try:
            ph.verify(user.password_hash, body.current_password)
        except VerifyMismatchError:
            fail(403, "Mot de passe actuel incorrect")
        user.password_hash = ph.hash(body.new_password)
    db.commit()
    return serialize(user, USER_FIELDS)

