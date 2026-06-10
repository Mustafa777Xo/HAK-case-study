# HAK Engineering — Document Approval System

A full-stack prototype for an internal document request and sequential approval workflow system, built as part of the HAK Engineering case study.

---

## System Overview

Employees can create a document request, attach a PDF, assign one or more approvers in a specific order, and track the request until it is fully approved or rejected. Approval is strictly sequential — only the current pending approver can act, and a single rejection ends the entire workflow.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React)                    │
│  Vite · Headless UI v2 · Tailwind CSS · Zustand · Axios │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP  /api/* proxied by Vite dev server
┌────────────────────▼────────────────────────────────────┐
│                   FastAPI (Python 3.11)                 │
│  SQLAlchemy 2 · SQLite · Pydantic v2 · Uvicorn          │
└────────────────────┬────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │  SQLite DB  │   api/uploads/ (PDF files)
              └─────────────┘
```

---

## Repository Structure

```
HAK-case-study/
├── api/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py             # App entry, CORS, router registration, static mount
│   │   ├── config.py           # Pydantic Settings (reads .env)
│   │   ├── database.py         # SQLAlchemy engine + session factory
│   │   ├── seed.py             # Populates 5 mock users
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── document_request.py
│   │   │   └── approval_step.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── document_request.py
│   │   │   └── approval_step.py   # includes PendingApprovalItem
│   │   ├── routers/
│   │   │   ├── users.py
│   │   │   ├── requests.py        # CRUD, PDF upload, approver management, submit
│   │   │   ├── approvals.py       # approve, reject, pending list
│   │   │   └── dashboard.py       # summary counts
│   │   └── services/
│   │       ├── workflow.py        # sequential approval state machine
│   │       └── file_storage.py    # PDF validation + save
│   ├── uploads/                # Uploaded PDFs — gitignored, kept via .gitkeep
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── view/                       # React frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts       # Axios instance, X-User-Id header, error interceptor
│   │   │   ├── users.ts
│   │   │   ├── requests.ts
│   │   │   └── approvals.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Top nav + React Router Outlet
│   │   │   ├── UserSelectModal.tsx # Headless UI Dialog — mock auth picker
│   │   │   ├── StatusBadge.tsx     # Color-coded request status pill
│   │   │   ├── Spinner.tsx         # Animated loading spinner
│   │   │   ├── PageHeader.tsx      # Title + back-link + action slot
│   │   │   ├── FieldListbox.tsx    # Typed Headless UI Listbox wrapper
│   │   │   └── ApproveRejectDialog.tsx  # Headless UI Dialog for approval actions
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx       # 4 stat cards + quick actions
│   │   │   ├── RequestListPage.tsx     # Filterable table (7 case-study columns)
│   │   │   ├── CreateRequestPage.tsx   # 2-phase form (details+PDF → approvers+submit)
│   │   │   ├── RequestDetailPage.tsx   # Full detail + approval timeline + action buttons
│   │   │   └── ApprovalsPage.tsx       # Requests awaiting current user's action
│   │   ├── store/
│   │   │   └── useUserStore.ts     # Zustand — persisted current user
│   │   └── types/
│   │       └── index.ts            # TypeScript interfaces mirroring API shapes
│   ├── index.html
│   ├── vite.config.ts          # Proxies /api and /uploads → localhost:8000
│   ├── tailwind.config.ts
│   ├── package.json
│   └── README.md
│
└── docs/
    ├── part1-requirements-thinking.md   # Clarification questions + assumptions
    └── part3-erp-frappe-thinking.md     # ERP/Frappe mapping (DocTypes, workflows, permissions…)
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

See [`api/README.md`](api/README.md) and [`view/README.md`](view/README.md) for detailed setup guides.

### Quick Start

```bash
# Terminal 1 — API
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload
# → http://localhost:8000   (Swagger docs at /docs)

# Terminal 2 — View
cd view
npm install
npm run dev
# → http://localhost:3000
```

---

## Request Lifecycle

```
[Draft] ──► attach PDF ──► add approvers ──► [Submit]
                                                │
                                    ┌───────────▼────────────┐
                                    │    Pending Approval     │
                                    │  (Approver 1 active)   │
                                    └─────┬───────────┬───────┘
                                    approve             reject
                              ┌─────▼──────┐     ┌─────▼──────┐
                              │ Next step  │     │  Rejected  │
                              │  active…   │     │ (all skip) │
                              └─────┬──────┘     └────────────┘
                              (last approver)
                              ┌─────▼──────┐
                              │  Approved  │
                              └────────────┘
```

---

## Case Study Requirements Checklist

| # | Requirement | Where implemented |
|---|---|---|
| 1 | Create a document request | `POST /requests/` · `CreateRequestPage` |
| 2 | Attach / upload a PDF | `POST /requests/{id}/upload-pdf` · PDF picker in `CreateRequestPage` |
| 3 | Add one or more approvers | `POST /requests/{id}/approvers` · Approver panel in `CreateRequestPage` |
| 4 | Submit the request for approval | `POST /requests/{id}/submit` · Submit button in `CreateRequestPage` |
| 5a | Validate: PDF attached before submit | `services/workflow.py` · `file_storage.py` (type + size) |
| 5b | Validate: ≥1 approver before submit | `services/workflow.py` |
| 6 | Sequential approval routing | `services/workflow.py` — only seq-1 step is `Pending` after submit |
| 7 | Only the current pending approver can act | `routers/approvals.py` — `X-User-Id` guard → 403 if wrong user |
| 8 | One rejection → whole request Rejected | `workflow.reject_step()` — remaining steps set to `Skipped` |
| 9 | All approvals → request Approved | `workflow.approve_step()` — last step triggers `Approved` |
| 10 | Report list with 7 columns | `GET /requests/` returns all 7 fields · `RequestListPage` table |

---

## Design Decisions

| Decision | Rationale |
|---|---|
| FastAPI + SQLAlchemy 2 | Async-ready, excellent Pydantic v2 integration, auto-generated OpenAPI docs at `/docs` |
| SQLite for prototype | Zero-config, file-based — easy to share and reset; swap for PostgreSQL in production |
| React + Vite | Fastest dev iteration; Vite proxy eliminates CORS concerns in development |
| Headless UI v2 | Fully accessible, unstyled components — complete visual control via Tailwind without fighting overrides |
| Zustand | Minimal boilerplate for the single piece of global state (current user); persisted via `localStorage` |
| Mock auth via `X-User-Id` header | Keeps the prototype focused on workflow logic; a real auth layer would be the first production addition |
| Sequential approval enforced server-side | All workflow rules live in `services/workflow.py` — the frontend cannot bypass them |
| `Waiting` step status | Steps are created as `Waiting` (not `Pending`) so only the active step appears in the approvals queue |
| Vite `/uploads` proxy | PDFs are served by FastAPI's static mount; the Vite proxy forwards `/uploads/*` so no CORS or port-switching needed |

---

## Trade-offs & Limitations

- **No real authentication** — mock user selection is not suitable for production.
- **SQLite** is single-writer; switch to PostgreSQL for any concurrent load.
- **Local file storage** — PDFs are stored on disk; not suitable for multi-instance deployments.
- **No email/WhatsApp notifications** — approvers must check the dashboard manually.
- **No pagination** — the report endpoint returns all records; add cursor/offset pagination for production.
- **No request resubmission** — a rejected request is terminal in this prototype; a real system would allow amendment + resubmit.

---

## Development Phases

| Phase | Description | Status |
|---|---|---|
| P1-FOUNDATION | Bootstrap, DB models, React scaffold | ✅ Done |
| P2-BACKEND-CRUD | Request CRUD + PDF upload | ✅ Done |
| P3-APPROVAL-ENGINE | Sequential workflow logic | ✅ Done |
| P4-API-REPORTS | Dashboard + report endpoints | ✅ Done |
| P5-VIEW-LAYOUT | App shell + navigation | ✅ Done |
| P6-VIEW-FORMS | Create request form + approver UI | ✅ Done |
| P7-VIEW-APPROVAL | Approve/reject UI + detail view | ✅ Done |
| P8-VIEW-REPORTS | Dashboard cards + list report | ✅ Done |
| P9-PART3-ANSWERS | ERP/Frappe thinking doc | ✅ Done |
| P10-FINALIZE | README polish + final validation + commit | ✅ Done |
