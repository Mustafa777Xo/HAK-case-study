from datetime import datetime, timezone, date
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class RequestType(str, enum.Enum):
    internal_approval = "Internal Approval"
    client_submission = "Client Submission"
    contract_review = "Contract Review"
    signature_request = "Signature Request"


class Priority(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class RequestStatus(str, enum.Enum):
    draft = "Draft"
    pending_approval = "Pending Approval"
    approved = "Approved"
    rejected = "Rejected"


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    request_type: Mapped[RequestType] = mapped_column(
        SAEnum(RequestType), default=RequestType.internal_approval
    )
    requested_by: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority), default=Priority.medium)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    external_party_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    external_party_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    external_party_whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)

    pdf_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pdf_original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus), default=RequestStatus.draft
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    requester = relationship("User", back_populates="requests_created", foreign_keys=[created_by_id])
    approval_steps = relationship(
        "ApprovalStep", back_populates="document_request", order_by="ApprovalStep.sequence"
    )
