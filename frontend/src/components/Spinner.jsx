export function Spinner({ white = false }) {
  return <span className={`spinner ${white ? 'spinner-white' : ''}`} />
}

export function LoadingPage() {
  return (
    <div className="loading-container">
      <Spinner />
      <span>Loading…</span>
    </div>
  )
}
