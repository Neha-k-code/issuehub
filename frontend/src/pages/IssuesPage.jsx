import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getIssues, createIssue } from '../api/issues'
import { getMembers, addMember } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'
import { LoadingPage, Spinner } from '../components/Spinner'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { useToast } from '../components/Toast'

function getErrorMsg(err) {
  return err.response?.data?.error?.message || 'Something went wrong'
}

// ─── Add Member Modal ────────────────────────────────────────────────────────
function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await addMember(projectId, form)
      addToast(`${res.data.user.name} added as ${res.data.role}!`, 'success')
      onAdded(res.data)
      onClose()
    } catch (err) {
      addToast(getErrorMsg(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Add Member"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner white /> Adding…</> : 'Add Member'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Email address *</label>
          <input
            type="email"
            className={`form-control${errors.email ? ' error' : ''}`}
            placeholder="user@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            The user must already have an account.
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="member">Member — can create issues and comment</option>
            <option value="maintainer">Maintainer — full project control</option>
          </select>
        </div>
      </form>
    </Modal>
  )
}

// ─── New Issue Modal ─────────────────────────────────────────────────────────
function NewIssueModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : undefined,
      }
      const res = await createIssue(projectId, payload)
      addToast('Issue created!', 'success')
      onCreated(res.data)
      onClose()
    } catch (err) {
      addToast(getErrorMsg(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="New Issue"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner white /> Creating…</> : 'Create Issue'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className={`form-control${errors.title ? ' error' : ''}`}
            placeholder="Short description of the issue"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <div className="form-error">{errors.title}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            placeholder="More details about the issue…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select className="form-control" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ─── Members Panel ───────────────────────────────────────────────────────────
function MembersPanel({ members, isMaintainer, projectId, onMemberAdded }) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Members ({members.length})
        </span>
        {isMaintainer && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Member
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {members.map((m) => (
          <div key={m.user.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '4px 10px', fontSize: '.8rem' }}>
            <div style={{ width: '20px', height: '20px', background: m.role === 'maintainer' ? 'var(--navy)' : 'var(--blue)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.65rem', flexShrink: 0 }}>
              {m.user.name[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: 500 }}>{m.user.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>{m.role}</span>
          </div>
        ))}
      </div>
      {showAddModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onAdded={(newMember) => { onMemberAdded(newMember); setShowAddModal(false) }}
        />
      )}
    </div>
  )
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function IssuesPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const { addToast } = useToast()

  const [issues, setIssues] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [isMaintainer, setIsMaintainer] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)

  const [filters, setFilters] = useState({ q: '', status: '', priority: '', assignee_id: '', sort: 'created_at_desc' })
  const [page, setPage] = useState(1)
  const limit = 10

  const debounceRef = useRef(null)
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(filters.q), 500)
    return () => clearTimeout(debounceRef.current)
  }, [filters.q])

  const fetchIssues = useCallback(() => {
    setLoading(true)
    const params = { page, limit }
    if (debouncedQ) params.q = debouncedQ
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.assignee_id) params.assignee_id = filters.assignee_id
    if (filters.sort) params.sort = filters.sort

    getIssues(projectId, params)
      .then((res) => {
        setIssues(res.data.items)
        setTotal(res.data.total)
        setPages(res.data.pages)
      })
      .catch(() => addToast('Failed to load issues', 'error'))
      .finally(() => setLoading(false))
  }, [projectId, page, debouncedQ, filters.status, filters.priority, filters.assignee_id, filters.sort])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  useEffect(() => {
    getMembers(projectId)
      .then((res) => {
        setMembers(res.data)
        const me = res.data.find((m) => m.user.id === user?.id)
        if (me) setIsMaintainer(me.role === 'maintainer')
      })
      .catch(() => {})
  }, [projectId, user])

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
    setPage(1)
  }

  const handleMemberAdded = (newMember) => {
    setMembers((prev) => {
      const exists = prev.find((m) => m.user.id === newMember.user.id)
      if (exists) return prev.map((m) => m.user.id === newMember.user.id ? newMember : m)
      return [...prev, newMember]
    })
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Issues</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">{total} issues total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowIssueModal(true)}>+ New Issue</button>
      </div>

      {/* Members panel */}
      <MembersPanel
        members={members}
        isMaintainer={isMaintainer}
        projectId={projectId}
        onMemberAdded={handleMemberAdded}
      />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
            <input
              className="form-control search-input"
              placeholder="Search issues…"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
            <select className="form-control filter-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="form-control filter-select" value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="form-control filter-select" value={filters.assignee_id} onChange={(e) => handleFilterChange('assignee_id', e.target.value)}>
              <option value="">All Assignees</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
            <select className="form-control filter-select" value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
              <option value="created_at_desc">Newest</option>
              <option value="created_at_asc">Oldest</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingPage />
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No issues found</div>
            <div className="empty-state-text">Try adjusting your filters or create a new issue.</div>
          </div>
        ) : (
          <>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="issue-title-cell">
                      <Link to={`/issues/${issue.id}`} className="issue-row-link">{issue.title}</Link>
                    </td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td>{issue.assignee?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(issue.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
              <div className="pagination-buttons">
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: '.875rem' }}>{page} / {pages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)} disabled={page >= pages}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showIssueModal && (
        <NewIssueModal
          projectId={projectId}
          members={members}
          onClose={() => setShowIssueModal(false)}
          onCreated={() => { setPage(1); fetchIssues() }}
        />
      )}
    </div>
  )
}
