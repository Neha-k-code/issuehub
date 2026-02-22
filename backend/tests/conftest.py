import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.models.models import User, Project, ProjectMember, RoleEnum
from app.services.auth_service import hash_password, create_access_token

# Use a file-based SQLite so all connections (fixture + TestClient) share the same DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_issuehub.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    """Recreate all tables fresh before every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def alice(db):
    user = User(
        name="Alice",
        email="alice@example.com",
        password_hash=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def bob(db):
    user = User(
        name="Bob",
        email="bob@example.com",
        password_hash=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def alice_token(alice):
    return create_access_token({"sub": str(alice.id)})


@pytest.fixture
def bob_token(bob):
    return create_access_token({"sub": str(bob.id)})


@pytest.fixture
def project(db, alice):
    p = Project(name="Test Project", key="TST", description="A test project")
    db.add(p)
    db.flush()
    db.add(ProjectMember(project_id=p.id, user_id=alice.id, role=RoleEnum.maintainer))
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def project_with_bob(db, project, bob):
    db.add(ProjectMember(project_id=project.id, user_id=bob.id, role=RoleEnum.member))
    db.commit()
    return project