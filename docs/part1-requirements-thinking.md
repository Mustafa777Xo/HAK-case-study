# Part 1 — Requirements Thinking

## Clarification Questions
* Who can create document requests? Should every employee have access, or only selected departments and roles?
* How are approvers selected? Are they manually added by the requester, automatically assigned based on request type/department, or should the system support both?
* If an approver rejects a request, should the workflow end completely, or can the requester update the request and resubmit it?
* What should happen if the current approver is unavailable? Should an admin be able to reassign the approval, or should delegation rules be supported?
* Should approvers only review the attached PDF and approve/reject in the system, or is a digital signature/stamp on the PDF required?
* How should users be notified when action is required? Should the system support email, in-app notifications, WhatsApp, or only show pending items inside the dashboard?
* Who can see requests in the system? Should users only see their own requests and assigned approvals, or should managers/admins have wider visibility?

## Assumptions
* The prototype will use React for the frontend and FastAPI for the backend ( fast dev experience ).
* Authentication will be simplified for the prototype, most likely by selecting a mock user/approver. In production, this would be replaced with proper login, sessions/JWT, and role-based permissions.
* A request starts as Draft and can only be submitted when it has a PDF attachment and at least one approver.
* The approval flow is strictly sequential. Only the current pending approver can approve or reject, based on the approver sequence.
* If any approver rejects the request, the whole request becomes Rejected. If all approvers approve, the request becomes Approved.
* PDF files will be stored locally for the prototype. In production, this should move to object storage such as S3 or another managed file storage service.
* External party name, email, and WhatsApp fields will only be stored as request data in this prototype. No external email or WhatsApp integration will be implemented in the first version.