# Part 3 — ERP / Frappe Thinking

---

## 1. How would you map this into an ERP system?

### Core DocType Design

An ERP implementation would model the system around two primary entities and a set of supporting master data:

#### `Document Request` (main DocType)
Stores everything about a single approval request. Maps directly to the prototype's `DocumentRequest` model.

| Field | Type | Notes |
|---|---|---|
| `title` | Data | Required |
| `request_type` | Select | Internal Approval / Client Submission / Contract Review / Signature Request |
| `requested_by` | Link → Employee | Linked to HR master |
| `department` | Link → Department | ERP master data |
| `priority` | Select | Low / Medium / High |
| `due_date` | Date | Future date enforced server-side |
| `external_party_name` | Data | |
| `external_party_email` | Data | |
| `external_party_whatsapp` | Data | |
| `pdf_attachment` | Attach | Stored in file manager (not local disk) |
| `status` | Select | Draft / Pending Approval / Approved / Rejected |
| `remarks` | Text | |
| `approvers` | Table → Approval Step | Child table |

#### `Approval Step` (child DocType, `istable = 1`)
Represents a single approver's step in the chain. Embedded as a child table inside `Document Request`.

| Field | Type | Notes |
|---|---|---|
| `approver` | Link → User | |
| `approver_name` | Data | Fetched automatically |
| `role` | Select | Reviewer / Approver / Signatory |
| `sequence` | Int | Determines order |
| `status` | Select | Waiting / Pending / Approved / Rejected / Skipped |
| `comments` | Small Text | |
| `action_date` | Datetime | Set on action |

### Supporting Master Data
- **Department** — existing ERP master (HR module)
- **Employee** — requesters linked to employee records
- **User** — approvers are system users with relevant roles
- **Approval Template** *(optional)* — pre-defined approver chains per request type or department (admin-configurable)

### Workflow Integration
Rather than coding the state machine from scratch, the ERP workflow engine handles transitions:
```
Draft → [Submit] → Pending Approval
Pending Approval → [All approve] → Approved
Pending Approval → [Any reject]  → Rejected
```
Each workflow state maps to a document status. Workflow actions are gated by role and the approver sequence logic is enforced via server scripts.

---

## 2. Which parts should be configurable by admin users?

### `Document Request Settings` (single DocType for configuration)

| Setting | Why it's configurable |
|---|---|
| **Request Types** | Business may add new types (e.g. "Board Resolution") without code changes |
| **Default approval sequence per request type** | Template chains — Finance requests always go to Finance Manager → CFO |
| **Default approval sequence per department** | HR requests auto-route to HR Head |
| **Maximum PDF size (MB)** | Storage policy differs per organisation |
| **Due date warning threshold (days)** | How far in advance to flag overdue items |
| **Allowed file types** | Some orgs may also allow Word / Excel |
| **Email notification toggles** | Enable/disable email alerts per event (submitted, approved, rejected) |
| **WhatsApp notification toggle** | Future integration on/off |
| **Auto-rejection on missed deadline** | Configurable timer action |

### Role & Permission management
Admins assign roles to users through the ERP's built-in user management — no code change needed when a new approver joins or leaves.

### Approval Templates *(optional master)*
A `Approval Template` DocType would let admins define reusable chains:
- "Finance Contract Chain" → Finance Manager (Reviewer) → CFO (Approver) → CEO (Signatory)
- Applied automatically when a request is created with matching type/department

---

## 3. What permissions would you apply?

### Roles

| Role | Description |
|---|---|
| `Document Requester` | Any employee who can create and submit requests |
| `Document Reviewer` | Can approve/reject requests assigned to them as Reviewer |
| `Document Approver` | Can approve/reject requests assigned to them as Approver |
| `Document Signatory` | Can approve/reject requests assigned to them as Signatory |
| `Document Manager` | Can view all requests, reassign approvers, cancel requests |
| `System Manager` | Full access including settings, templates, audit log |

### DocType Permissions Matrix

