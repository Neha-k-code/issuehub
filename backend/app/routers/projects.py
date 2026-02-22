from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import ProjectCreate, ProjectOut, AddMemberRequest, MemberOut
from app.services.auth_service import get_current_user
from app.services import project_service

router = APIRouter()


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = project_service.create_project(db, data, current_user)
    return ProjectOut(
        id=project.id,
        name=project.name,
        key=project.key,
        description=project.description,
        created_at=project.created_at,
        member_count=len(project.members),
        current_user_role="maintainer",
    )


@router.get("/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = project_service.get_user_projects(db, current_user)
    return [
        ProjectOut(
            id=p.id,
            name=p.name,
            key=p.key,
            description=p.description,
            created_at=p.created_at,
            member_count=count,
            current_user_role=role.value,
        )
        for p, role, count in results
    ]


@router.post("/projects/{project_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    project_id: int,
    data: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = project_service.add_member(db, project_id, data, current_user)
    return MemberOut(user=membership.user, role=membership.role.value)


@router.get("/projects/{project_id}/members", response_model=List[MemberOut])
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = project_service.get_project_members(db, project_id, current_user)
    return [MemberOut(user=m.user, role=m.role.value) for m in members]
