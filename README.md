# HAK Engineering — Document Approval System ( pre design system )

A full-stack prototype for an internal document request and sequential approval workflow system, built as part of the HAK Engineering case study.

---

## System Overview

Employees can create a document request, attach a PDF, assign one or more approvers in a specific order, and track the request until it is fully approved or rejected. Approval is strictly sequential — only the current pending approver can act, and a single rejection ends the entire workflow.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React)                    │
│  Vite · Headless UI · Tailwind CSS · Zustand · Axios    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (proxied via Vite dev server)
┌────────────────────▼────────────────────────────────────┐
│                   FastAPI (Python)                      │
│  SQLAlchemy · SQLite · Pydantic v2 · Uvicorn            │
└────────────────────┬────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │  SQLite DB  │   uploads/ (PDF files)
              └─────────────┘
```

---

## Repository Structure

```
HAK-case-study/
├── api/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py       # App entry point, CORS, router registration
│   │   ├── config.py     # Settings (env vars)
│   │   ├── database.py   # SQLAlchemy engine + session
│   │   ├── seed.py       # Populates 5 mock users
│   │   ├── models/       # ORM models: User, DocumentRequest, ApprovalStep
│   │   ├── schemas/      # Pydantic request/response shapes
│   │   ├── routers/      # Route handlers: users, requests, approvals, dashboard
│   │   └── services/     # Workflow engine, file storage
│   ├── uploads/          # Uploaded PDFs (gitignored)
│   ├── requirements.txt
│   └── .env.example
│
├── view/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/          # Axios client + typed endpoint wrappers
│   │   ├── components/   # Shared components (Layout, UserSelectModal, StatusBadge)
│   │   ├── pages/        # Route-level pages (Dashboard, Requests, Approvals…)
│   │   ├── store/        # Zustand: currentUser state
│   │   └── types/        # TypeScript interfaces mirroring API shapes
│   ├── index.html
│   ├── vite.config.ts    # Dev server proxies /api → localhost:8000
│   ├── tailwind.config.ts
│   └── package.json
│
└── docs/
    ├── part1-requirements-thinking.md   # Clarification questions + assumptions
    └── part3-erp-frappe-thinking.md     # ERP/Frappe mapping (added in P9)
```

---

## Part 1 — Requirements Thinking

### Clarification Questions

1. **Who can create document requests?** Should every employee have access, or only selected departments and roles?
2. **How are approvers selected?** Are they manually added by the requester, automatically assigned based on request type/department, or should the system support both?
3. **If an approver rejects a request**, should the workflow end completely, or can the requester update the request and resubmit it?
4. **What should happen if the current approver is unavailable?** Should an admin be able to reassign the approval, or should delegation rules be supported?
5. **Should approvers only review the attached PDF** and approve/reject in the system, or is a digital signature/stamp on the PDF required?
6. **How should users be notified** when action is required? Should the system support email, in-app notifications, WhatsApp, or only show pending items inside the dashboard?
7. **Who can see requests in the system?** Should users only see their own requests and assigned approvals, or should managers/admins have wider visibility?

### Assumptions

- The prototype uses **React** for the frontend and **FastAPI** for the backend — chosen for fast development experience and strong TypeScript/Python typing.
- **Authentication is mocked** for the prototype: users pick their identity from a dropdown. In production this would be replaced with proper login, JWT sessions, and role-based permissions.
- A request starts as **Draft** and can only be submitted once it has a PDF attachment and at least one approver.
- The approval flow is **strictly sequential**. Only the current pending approver can approve or reject, determined by the approver sequence order.
- If **any approver rejects**, the whole request becomes `Rejected`. If **all approvers approve**, it becomes `Approved`.
- PDF files are **stored locally** on the server for the prototype. In production this should move to object storage (S3 or equivalent).
- External party name, email, and WhatsApp fields are stored as **request metadata only**. No email or WhatsApp integration is implemented in this version.

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1 — Backend (API)

```bash
cd api

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env config (defaults work out of the box)
cp .env.example .env

# Seed mock users into the database
python -m app.seed

# Start the development server
uvicorn app.main:app --reload
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 2 — Frontend (View)

```bash
cd view

npm install
npm run dev
```

App runs at **http://localhost:3000**
All `/api/*` requests are automatically proxied to the FastAPI server.

---

## Request Lifecycle

```
[Draft] ──► attach PDF ──► add approvers ──► [Submit]
                                                │
                                    ┌───────────▼────────────┐
                                    │    Pending Approval     │
                                    │  (Approver 1 active)   │
                                    └───────────┬────────────┘
                              approve           │        reject
                    ┌──────────────────┐        │   ┌──────────────────┐
                    │ Approver 2 active│        │   │    Rejected      │
                    │      ...        │        │   └──────────────────┘
                    └────────┬─────────┘        │
                         (last approver)        │
                    ┌────────▼─────────┐
                    │    Approved      │
                    └──────────────────┘
```

---

## Design Decisions

| Decision | Rationale |
|---|---|
| FastAPI + SQLAlchemy 2 | Async-ready, excellent Pydantic integration, auto-generated OpenAPI docs |
| SQLite for prototype | Zero-config, file-based — easy to share and reset; swap for PostgreSQL in production |
| React + Vite | Fastest dev iteration; Vite proxy removes CORS concerns during development |
| Headless UI v2 | Fully accessible, unstyled components — full visual control via Tailwind without fighting overrides |
| Zustand | Minimal boilerplate for the single piece of global state (current user) |
| Mock auth | Keeps the prototype focused on the workflow logic; a real auth layer would be the first production addition |
| Sequential approval enforced server-side | Workflow rules live in `services/workflow.py` — the frontend cannot bypass them |

---

## Trade-offs & Limitations

- **No real authentication** — mock user selection is not suitable for production.
- **SQLite** is single-writer; switch to PostgreSQL for any concurrent load.
- **Local file storage** — PDFs are stored on disk; not suitable for multi-instance deployments.
- **No email/WhatsApp notifications** — approvers must check the dashboard manually.
- **No pagination on large lists** — report endpoint returns all records; add cursor/offset pagination for production.

---

## Development Phases

See [`DEVPLAN.md`](../DEVPLAN.md) for the full phased plan with phase codes (P1–P10).

| Phase | Description | Status |
|---|---|---|
| P1-FOUNDATION | Bootstrap, DB models, React scaffold | ✅ Done |
| P2-BACKEND-CRUD | Request CRUD + PDF upload | ⏳ Next |
| P3-APPROVAL-ENGINE | Sequential workflow logic | — |
| P4-API-REPORTS | Dashboard + report endpoints | — |
| P5-VIEW-LAYOUT | App shell + navigation | — |
| P6-VIEW-FORMS | Create request form + approver UI | — |
| P7-VIEW-APPROVAL | Approve/reject UI | — |
| P8-VIEW-REPORTS | Dashboard cards + list report | — |
| P9-PART3-ANSWERS | ERP/Frappe doc | — |
| P10-FINALIZE | README polish + setup validation | — |
