import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="navbar">
      <NavLink to="/projects" className="navbar-brand">
        <div className="brand-icon">IH</div>
        IssueHub
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/projects" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
          Projects
        </NavLink>
      </div>
      <div className="navbar-user">
        <div className="navbar-avatar">{user.name?.[0]?.toUpperCase()}</div>
        <span className="navbar-username">{user.name}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
