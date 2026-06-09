"""
Sequential approval workflow engine.

State transitions:
  Draft  →  [submit]  →  Pending Approval
  Pending Approval  →  [all approve]  →  Approved
  Pending Approval  →  [any reject]   →  Rejected
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.document_request import DocumentRequest, RequestStatus
from app.models.approval_step import ApprovalStep, StepStatus


class WorkflowError(Exception):
    pass


def submit_request(db: Session, request: DocumentRequest) -> DocumentRequest:
    if request.status != RequestStatus.draft:
        raise WorkflowError("Only draft requests can be submitted.")
    if not request.pdf_file_path:
        raise WorkflowError("A PDF attachment is required before submitting.")
    if not request.approval_steps:
        raise WorkflowError("At least one approver must be added before submitting.")

    request.status = RequestStatus.pending_approval
    request.submitted_at = datetime.now(timezone.utc)

    # Activate only the first step in sequence; all others stay Waiting
    first_step = min(request.approval_steps, key=lambda s: s.sequence)
    first_step.status = StepStatus.pending

    db.commit()
    db.refresh(request)
    return request


def approve_step(db: Session, step: ApprovalStep, comments: str | None = None) -> ApprovalStep:
    _assert_step_is_active(step)

    step.status = StepStatus.approved
    step.comments = comments
    step.action_date = datetime.now(timezone.utc)

    request = step.document_request
    next_step = _get_next_step(request, step.sequence)

    if next_step:
        next_step.status = StepStatus.pending  # promote from Waiting → Pending
    else:
        request.status = RequestStatus.approved

    db.commit()
    db.refresh(step)
    return step


def reject_step(db: Session, step: ApprovalStep, comments: str | None = None) -> ApprovalStep:
    _assert_step_is_active(step)

    step.status = StepStatus.rejected
    step.comments = comments
    step.action_date = datetime.now(timezone.utc)

    request = step.document_request
    request.status = RequestStatus.rejected

    # Skip all steps that haven't acted yet (Waiting or erroneously Pending)
    for remaining in request.approval_steps:
        if remaining.id != step.id and remaining.status in (StepStatus.waiting, StepStatus.pending):
            remaining.status = StepStatus.skipped

    db.commit()
    db.refresh(step)
    return step


def _assert_step_is_active(step: ApprovalStep) -> None:
    if step.status != StepStatus.pending:
        raise WorkflowError("This approval step is not currently pending.")
    if step.document_request.status != RequestStatus.pending_approval:
        raise WorkflowError("The request is not in a pending approval state.")


def _get_next_step(request: DocumentRequest, current_sequence: int) -> ApprovalStep | None:
    waiting = [
        s for s in request.approval_steps
        if s.sequence > current_sequence and s.status == StepStatus.waiting
    ]
    return min(waiting, key=lambda s: s.sequence) if waiting else None
