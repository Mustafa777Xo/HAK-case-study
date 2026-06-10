# HAK Approval System — View

React frontend for the HAK Engineering document approval prototype.

Built with: **Vite · React 19 · TypeScript · Headless UI v2 · Tailwind CSS v3 · Zustand · Axios · React Router v6**

---

## Prerequisites

- Node.js 18+
- npm 9+
- The API server running at **http://localhost:8000** (see `api/README.md`)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

- App URL: **http://localhost:3000**

To build for production:

```bash
npm run build   # outputs to dist/
```

---

## Vite Proxy

The Vite dev server proxies two paths to the backend so no CORS headers or hardcoded backend URLs are needed in the app:

| Prefix | Forwards to | Purpose |
|---|---|---|
| `/api` | `http://localhost:8000` | All API calls |
| `/uploads` | `http://localhost:8000` | PDF file downloads |

This is configured in `vite.config.ts`. The production build would require a reverse proxy (nginx, Caddy, etc.) with equivalent rules.

---

## Mock Authentication

There is no real login. When the app loads, a modal prompts you to pick one of the 5 seeded mock users. The selected user's ID is persisted in `localStorage` via Zustand and sent as the `X-User-Id` header on every API request. Switch users at any time using the **"Switch user"** link in the top navigation bar.

---

## Page Routing

| Route | Component | Description |
|---|---|---|
| `/` | `DashboardPage` | Stat cards (my requests, pending approvals, approved, rejected) + quick action buttons |
| `/requests` | `RequestListPage` | Filterable table of all requests with 7 case-study columns + aging in days |
| `/requests/new` | `CreateRequestPage` | 2-phase form: (1) request details + PDF upload, (2) approver assignment + submit |
| `/requests/:id` | `RequestDetailPage` | Full request detail, PDF download link, approval timeline, approve/reject dialog |
| `/approvals` | `ApprovalsPage` | Requests currently awaiting the signed-in user's action |

---

## Component Inventory

| Component | File | Description |
|---|---|---|
| `Layout` | `components/Layout.tsx` | App shell with top navigation bar and `<Outlet />` |
| `UserSelectModal` | `components/UserSelectModal.tsx` | Headless UI `Dialog` — user identity picker |
| `StatusBadge` | `components/StatusBadge.tsx` | Color-coded pill for request/step status values |
| `Spinner` | `components/Spinner.tsx` | Animated SVG loading indicator |
| `PageHeader` | `components/PageHeader.tsx` | Page title + optional back-link + right-side action slot |
| `FieldListbox` | `components/FieldListbox.tsx` | Generic Headless UI `Listbox` wrapper with typed options |
| `ApproveRejectDialog` | `components/ApproveRejectDialog.tsx` | Headless UI `Dialog` for approve / reject actions with comment field |

---

## API Module

| File | Exports | Description |
|---|---|---|
| `api/client.ts` | `apiClient` (Axios instance) | Sets `X-User-Id` header from store; normalises error messages |
| `api/users.ts` | `getUsers`, `getUser` | User list / detail |
| `api/requests.ts` | `createRequest`, `listRequests`, `getRequest`, `updateRequest`, `uploadPdf`, `addApprover`, `listApprovers`, `removeApprover`, `submitRequest` | Full request lifecycle |
| `api/approvals.ts` | `getPendingSteps`, `approveStep`, `rejectStep` | Approval actions |

---

## State Management

| Store | File | Persisted | Contents |
|---|---|---|---|
| `useUserStore` | `store/useUserStore.ts` | `localStorage` | `currentUserId`, `setCurrentUserId` |
