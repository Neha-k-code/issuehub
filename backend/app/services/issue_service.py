from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import case
from fastapi import HTTPException
from app.models.models import Issue, ProjectMember, User, RoleEnum, StatusEnum, PriorityEnum
from app.schemas.schemas import IssueCreate, IssueUpdate
from app.services.project_service import get_project_or_404, get_membership
from datetime import datetime, timezone


PRIORITY_ORDER = case(
    (Issue.priority == PriorityEnum.critical, 1),
    (Issue.priority == PriorityEnum.high, 2),
    (Issue.priority == PriorityEnum.medium, 3),
    (Issue.priority == PriorityEnum.low, 4),
    else_=5,
)

STATUS_ORDER = case(
    (Issue.status == StatusEnum.open, 1),
    (Issue.status == StatusEnum.in_progress, 2),
    (Issue.status == StatusEnum.resolved, 3),
    (Issue.status == StatusEnum.closed, 4),
    else_=5,
)


def _ensure_project_member(db: Session, project_id: int, user_id: int) -> ProjectMember:
    membership = get_membership(db, project_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this project", "details": None}})
    return membership


def create_issue(db: Session, project_id: int, data: IssueCreate, current_user: User) -> Issue:
    get_project_or_404(db, project_id)
    _ensure_project_member(db, project_id, current_user.id)

    issue = Issue(
        project_id=project_id,
        title=data.title,
        description=data.description,
        priority=PriorityEnum(data.priority),
        reporter_id=current_user.id,
        assignee_id=data.assignee_id,
        status=StatusEnum.open,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


def list_issues(
    db: Session,
    project_id: int,
    current_user: User,
    q: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[int] = None,
    sort: Optional[str] = "created_at_desc",
    page: int = 1,
    limit: int = 10,
) -> Tuple[List[Issue], int]:
    get_project_or_404(db, project_id)
    _ensure_project_member(db, project_id, current_user.id)

    query = db.query(Issue).filter(Issue.project_id == project_id)

    if q:
        query = query.filter(Issue.title.ilike(f"%{q}%"))
    if status:
        query = query.filter(Issue.status == StatusEnum(status))
    if priority:
        query = query.filter(Issue.priority == PriorityEnum(priority))
    if assignee_id:
        query = query.filter(Issue.assignee_id == assignee_id)

    sort_map = {
        "created_at_desc": Issue.created_at.desc(),
        "created_at_asc": Issue.created_at.asc(),
        "priority": PRIORITY_ORDER,
        "status": STATUS_ORDER,
    }
    order = sort_map.get(sort, Issue.created_at.desc())
    query = query.order_by(order)

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_issue_or_404(db: Session, issue_id: int) -> Issue:
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Issue not found", "details": None}})
    return issue


def get_issue(db: Session, issue_id: int, current_user: User) -> Issue:
    issue = get_issue_or_404(db, issue_id)
    _ensure_project_member(db, issue.project_id, current_user.id)
    return issue


def update_issue(db: Session, issue_id: int, data: IssueUpdate, current_user: User) -> Issue:
    issue = get_issue_or_404(db, issue_id)
    membership = _ensure_project_member(db, issue.project_id, current_user.id)

    is_reporter = issue.reporter_id == current_user.id
    is_maintainer = membership.role == RoleEnum.maintainer

    if not is_reporter and not is_maintainer:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "You cannot edit this issue", "details": None}})

    # Maintainer-only fields — use model_fields_set to distinguish "not sent" from explicit None
    fields_set = data.model_fields_set
    status_changing = "status" in fields_set and data.status is not None
    assignee_changing = "assignee_id" in fields_set
    if (status_changing or assignee_changing) and not is_maintainer:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Only maintainers can change status or assignee", "details": None}})
    if "title" in fields_set and data.title is not None:
        issue.title = data.title
    if "description" in fields_set:
        issue.description = data.description
    if "priority" in fields_set and data.priority is not None:
        issue.priority = PriorityEnum(data.priority)
    if "status" in fields_set and data.status is not None:
        issue.status = StatusEnum(data.status)
    if "assignee_id" in fields_set:
        issue.assignee_id = data.assignee_id  # allows explicit None to unassign

    issue.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(issue)
    return issue


def delete_issue(db: Session, issue_id: int, current_user: User) -> None:
    issue = get_issue_or_404(db, issue_id)
    membership = _ensure_project_member(db, issue.project_id, current_user.id)

    if membership.role != RoleEnum.maintainer:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Only maintainers can delete issues", "details": None}})

    db.delete(issue)
    db.commit()