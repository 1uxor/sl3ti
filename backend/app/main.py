import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select

from .api_auth import router as auth_router
from .api_core import router as core_router
from .api_inventory import router as inventory_router
from .api_modules import router as modules_router
from .db import SessionLocal
from .models import Session as LoginSession, now

logger = logging.getLogger("sl3ti")

app = FastAPI(
    title="Sl3ti API",
    version="0.2.0",
    description="Multi-tenant inventory, equipment & rental management API",
)

# CORS – allow the frontend origin in development
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(core_router)
app.include_router(inventory_router)
app.include_router(modules_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.middleware("http")
async def body_limit(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > 2_000_000:
        return JSONResponse({"detail": "Requête trop volumineuse"}, status_code=413)
    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse({"detail": "Erreur interne du serveur"}, status_code=500)


@app.on_event("startup")
def cleanup_expired_sessions():
    """Remove expired sessions on each server start."""
    with SessionLocal() as db:
        stmt = delete(LoginSession).where(LoginSession.expires_at < now())
        result = db.execute(stmt)
        db.commit()
        if result.rowcount:
            logger.info("Cleaned up %d expired sessions", result.rowcount)

