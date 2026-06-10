# HAK Approval System — API

FastAPI backend for the HAK Engineering document approval prototype.

---

## Prerequisites

- Python 3.11+

---

## Setup

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env config (all defaults work out of the box)
cp .env.example .env

# 4. Seed the database with 5 mock users
python -m app.seed

# 5. Start the dev server
uvicorn app.main:app --reload
```

- API base URL: **http://localhost:8000**
- Interactive Swagger docs: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./hak_approval.db` | SQLAlchemy connection string |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded PDFs |
| `MAX_UPLOAD_MB` | `10` | Maximum PDF size in megabytes |

---

## Mock Users (seeded)

| ID | Name | Department | Role |
|---|---|---|---|
| 1 | Ahmad Al-Rashid | Finance | employee |
| 2 | Sara Al-Otaibi | Legal | manager |
| 3 | Mohammed Al-Zahrani | Operations | employee |
| 4 | Fatima Al-Ghamdi | HR | manager |
| 5 | Khalid Al-Shehri | IT | admin |

---

## API Endpoints

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/` | List all mock users |
| `GET` | `/users/{id}` | Get a single user |

### Document Requests

| Method | Path | Description |
|---|---|---|
| `POST` | `/requests/` | Create a draft request |
| `GET` | `/requests/` | List requests (filters: `status`, `department`, `priority`, `date_from`, `date_to`) |
| `GET` | `/requests/{id}` | Get request detail with approval steps |
| `PATCH` | `/requests/{id}` | Update a draft request |
| `DELETE` | `/requests/{id}` | Delete a draft request |
| `POST` | `/requests/{id}/upload-pdf` | Upload or replace the PDF attachment |
| `POST` | `/requests/{id}/approvers` | Add an approver to a draft request |
| `GET` | `/requests/{id}/approvers` | List approvers ordered by sequence |
| `DELETE` | `/requests/{id}/approvers/{step_id}` | Remove an approver from a draft request |
| `POST` | `/requests/{id}/submit` | Submit the request for approval |

### Approvals

| Method | Path | Description |
|---|---|---|
| `GET` | `/approvals/pending?approver_id=` | List active pending steps for a user |
| `POST` | `/approvals/{step_id}/approve` | Approve a step (`X-User-Id` header required) |
| `POST` | `/approvals/{step_id}/reject` | Reject a step (`X-User-Id` header required) |

### Dashboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard/summary?user_id=` | Counts: my_requests, awaiting_my_approval, approved, rejected |

---

## Approval Step Statuses

| Status | Meaning |
|---|---|
| `Waiting` | Step is in the chain but not yet activated |
| `Pending` | This approver must act now |
| `Approved` | Approver approved |
| `Rejected` | Approver rejected — request becomes Rejected |
| `Skipped` | Bypassed due to an earlier rejection |

---

## Resetting the Database

```bash
# Delete the SQLite file and re-seed
rm -f hak_approval.db
python -m app.seed
```

Uploaded PDF files in `uploads/` are not removed by this command. Clear them manually if needed:

```bash
find uploads/ -name "*.pdf" -delete
```
