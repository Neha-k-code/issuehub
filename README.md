# IssueHub — Lightweight Bug Tracker

A minimal, team-oriented bug tracker where developers and project managers can create projects, file and track issues, collaborate via comments, and manage team membership — all through a responsive web interface backed by a well-structured REST API.

---

## Tech Choices & Trade-offs

**FastAPI over Flask/Django**
Automatic OpenAPI docs at `/docs` and `/redoc` with zero config, native Pydantic v2 integration for all request/response validation, and async-ready architecture. Trade-off: smaller community than Flask/Django, less opinionated structure requiring disciplined manual organisation.

**SQLite (dev) / PostgreSQL (prod)**
Zero-config local setup — the database is a single file and the backend starts with one command. Switching to PostgreSQL requires only changing `DATABASE_URL`; the SQLAlchemy ORM and Alembic migrations are identical for both engines. Trade-off: SQLite lacks native full-text search (`LIKE` used instead of `tsvector`), limited concurrent write throughput, and some PostgreSQL-specific types.

**JWT over sessions**
Stateless tokens are ideal for a React SPA: no server-side session store required, tokens attach to every request via an axios interceptor. Trade-off: access tokens cannot be invalidated server-side without a denylist. MVP uses 24-hour expiry with no refresh token flow.

**Vite + React over Next.js**
Near-instant HMR, simpler setup, no SSR complexity needed for an internal tool. Trade-off: no SSR/SEO benefits compared to Next.js.

**Plain CSS over Tailwind/MUI**
No build-step complexity, easier to audit. Trade-off: more verbose than utility-class systems; a component library would accelerate development.

---

## Setup 

**For local development — no `.env` file needed.**
The app runs out of the box with sensible defaults (SQLite database, built-in secret key). Just install dependencies and start the servers.

**Optional — create a `.env` for custom config or production:**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=sqlite:///./issuehub.db
SECRET_KEY=your-long-random-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

For PostgreSQL in production, change `DATABASE_URL` to:
```
DATABASE_URL=postgresql://user:password@localhost/issuehub
```

---

## Running the Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

---

## Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server (proxies /api to port 8000)
npm run dev
```

The app will be at **http://localhost:5173**

---

## Running the Seed Script

Populate demo data (2 users, 2 projects, 15 issues, comments):

```bash
cd backend
python seed.py
```

**Demo credentials:**

| User  | Email                 | Password    | Role       |
|-------|-----------------------|-------------|------------|
| Alice | alice@example.com     | password123 | Maintainer |
| Bob   | bob@example.com       | password123 | Member     |

---

## Running Tests

```bash
cd backend

# Run all tests
pytest -v --tb=short

# With coverage report
pytest --cov=app --cov-report=term-missing
```

Tests use an isolated in-memory SQLite database. No running server or external services are required.

---

## API Documentation

FastAPI auto-generates interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register: `{name, email, password}` | Public |
| POST | `/api/auth/login` | Login → `{access_token, token_type}` | Public |
| GET | `/api/me` | Current user profile | Required |
| POST | `/api/projects` | Create project | Required |
| GET | `/api/projects` | List user's projects | Required |
| POST | `/api/projects/{id}/members` | Add member by email | Maintainer |
| GET | `/api/projects/{id}/issues` | List issues with filters | Required |
| POST | `/api/projects/{id}/issues` | Create issue | Required |
| GET | `/api/issues/{id}` | Get single issue | Required |
| PATCH | `/api/issues/{id}` | Update issue fields | Required |
| DELETE | `/api/issues/{id}` | Delete issue | Maintainer |
| GET | `/api/issues/{id}/comments` | List comments | Required |
| POST | `/api/issues/{id}/comments` | Post comment | Required |

All errors return: `{"error": {"code": "string", "message": "string", "details": null}}`

---

## Known Limitations & What I'd Do With More Time

### Current Limitations
- **No JWT refresh tokens** — 24h expiry is a shortcut; production needs a refresh flow with HttpOnly cookie-stored refresh tokens.
- **No real-time updates** — Comments require a page refresh; WebSockets (or SSE) would enable live comment streaming.
- **No email delivery** — Member invitations are UI-only; would integrate SendGrid or AWS SES for real invite emails.
- **No file attachments** — Issues cannot have screenshots or file attachments; would use S3-compatible storage.
- **Basic pagination** — Offset-based pagination degrades at scale; cursor-based pagination would be more efficient for large datasets.
- **No audit log / issue history** — Field changes are not recorded; would add a full history table tracking every change with actor, timestamp, and old/new values.
- **No rate limiting** — Auth endpoints are unprotected from brute force; would add `slowapi` middleware in production.
- **SQLite full-text search** — Using basic `LIKE`; would switch to PostgreSQL `tsvector` + GIN indexing for production-grade search.

### Technical Improvements
- **JWT refresh token rotation** — Short-lived access tokens + secure HttpOnly refresh tokens to fix the current server-side invalidation gap.
- **Real-time comments via WebSockets** — Broadcast comments and status changes live without page refresh.
- **Transactional email delivery** — Integrate SendGrid or AWS SES for real member invitation emails.
- **Issue history / audit log** — Record every field change with actor, timestamp, and old/new values.
- **PostgreSQL full-text search** — Replace LIKE with tsvector + GIN indexing for production-grade search.
- **Cursor-based pagination** — Replace offset pagination for consistent performance at large scale.
- **Rate limiting** — Add slowapi middleware to protect auth endpoints from brute-force attacks.
- **File attachments via S3** — Allow screenshots, logs, and documents to be attached to issues.

### New Feature Roadmap
- **Kanban board view** — Drag-and-drop issues across status columns as a visual alternative to the table list view.
- **GitHub / GitLab integration** — Link commits and PRs to issues; auto-close an issue when the linked PR merges.
- **Dashboard & reporting** — Charts for open vs closed issues, issues by priority, team workload, and milestone burndown.
- **@Mentions & notifications** — Tag team members in comments; in-app notification bell for assignments and mentions.
- **Issue templates** — Pre-filled forms for Bug Report, Feature Request, and Task to ensure consistent reporting.