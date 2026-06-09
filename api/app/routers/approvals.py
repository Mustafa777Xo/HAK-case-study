from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.approval_step import ApprovalStep, StepStatus
from app.models.document_request import DocumentRequest, RequestStatus
from app.schemas.approval_step import ApprovalStepOut, ApprovalAction
from app.services.workflow import approve_step, reject_step, WorkflowError

router = APIRouter(prefix="/approvals", tags=["approvals"])


def _get_step_or_404(db: Session, step_id: int) -> ApprovalStep:
    step = (
        db.query(ApprovalStep)
        .options(joinedload(ApprovalStep.document_request).joinedload("approval_steps"))
        .filter(ApprovalStep.id == step_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Approval step not found")
    return step


@router.get("/pending", response_model=list[ApprovalStepOut])
def get_pending_steps(
    approver_id: int = Query(..., description="Filter pending steps by approver user ID"),
    db: Session = Depends(get_db),
):
    steps = (
        db.query(ApprovalStep)
        .join(DocumentRequest)
        .filter(
            ApprovalStep.approver_id == approver_id,
            ApprovalStep.status == StepStatus.pending,
            DocumentRequest.status == RequestStatus.pending_approval,
        )
        .all()
    )
    return steps


@router.post("/{step_id}/approve", response_model=ApprovalStepOut)
def approve(step_id: int, body: ApprovalAction, db: Session = Depends(get_db)):
    step = _get_step_or_404(db, step_id)
    try:
        return approve_step(db, step, body.comments)
    except WorkflowError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{step_id}/reject", response_model=ApprovalStepOut)
def reject(step_id: int, body: ApprovalAction, db: Session = Depends(get_db)):
    step = _get_step_or_404(db, step_id)
    try:
        return reject_step(db, step, body.comments)
    except WorkflowError as e:
        raise HTTPException(status_code=400, detail=str(e))
