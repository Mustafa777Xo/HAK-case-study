from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class ApproverRole(str, enum.Enum):
    reviewer = "Reviewer"
    approver = "Approver"
    signatory = "Signatory"


class StepStatus(str, enum.Enum):
    waiting = "Waiting"   # added to chain, not yet the active step
    pending = "Pending"   # currently active — this approver must act
    approved = "Approved"
    rejected = "Rejected"
    skipped = "Skipped"   # bypassed due to an earlier rejection


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_request_id: Mapped[int] = mapped_column(
        ForeignKey("document_requests.id"), nullable=False
    )
    approver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    approver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    approver_email: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[ApproverRole] = mapped_column(SAEnum(ApproverRole), default=ApproverRole.approver)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[StepStatus] = mapped_column(SAEnum(StepStatus), default=StepStatus.pending)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    document_request = relationship("DocumentRequest", back_populates="approval_steps")
    approver = relationship("User", back_populates="approval_steps")
