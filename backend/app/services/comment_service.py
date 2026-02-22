from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Comment, User
from app.schemas.schemas import CommentCreate
from app.services.issue_service import get_issue_or_404
from app.services.project_service import get_membership


def get_comments(db: Session, issue_id: int, current_user: User) -> List[Comment]:
    issue = get_issue_or_404(db, issue_id)
    membership = get_membership(db, issue.project_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this project", "details": None}})
    return db.query(Comment).filter(Comment.issue_id == issue_id).order_by(Comment.created_at.asc()).all()


def create_comment(db: Session, issue_id: int, data: CommentCreate, current_user: User) -> Comment:
    issue = get_issue_or_404(db, issue_id)
    membership = get_membership(db, issue.project_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this project", "details": None}})

    comment = Comment(issue_id=issue_id, author_id=current_user.id, body=data.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
