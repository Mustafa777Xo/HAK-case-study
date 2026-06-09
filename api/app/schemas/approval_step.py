from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.approval_step import ApproverRole, StepStatus


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
