from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document_request import DocumentRequest, RequestStatus
from app.models.approval_step import ApprovalStep, StepStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    user_id: int = Query(..., description="Current user ID"),
    db: Session = Depends(get_db),
):
    my_requests = (
        db.query(DocumentRequest).filter(DocumentRequest.created_by_id == user_id).count()
    )
    awaiting_approval = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.approver_id == user_id, ApprovalStep.status == StepStatus.pending)
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
    return {
        "my_requests": my_requests,
        "awaiting_my_approval": awaiting_approval,
        "approved": approved,
        "rejected": rejected,
    }
