import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import IssueCreate, IssueUpdate, IssueOut, IssueListOut
from app.services.auth_service import get_current_user
from app.services import issue_service

router = APIRouter()


@router.get("/projects/{project_id}/issues", response_model=IssueListOut)
def list_issues(
    project_id: int,
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    sort: Optional[str] = Query("created_at_desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = issue_service.list_issues(
        db, project_id, current_user, q=q, status=status,
        priority=priority, assignee_id=assignee_id, sort=sort, page=page, limit=limit
    )
    return IssueListOut(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.post("/projects/{project_id}/issues", response_model=IssueOut, status_code=201)
def create_issue(
    project_id: int,
    data: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.create_issue(db, project_id, data, current_user)


@router.get("/issues/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.get_issue(db, issue_id, current_user)


@router.patch("/issues/{issue_id}", response_model=IssueOut)
def update_issue(
    issue_id: int,
    data: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.update_issue(db, issue_id, data, current_user)


@router.delete("/issues/{issue_id}", status_code=204)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue_service.delete_issue(db, issue_id, current_user)