| Action | Requester | Reviewer/Approver/Signatory | Manager | System Manager |
|---|---|---|---|---|
| Create (Draft) | ✅ own | ❌ | ✅ all | ✅ all |
| Read | ✅ own | ✅ assigned | ✅ all | ✅ all |
| Write (Draft fields) | ✅ own draft | ❌ | ✅ draft | ✅ all |
| Submit | ✅ own draft | ❌ | ✅ | ✅ |
| Approve / Reject | ❌ | ✅ active step only | ❌ | ✅ |
| Reassign Approver | ❌ | ❌ | ✅ | ✅ |
| Cancel | ❌ | ❌ | ✅ pending | ✅ all |
| Delete | ❌ | ❌ | ✅ draft | ✅ all |
| View Settings | ❌ | ❌ | read only | ✅ |

### Field-Level Security
- `status` — read-only for all users; changed only through workflow transitions
- `pdf_attachment` — write only in Draft; read-only after submission
- `approvers` child table — write only in Draft; read-only after submission
- `action_date` and `comments` on each step — writable only by that step's approver, only when that step is active

---

## 4. What validations should happen server-side?

Server-side validation is critical — client-side checks can be bypassed.

### On `before_save` / `validate`
- `title` must not be empty and must be ≤ 200 characters
- `due_date` must be today or a future date
- `department` must exist in the Department master
- `requested_by` must be a valid Employee linked to an active User
- `external_party_email` must match a valid email format if provided
- `external_party_whatsapp` must match a phone number pattern if provided
- No duplicate approvers in the same sequence position

### On `before_submit`
- `pdf_attachment` must be present (a PDF file)
- The `approvers` child table must have at least one row
- All approver rows must reference valid, active User records
- Sequence numbers must be unique and start from 1
- `due_date` must still be in the future

### On Approval Action (custom API / server script)
- The caller (current user) must match the `approver` on the active step
- The step's `status` must be `Pending` (not already acted upon)
- The parent request's `status` must be `Pending Approval`
- For rejection: `comments` must not be empty
- No action allowed on a request that is already `Approved` or `Rejected`

### On `before_cancel`
- Only `Document Manager` or `System Manager` may cancel
- Cannot cancel an `Approved` request (requires an amendment workflow)

---

## 5. What audit trail would you keep?

