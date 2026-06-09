from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.models import User, DocumentRequest, ApprovalStep  # noqa: F401 (register tables)
from app.routers import users, requests, approvals, dashboard
from app.config import settings

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="HAK Document Approval System",
    description="Sequential document approval workflow API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded PDFs as static files
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(users.router)
app.include_router(requests.router)
app.include_router(approvals.router)
app.include_router(dashboard.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "HAK Approval API"}
