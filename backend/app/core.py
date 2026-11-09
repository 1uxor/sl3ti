import hashlib, os, re, secrets, time
from datetime import timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from .db import get_db
from .models import Session as LoginSession, User, OrganizationMember, now

ph = PasswordHasher()
ROLES = {
    "owner": {"read", "write", "stock", "team", "settings"},
    "admin": {"read", "write", "stock", "team", "settings"},
    "manager": {"read", "write", "stock"},
    "staff": {"read", "stock"},
    "viewer": {"read"},
}
TEMPLATES = {
    "commerce": ["commerce"],
    "equipment": ["equipment"],
    "rental": ["equipment", "rental"],
    "custom": ["commerce"],
}
ATTEMPTS: dict[str, list[float]] = {}

def fail(status: int, message: str):
    raise HTTPException(status_code=status, detail=message)

def serialize(obj, fields):
    return {field: getattr(obj, field) for field in fields}

def audit(db, org_id, user_id, action, entity_type, entity_id, details=None):
    from .models import AuditLog
    db.add(AuditLog(organization_id=org_id, actor_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, details=details or {}))

def user_from_request(request: Request, db: Session = Depends(get_db)):
    raw = request.cookies.get("sl3ti_session")
    if not raw: fail(401, "Connexion requise")
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    session = db.get(LoginSession, token_hash)
    if not session: fail(401, "Session invalide")
    expires = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if expires <= now(): fail(401, "Session expirée")
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        if request.headers.get("X-CSRF-Token") != session.csrf_token:
            fail(403, "Jeton CSRF invalide")
    user = db.get(User, session.user_id)
    if not user: fail(401, "Compte introuvable")
    return user

def tenant(request: Request, db: Session = Depends(get_db), user: User = Depends(user_from_request)):
    org_id = request.headers.get("X-Organization-ID")
    if not org_id: fail(400, "Sélectionnez une organisation")
    membership = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == user.id))
    if not membership: fail(404, "Organisation introuvable")
    return membership

def require(member: OrganizationMember, permission: str):
    if permission not in ROLES.get(member.role, set()): fail(403, "Permission insuffisante")

def rate_limit(key: str):
    stamp = time.monotonic()
    history = [x for x in ATTEMPTS.get(key, []) if stamp - x < 60]
    if len(history) >= 10: fail(429, "Trop de tentatives. Réessayez dans une minute.")
    history.append(stamp)
    ATTEMPTS[key] = history

def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "organisation"

