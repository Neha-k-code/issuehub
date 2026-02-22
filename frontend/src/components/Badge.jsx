export function StatusBadge({ status }) {
  const label = status?.replace('_', ' ') ?? '—'
  return <span className={`badge badge-status-${status}`}>{label}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-priority-${priority}`}>{priority ?? '—'}</span>
}
