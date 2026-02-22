import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProjects, createProject } from '../api/projects'
import { Modal } from '../components/Modal'
import { LoadingPage, Spinner } from '../components/Spinner'
import { useToast } from '../components/Toast'

function getErrorMsg(err) {
  return err.response?.data?.error?.message || 'Something went wrong'
}

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', key: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Project name is required'
    if (!form.key.trim()) errs.key = 'Project key is required'
    else if (!/^[a-zA-Z0-9]{2,10}$/.test(form.key)) errs.key = 'Key must be 2–10 alphanumeric characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await createProject(form)
      addToast(`Project "${res.data.name}" created!`, 'success')
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
      title="New Project"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner white /> Creating…</> : 'Create Project'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            className={`form-control${errors.name ? ' error' : ''}`}
            placeholder="e.g. My Application"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Project Key *</label>
          <input
            className={`form-control${errors.key ? ' error' : ''}`}
            placeholder="e.g. APP"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
            maxLength={10}
          />
          {errors.key && <div className="form-error">{errors.key}</div>}
          <div className="form-error" style={{ color: 'var(--text-muted)' }}>Short uppercase slug used in issue references</div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            placeholder="Optional project description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  )
}

export function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getProjects()
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Your projects and bug trackers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">No projects yet</div>
          <div className="empty-state-text">Create your first project to start tracking issues.</div>
          <br />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}/issues`} className="project-card">
              <div className="project-card-key">{p.key}</div>
              <div className="project-card-name">{p.name}</div>
              <div className="project-card-desc">{p.description || 'No description'}</div>
              <div className="project-card-meta">
                <span className="meta-item">👥 {p.member_count} {p.member_count === 1 ? 'member' : 'members'}</span>
                {p.current_user_role && (
                  <span className="meta-item">
                    <span className="role-badge">{p.current_user_role}</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setProjects([...projects, p])}
        />
      )}
    </div>
  )
}