### Built-in ERP Audit (automatic)
- **Version History** — every field change is tracked with old/new value, user, and timestamp (Frappe's `track_changes = 1`)
- **Comment & Timeline** — every workflow transition, submission, cancellation appears on the document timeline
- **Document Revision Log** — who amended an approved document and why

### Custom Audit Entries

#### `Approval Action Log` (separate child or standalone DocType)
Captures every approval event in immutable form:

| Field | Value |
|---|---|
| `document_request` | Link → Document Request |
| `step_sequence` | Int |
| `approver` | Link → User |
| `action` | Approved / Rejected / Reassigned / Escalated |
| `comments` | Text |
| `timestamp` | Datetime (server-set, not user-editable) |
| `ip_address` | Data (from request context) |
| `user_agent` | Data |

#### Events that must be logged
| Event | Who triggered it | Timestamp |
|---|---|---|
| Request created (Draft) | Requester | `creation` |
| PDF uploaded / replaced | Requester | custom log |
| Approver added / removed | Requester | custom log |
| Request submitted | Requester | `modified` + workflow |
| Step approved | Approver | custom log |
| Step rejected | Approver | custom log |
| Approver reassigned | Manager | custom log |
| Request cancelled | Manager | `modified` + workflow |
| Settings changed | Admin | System Manager log |

### Reporting on the Audit Trail
A `Approval Audit Report` (Script Report) should allow filtering by:
- Date range
- User (requester or approver)
- Request type / department
- Action type

---

## 6. If this was implemented in Frappe / ERPNext, what concepts would you use?

### DocTypes
- `Document Request` — main document, submittable (`is_submittable = 1`)
- `Approval Step` — child DocType (`istable = 1`) embedded in Document Request
- `Approval Action Log` — standalone log DocType (`track_changes = 0`, no edit after insert)
- `Document Request Settings` — Single DocType for global configuration
- `Approval Template` — master DocType for reusable approver chains

### Child Tables
The `Approval Step` child table lives inside `Document Request`. Frappe renders it as an editable grid in the form. Columns (approver, role, sequence, status, comments, action_date) are all managed as a single unit with the parent document — saved and submitted atomically.

### Workflows
Frappe's built-in `Workflow` DocType handles:
- State definitions (Draft, Pending Approval, Approved, Rejected)
- Transition rules (who can trigger which transition)
- Automatic email notifications on state change
- Disabling edit of fields based on current state

The sequential approver-by-approver routing (only the current active step's approver can act) is **not** handled by Frappe's standard workflow alone — it requires a custom `Server Script` or `hook` to enforce the sequence and update which step is active.

### Roles & Permissions
- Roles defined in `Role` DocType: `Document Requester`, `Document Approver`, `Document Manager`
- Permissions configured in `DocPerm` — per-role read/write/submit/cancel/delete flags
- `User Permission` entries restrict which documents a user can see (e.g. only their own department's requests)
- `Role Profile` groups multiple roles for easy assignment

### Server Scripts / Python Hooks
```python
# hooks.py
doc_events = {
    "Document Request": {
        "before_submit": "approval_app.utils.validate_before_submit",
        "on_submit": "approval_app.utils.activate_first_approver",
        "on_update_after_submit": "approval_app.utils.handle_approval_action",
    }
}
```

Key server-side logic:
- `validate_before_submit` — enforce PDF attached, ≥1 approver
- `activate_first_approver` — set step 1 status to Pending, send notification
- `handle_approval_action` — validate caller is active approver, advance chain or close request
- `on_cancel` — mark all pending steps as Skipped

### Client Scripts
```javascript
// Auto-fill requested_by with current user on form load
frappe.ui.form.on("Document Request", {
    onload: function(frm) {
        if (frm.is_new()) {
            frm.set_value("requested_by", frappe.session.user);
        }
    },
    // Hide approvers table for non-draft documents
    status: function(frm) {
        frm.fields_dict.approvers.grid.toggle_enable(
            frm.doc.status === "Draft"
        );
    },
    // Show approve/reject buttons only for the active approver
    refresh: function(frm) {
        const active_step = frm.doc.approvers.find(
            s => s.status === "Pending" && s.approver === frappe.session.user
        );
        if (active_step && frm.doc.status === "Pending Approval") {
            frm.add_custom_button("Approve", () => approve(frm, active_step), "Actions");
            frm.add_custom_button("Reject",  () => reject(frm, active_step),  "Actions");
        }
    }
});
```

### Reports
| Report | Type | Description |
|---|---|---|
| `Request Status Report` | Query Report | All requests with title, requester, department, status, current approver, due date, aging |
| `Approval Turnaround Report` | Script Report | Average time per step per approver — identifies bottlenecks |
| `Overdue Requests` | Query Report | Requests past due date still in pending state |
| `Approval Audit Log` | Script Report | Immutable log of every action per request |

### Scheduled Jobs (Scheduler)
```python
# hooks.py
scheduler_events = {
    "daily": [
        "approval_app.tasks.send_overdue_reminders",   # notify approvers of pending items
        "approval_app.tasks.auto_escalate_overdue",    # optional: escalate to manager after N days
    ]
}
```

### REST API (Frappe built-in)
Frappe auto-generates a REST API for every DocType:
```
GET  /api/resource/Document Request/{name}
POST /api/resource/Document Request
PUT  /api/resource/Document Request/{name}
```

Custom whitelisted methods for the approval actions:
```python
@frappe.whitelist()
def approve_step(request_name, step_idx, comments=""):
    ...

@frappe.whitelist()
def reject_step(request_name, step_idx, comments):
    ...
```

These are called from the client script buttons and from any external integration (e.g. a mobile app, WhatsApp bot, or email reply handler).

### Email & Notification Templates
- `Notification` DocType — configured to fire on document status change
- Template variables: `{{ doc.title }}`, `{{ doc.requested_by }}`, `{{ step.approver }}`
- Channels: Email, System Notification (bell icon), optionally SMS/WhatsApp via a third-party integration
