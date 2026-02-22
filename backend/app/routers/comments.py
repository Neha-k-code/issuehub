from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import CommentCreate, CommentOut
from app.services.auth_service import get_current_user
from app.services import comment_service

router = APIRouter()


@router.get("/issues/{issue_id}/comments", response_model=List[CommentOut])
def list_comments(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return comment_service.get_comments(db, issue_id, current_user)


@router.post("/issues/{issue_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    issue_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return comment_service.create_comment(db, issue_id, data, current_user)
