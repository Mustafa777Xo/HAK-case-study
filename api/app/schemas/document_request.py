from datetime import datetime, date
from pydantic import BaseModel, field_validator
from app.models.document_request import RequestType, Priority, RequestStatus
from app.schemas.approval_step import ApprovalStepOut
import datetime as dt


class DocumentRequestCreate(BaseModel):
    title: str
    request_type: RequestType = RequestType.internal_approval
    requested_by: str
    department: str
    priority: Priority = Priority.medium
    due_date: date | None = None
    external_party_name: str | None = None
    external_party_email: str | None = None
    external_party_whatsapp: str | None = None
    remarks: str | None = None
    created_by_id: int

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title cannot exceed 200 characters")
        return v

    @field_validator("due_date")
    @classmethod
    def due_date_must_be_future(cls, v: date | None) -> date | None:
        if v is not None and v <= dt.date.today():
            raise ValueError("Due date must be a future date")
        return v


class DocumentRequestUpdate(BaseModel):
    title: str | None = None
    request_type: RequestType | None = None
    requested_by: str | None = None
    department: str | None = None
    priority: Priority | None = None
    due_date: date | None = None
    external_party_name: str | None = None
    external_party_email: str | None = None
    external_party_whatsapp: str | None = None
    remarks: str | None = None


class DocumentRequestOut(BaseModel):
    id: int
    title: str
    request_type: RequestType
    requested_by: str
    department: str
    priority: Priority
    due_date: date | None
    external_party_name: str | None
    external_party_email: str | None
    external_party_whatsapp: str | None
    pdf_file_path: str | None
    pdf_original_name: str | None
    status: RequestStatus
    remarks: str | None
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    approval_steps: list[ApprovalStepOut] = []

    model_config = {"from_attributes": True}


class DocumentRequestListItem(BaseModel):
    id: int
    title: str
    requested_by: str
    department: str
    status: RequestStatus
    priority: Priority
    due_date: date | None
    created_at: datetime
    aging_days: int
    current_pending_approver: str | None

    model_config = {"from_attributes": True}
