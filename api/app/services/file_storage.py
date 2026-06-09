import os
import uuid
from fastapi import UploadFile, HTTPException

from app.config import settings

ALLOWED_CONTENT_TYPES = {"application/pdf"}


async def save_pdf(file: UploadFile) -> tuple[str, str]:
    """
    Validates and saves an uploaded PDF file.
    Returns (relative_file_path, original_filename).
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds the {settings.max_upload_mb} MB limit.",
        )

    os.makedirs(settings.upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(settings.upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path, file.filename or filename


def delete_pdf(file_path: str) -> None:
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
