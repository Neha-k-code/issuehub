from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Project, ProjectMember, User, RoleEnum
from app.schemas.schemas import ProjectCreate, AddMemberRequest


def create_project(db: Session, data: ProjectCreate, creator: User) -> Project:
    existing = db.query(Project).filter(Project.key == data.key.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail={"error": {"code": "KEY_CONFLICT", "message": f"Project key '{data.key}' already exists", "details": None}})

    project = Project(name=data.name, key=data.key.upper(), description=data.description)
    db.add(project)
    db.flush()

    membership = ProjectMember(project_id=project.id, user_id=creator.id, role=RoleEnum.maintainer)
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project


def get_user_projects(db: Session, user: User) -> List[Project]:
    memberships = db.query(ProjectMember).filter(ProjectMember.user_id == user.id).all()
    projects = []
    for m in memberships:
        p = m.project
        projects.append((p, m.role, len(p.members)))
    return projects


def get_membership(db: Session, project_id: int, user_id: int) -> Optional[ProjectMember]:
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Project not found", "details": None}})
    return project


def add_member(db: Session, project_id: int, data: AddMemberRequest, current_user: User) -> ProjectMember:
    project = get_project_or_404(db, project_id)

    # Check current user is maintainer
    membership = get_membership(db, project_id, current_user.id)
    if not membership or membership.role != RoleEnum.maintainer:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Only maintainers can add members", "details": None}})

    # Find target user by email
    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail={"error": {"code": "USER_NOT_FOUND", "message": "No user found with that email", "details": None}})

    existing = get_membership(db, project_id, target_user.id)
    if existing:
        existing.role = RoleEnum(data.role)
        db.commit()
        db.refresh(existing)
        return existing

    new_membership = ProjectMember(
        project_id=project_id,
        user_id=target_user.id,
        role=RoleEnum(data.role)
    )
    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)
    return new_membership


def get_project_members(db: Session, project_id: int, current_user: User):
    project = get_project_or_404(db, project_id)
    membership = get_membership(db, project_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this project", "details": None}})
    return project.members
