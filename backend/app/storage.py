import os
import uuid

import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET = os.getenv("SUPABASE_BUCKET", "item-images")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


async def upload_image(org_id: str, file_bytes: bytes, content_type: str, original_filename: str) -> str:
    """Upload image to Supabase Storage, return public URL."""
    if content_type not in ALLOWED_TYPES:
        raise ValueError("Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.")
    if len(file_bytes) > MAX_SIZE:
        raise ValueError("Image trop volumineuse (max 5 Mo)")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase non configuré")

    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"

    path = f"{org_id}/{uuid.uuid4().hex}.{ext}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}",
            content=file_bytes,
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Upload échoué: {resp.text}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"


async def delete_image(image_url: str):
    """Delete image from Supabase Storage."""
    if not image_url or SUPABASE_URL not in image_url:
        return
    path = image_url.split(f"/storage/v1/object/public/{BUCKET}/")[-1]

    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}",
            headers={"Authorization": f"Bearer {SUPABASE_KEY}"},
        )
