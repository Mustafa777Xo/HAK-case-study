from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document_request import DocumentRequest, RequestStatus
from app.models.approval_step import ApprovalStep, StepStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    my_requests: int
    awaiting_my_approval: int
    approved: int
    rejected: int


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    user_id: int = Query(..., description="Current user ID"),
    db: Session = Depends(get_db),
):
    my_requests = (
        db.query(DocumentRequest)
        .filter(DocumentRequest.created_by_id == user_id)
        .count()
    )

    # Join to DocumentRequest so we only count steps on actively submitted requests
    awaiting_my_approval = (
        db.query(ApprovalStep)
        .join(DocumentRequest)
        .filter(
            ApprovalStep.approver_id == user_id,
            ApprovalStep.status == StepStatus.pending,
            DocumentRequest.status == RequestStatus.pending_approval,
        )
        .count()
    )

    approved = (
        db.query(DocumentRequest)
        .filter(
            DocumentRequest.created_by_id == user_id,
            DocumentRequest.status == RequestStatus.approved,
        )
        .count()
    )

    rejected = (
        db.query(DocumentRequest)
        .filter(
            DocumentRequest.created_by_id == user_id,
            DocumentRequest.status == RequestStatus.rejected,
        )
        .count()
    )

    return DashboardSummary(
        my_requests=my_requests,
        awaiting_my_approval=awaiting_my_approval,
        approved=approved,
        rejected=rejected,
    )
