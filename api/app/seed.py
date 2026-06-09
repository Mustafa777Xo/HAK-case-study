"""
Seed the database with 5 mock users.
Run: python -m app.seed
"""
from app.database import engine, SessionLocal, Base
from app.models import User, DocumentRequest, ApprovalStep  # noqa: F401 (ensure tables are registered)


MOCK_USERS = [
    {"name": "Ahmad Al-Rashid", "email": "ahmad@hak.sa", "department": "Finance", "role": "employee"},
    {"name": "Sara Al-Otaibi", "email": "sara@hak.sa", "department": "Legal", "role": "manager"},
    {"name": "Mohammed Al-Zahrani", "email": "mohammed@hak.sa", "department": "Operations", "role": "employee"},
    {"name": "Fatima Al-Ghamdi", "email": "fatima@hak.sa", "department": "HR", "role": "manager"},
    {"name": "Khalid Al-Shehri", "email": "khalid@hak.sa", "department": "IT", "role": "admin"},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).count()
        if existing > 0:
            print(f"Database already has {existing} users. Skipping seed.")
            return
        for data in MOCK_USERS:
            db.add(User(**data))
        db.commit()
        print(f"Seeded {len(MOCK_USERS)} mock users.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
