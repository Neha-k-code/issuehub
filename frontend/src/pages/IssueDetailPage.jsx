import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getIssue, updateIssue } from '../api/issues'
import { getComments, createComment } from '../api/comments'
import { getMembers } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { LoadingPage, Spinner } from '../components/Spinner'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { useToast } from '../components/Toast'

function getErrorMsg(err) {
  return err.response?.data?.error?.message || 'Something went wrong'
}

function parseUTC(dt) {
  // Backend stores UTC without Z suffix — append Z so JS parses it correctly
  return new Date(dt.endsWith('Z') ? dt : dt + 'Z')
}

function formatDate(dt) {
  return parseUTC(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function timeAgo(dt) {
  const diff = (Date.now() - parseUTC(dt)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function IssueDetailPage() {
  const { issueId } = useParams()
  const { user } = useAuth()
  const { addToast } = useToast()

  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [members, setMembers] = useState([])
  const [isMaintainer, setIsMaintainer] = useState(false)
  const [loading, setLoading] = useState(true)

  const [commentBody, setCommentBody] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getIssue(issueId), getComments(issueId)])
      .then(([issueRes, commentsRes]) => {
        setIssue(issueRes.data)
        setComments(commentsRes.data)
        return getMembers(issueRes.data.project_id)
      })
      .then((membersRes) => {
        setMembers(membersRes.data)
        const me = membersRes.data.find((m) => m.user.id === user?.id)
        setIsMaintainer(me?.role === 'maintainer')
      })
      .catch(() => addToast('Failed to load issue', 'error'))
      .finally(() => setLoading(false))
  }, [issueId, user])

  const handleStatusChange = async (newStatus) => {
    setSaving(true)
    try {
      const res = await updateIssue(issueId, { status: newStatus })
      setIssue(res.data)
      addToast('Status updated', 'success')
    } catch (err) {
      addToast(getErrorMsg(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAssigneeChange = async (newAssigneeId) => {
    setSaving(true)
    try {
      const res = await updateIssue(issueId, { assignee_id: newAssigneeId ? parseInt(newAssigneeId) : null })
      setIssue(res.data)
      addToast('Assignee updated', 'success')
    } catch (err) {
      addToast(getErrorMsg(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setCommentLoading(true)
    try {
      const res = await createComment(issueId, { body: commentBody })
      setComments([...comments, res.data])
      setCommentBody('')
      addToast('Comment posted', 'success')
    } catch (err) {
      addToast(getErrorMsg(err), 'error')
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) return <LoadingPage />
  if (!issue) return <div className="main-content">Issue not found.</div>

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/projects/${issue.project_id}/issues`}>Issues</Link>
        <span className="breadcrumb-sep">›</span>
        <span>#{issue.id}</span>
      </div>

      <div className="issue-detail-layout">
        {/* Main content */}
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
              <h1 className="issue-title-header">{issue.title}</h1>
              {issue.description && (
                <div className="issue-description">{issue.description}</div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-body">
              <h2 className="section-title">Comments ({comments.length})</h2>

              {comments.length > 0 && (
                <div className="comment-thread">
                  {comments.map((c) => (
                    <div key={c.id} className="comment">
                      <div className="comment-header">
                        <div className="comment-avatar">{c.author.name?.[0]?.toUpperCase()}</div>
                        <span className="comment-author">{c.author.name}</span>
                        <span className="comment-time" title={formatDate(c.created_at)}>{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="comment-body">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="comment-composer">
                <div className="composer-label">Add a comment</div>
                <form onSubmit={handleComment}>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      placeholder="Write your comment…"
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      rows={4}
                    />
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                      {commentBody.length} chars
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={commentLoading || !commentBody.trim()}
                  >
                    {commentLoading ? <><Spinner white /> Posting…</> : 'Post Comment'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div>
          <div className="card issue-meta-card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>Details</span>
              {saving && <Spinner />}
            </div>
            <div className="card-body" style={{ padding: '8px 16px' }}>
              <div className="meta-row">
                <span className="meta-label">Status</span>
                {isMaintainer ? (
                  <select
                    className="form-control"
                    style={{ width: 'auto', fontSize: '.8rem', padding: '4px 8px' }}
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={saving}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <StatusBadge status={issue.status} />
                )}
              </div>

              <div className="meta-row">
                <span className="meta-label">Priority</span>
                <PriorityBadge priority={issue.priority} />
              </div>

              <div className="meta-row">
                <span className="meta-label">Assignee</span>
                {isMaintainer ? (
                  <select
                    className="form-control"
                    style={{ width: 'auto', fontSize: '.8rem', padding: '4px 8px' }}
                    value={issue.assignee?.id ?? ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="meta-value">{issue.assignee?.name ?? '—'}</span>
                )}
              </div>

              <div className="meta-row">
                <span className="meta-label">Reporter</span>
                <span className="meta-value">{issue.reporter?.name}</span>
              </div>

              <div className="meta-row">
                <span className="meta-label">Created</span>
                <span className="meta-value" style={{ fontSize: '.8rem' }}>{formatDate(issue.created_at)}</span>
              </div>

              <div className="meta-row">
                <span className="meta-label">Updated</span>
                <span className="meta-value" style={{ fontSize: '.8rem' }}>{formatDate(issue.updated_at)}</span>
              </div>

              {isMaintainer && (
                <div className="meta-row">
                  <span className="meta-label">Role</span>
                  <span className="role-badge">Maintainer</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
