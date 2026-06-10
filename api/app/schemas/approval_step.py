from datetime import datetime, date
from pydantic import BaseModel
from app.models.approval_step import ApproverRole, StepStatus
from app.models.document_request import RequestStatus, Priority


class ApprovalStepCreate(BaseModel):
    approver_id: int
    role: ApproverRole = ApproverRole.approver
    sequence: int


class ApprovalStepOut(BaseModel):
    id: int
    document_request_id: int
    approver_id: int
    approver_name: str
    approver_email: str
    role: ApproverRole
    sequence: int
    status: StepStatus
    comments: str | None
    action_date: datetime | None

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    comments: str | None = None


class RequestSummary(BaseModel):
    id: int
    title: str
    requested_by: str
    department: str
    priority: Priority
    status: RequestStatus
    due_date: date | None

    model_config = {"from_attributes": True}


class PendingApprovalItem(ApprovalStepOut):
    """ApprovalStep with its parent request embedded — avoids N+1 on the frontend."""
    request: RequestSummary
