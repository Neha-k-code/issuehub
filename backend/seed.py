"""
Seed script — creates demo data.
Run from the backend/ directory: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, SessionLocal, Base
from app.models.models import User, Project, ProjectMember, Issue, Comment, RoleEnum, StatusEnum, PriorityEnum
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing data
db.query(Comment).delete()
db.query(Issue).delete()
db.query(ProjectMember).delete()
db.query(Project).delete()
db.query(User).delete()
db.commit()

# Users
alice = User(name="Alice", email="alice@example.com", password_hash=hash_password("password123"))
bob = User(name="Bob", email="bob@example.com", password_hash=hash_password("password123"))
db.add_all([alice, bob])
db.flush()

# Projects
p1 = Project(name="IssueHub", key="ISSHUB", description="Central hub for tracking issues, bugs, and feature requests across the team.")
p2 = Project(name="Marketing Site", key="MKT", description="Company website and landing pages.")
db.add_all([p1, p2])
db.flush()

# Membership
db.add_all([
    ProjectMember(project_id=p1.id, user_id=alice.id, role=RoleEnum.maintainer),
    ProjectMember(project_id=p1.id, user_id=bob.id, role=RoleEnum.member),
    ProjectMember(project_id=p2.id, user_id=alice.id, role=RoleEnum.maintainer),
    ProjectMember(project_id=p2.id, user_id=bob.id, role=RoleEnum.member),
])
db.flush()

# Issues for IssueHub
statuses = [StatusEnum.open, StatusEnum.in_progress, StatusEnum.resolved, StatusEnum.closed]
priorities = [PriorityEnum.low, PriorityEnum.medium, PriorityEnum.high, PriorityEnum.critical]

issue_data = [
    ("Login form crashes on empty submit", "Submitting the login form without filling fields crashes the page.", StatusEnum.open, PriorityEnum.critical, alice.id, bob.id),
    ("Add pagination to issues list", "Issues list loads all records — need page/limit params.", StatusEnum.in_progress, PriorityEnum.high, bob.id, alice.id),
    ("Implement comment editing", "Users should be able to edit their own comments.", StatusEnum.open, PriorityEnum.medium, alice.id, None),
    ("Toast notifications not showing on mobile", "Toast appears off-screen on small viewports.", StatusEnum.open, PriorityEnum.high, bob.id, bob.id),
    ("Add JWT refresh token flow", "Current 24h token expires without warning.", StatusEnum.open, PriorityEnum.medium, alice.id, None),
    ("Write Vitest unit tests for AuthContext", "Frontend context has zero test coverage.", StatusEnum.open, PriorityEnum.low, bob.id, None),
    ("Fix CORS for production domain", "CORS is hardcoded to localhost.", StatusEnum.resolved, PriorityEnum.high, alice.id, alice.id),
    ("Seed script fails on PostgreSQL", "Enum types conflict on re-run.", StatusEnum.closed, PriorityEnum.medium, bob.id, alice.id),
    ("Add rate limiting to /api/auth/login", "Brute-force protection missing.", StatusEnum.open, PriorityEnum.high, alice.id, None),
    ("Dark mode support", "Add CSS prefers-color-scheme media query.", StatusEnum.open, PriorityEnum.low, bob.id, None),
]

issues = []
for title, desc, status, priority, reporter_id, assignee_id in issue_data:
    issue = Issue(
        project_id=p1.id,
        title=title,
        description=desc,
        status=status,
        priority=priority,
        reporter_id=reporter_id,
        assignee_id=assignee_id,
    )
    db.add(issue)
    issues.append(issue)
db.flush()

# Issues for Marketing Site
mkt_issues = [
    ("Homepage hero copy needs update", "Change headline for Q2 campaign.", StatusEnum.open, PriorityEnum.medium, alice.id, bob.id),
    ("Broken link in footer", "/careers 404s on prod.", StatusEnum.resolved, PriorityEnum.high, bob.id, alice.id),
    ("SEO meta tags missing on blog posts", "All blog post pages lack og: and twitter: meta.", StatusEnum.open, PriorityEnum.medium, alice.id, None),
    ("Mobile nav menu doesn't close on link click", "Hamburger menu stays open after navigation.", StatusEnum.open, PriorityEnum.high, bob.id, bob.id),
    ("Add cookie consent banner", "GDPR compliance requires explicit cookie consent.", StatusEnum.open, PriorityEnum.critical, alice.id, alice.id),
]
for title, desc, status, priority, reporter_id, assignee_id in mkt_issues:
    db.add(Issue(
        project_id=p2.id,
        title=title,
        description=desc,
        status=status,
        priority=priority,
        reporter_id=reporter_id,
        assignee_id=assignee_id,
    ))
db.flush()

# Comments on first few IssueHub issues
db.add_all([
    Comment(issue_id=issues[0].id, author_id=alice.id, body="Reproduced on Chrome 122. Looks like the form submit handler throws when fields are null."),
    Comment(issue_id=issues[0].id, author_id=bob.id, body="I can take this. Will add null checks and proper validation messages."),
    Comment(issue_id=issues[1].id, author_id=alice.id, body="Backend PATCH already supports page/limit. Just need to wire up the frontend controls."),
    Comment(issue_id=issues[1].id, author_id=bob.id, body="PR #12 addresses this — review pending."),
    Comment(issue_id=issues[2].id, author_id=alice.id, body="Scoped for next sprint."),
])

db.commit()
db.close()

print("✅ Seed complete!")
print()
print("Demo credentials:")
print("  Alice (maintainer): alice@example.com / password123")
print("  Bob   (member):     bob@example.com   / password123")
