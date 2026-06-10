import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("UPLOAD_DIR", "/tmp/hak-api-test-uploads")

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User


TEST_USERS = [
    {"id": 1, "name": "Requester", "email": "requester@hak.test", "department": "Finance", "role": "employee"},
    {"id": 2, "name": "Reviewer", "email": "reviewer@hak.test", "department": "Legal", "role": "manager"},
    {"id": 3, "name": "Approver", "email": "approver@hak.test", "department": "Operations", "role": "manager"},
    {"id": 4, "name": "Signatory", "email": "signatory@hak.test", "department": "IT", "role": "admin"},
]


@pytest.fixture()
def client(tmp_path, monkeypatch) -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        db.add_all(User(**user) for user in TEST_USERS)
        db.commit()
    finally:
        db.close()

    upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(settings, "upload_dir", str(upload_dir))
    monkeypatch.setattr(settings, "max_upload_mb", 10)

    def override_get_db() -> Generator[Session, None, None]:
        test_db = TestingSessionLocal()
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def pdf_file() -> dict[str, tuple[str, bytes, str]]:
    return {"file": ("request.pdf", b"%PDF-1.4\n%%EOF\n", "application/pdf")}
