from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.document_request import DocumentRequest, RequestStatus
from app.models.approval_step import ApprovalStep, StepStatus
from app.models.user import User
from app.schemas.document_request import (
    DocumentRequestCreate,
    DocumentRequestUpdate,
    DocumentRequestOut,
    DocumentRequestListItem,
)
from app.schemas.approval_step import ApprovalStepCreate, ApprovalStepOut
from app.services.file_storage import save_pdf, delete_pdf
from app.services.workflow import submit_request, WorkflowError

router = APIRouter(prefix="/requests", tags=["requests"])


def _get_request_or_404(db: Session, request_id: int) -> DocumentRequest:
    req = (
        db.query(DocumentRequest)
        .options(joinedload(DocumentRequest.approval_steps))
        .filter(DocumentRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Document request not found")
    return req


def _aging_days(created_at: datetime) -> int:
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (now - created_at).days


def _current_pending_approver(req: DocumentRequest) -> str | None:
    if req.status != RequestStatus.pending_approval:
        return None
    pending = [s for s in req.approval_steps if s.status == StepStatus.pending]
    if not pending:
        return None
    step = min(pending, key=lambda s: s.sequence)
    return step.approver_name


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DocumentRequestOut, status_code=201)
def create_request(body: DocumentRequestCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == body.created_by_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Requesting user not found")
    req = DocumentRequest(**body.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/", response_model=list[DocumentRequestListItem])
def list_requests(
    status: RequestStatus | None = Query(None),
    department: str | None = Query(None),
    priority: str | None = Query(None),
    date_from: date | None = Query(None, description="Filter requests created on or after this date (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="Filter requests created on or before this date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    query = db.query(DocumentRequest).options(joinedload(DocumentRequest.approval_steps))
    if status:
        query = query.filter(DocumentRequest.status == status)
    if department:
        query = query.filter(DocumentRequest.department == department)
    if priority:
        query = query.filter(DocumentRequest.priority == priority)
    if date_from:
        query = query.filter(DocumentRequest.created_at >= datetime(date_from.year, date_from.month, date_from.day, tzinfo=timezone.utc))
    if date_to:
        query = query.filter(DocumentRequest.created_at <= datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59, tzinfo=timezone.utc))

    requests = query.order_by(DocumentRequest.created_at.desc()).all()

    return [
        DocumentRequestListItem(
            id=r.id,
            title=r.title,
            requested_by=r.requested_by,
            department=r.department,
            status=r.status,
            priority=r.priority,
            due_date=r.due_date,
            created_at=r.created_at,
            aging_days=_aging_days(r.created_at),
            current_pending_approver=_current_pending_approver(r),
        )
        for r in requests
    ]


@router.get("/{request_id}", response_model=DocumentRequestOut)
def get_request(request_id: int, db: Session = Depends(get_db)):
    return _get_request_or_404(db, request_id)


@router.patch("/{request_id}", response_model=DocumentRequestOut)
def update_request(request_id: int, body: DocumentRequestUpdate, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    if req.status != RequestStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft requests can be edited.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=204)
def delete_request(request_id: int, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    if req.status != RequestStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft requests can be deleted.")
    if req.pdf_file_path:
        delete_pdf(req.pdf_file_path)
    db.delete(req)
    db.commit()


# ── PDF Upload ─────────────────────────────────────────────────────────────────

@router.post("/{request_id}/upload-pdf", response_model=DocumentRequestOut)
async def upload_pdf(
    request_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    req = _get_request_or_404(db, request_id)
    if req.status != RequestStatus.draft:
        raise HTTPException(status_code=400, detail="PDF can only be changed on draft requests.")
    if req.pdf_file_path:
        delete_pdf(req.pdf_file_path)
    path, original_name = await save_pdf(file)
    req.pdf_file_path = path
    req.pdf_original_name = original_name
    db.commit()
    db.refresh(req)
    return req


# ── Approver Management ────────────────────────────────────────────────────────

@router.post("/{request_id}/approvers", response_model=ApprovalStepOut, status_code=201)
def add_approver(request_id: int, body: ApprovalStepCreate, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    if req.status != RequestStatus.draft:
        raise HTTPException(status_code=400, detail="Approvers can only be added to draft requests.")
    approver = db.query(User).filter(User.id == body.approver_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="Approver user not found")
    step = ApprovalStep(
        document_request_id=request_id,
        approver_id=approver.id,
        approver_name=approver.name,
        approver_email=approver.email,
        role=body.role,
        sequence=body.sequence,
        status=StepStatus.waiting,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.get("/{request_id}/approvers", response_model=list[ApprovalStepOut])
def list_approvers(request_id: int, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    return sorted(req.approval_steps, key=lambda s: s.sequence)


@router.delete("/{request_id}/approvers/{step_id}", status_code=204)
def remove_approver(request_id: int, step_id: int, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    if req.status != RequestStatus.draft:
        raise HTTPException(status_code=400, detail="Approvers can only be removed from draft requests.")
    step = db.query(ApprovalStep).filter(
        ApprovalStep.id == step_id, ApprovalStep.document_request_id == request_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Approval step not found")
    db.delete(step)
    db.commit()


# ── Submit ─────────────────────────────────────────────────────────────────────

@router.post("/{request_id}/submit", response_model=DocumentRequestOut)
def submit(request_id: int, db: Session = Depends(get_db)):
    req = _get_request_or_404(db, request_id)
    try:
        return submit_request(db, req)
    except WorkflowError as e:
        raise HTTPException(status_code=400, detail=str(e))
