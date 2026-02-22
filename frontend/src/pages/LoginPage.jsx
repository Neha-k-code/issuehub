import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Spinner } from '../components/Spinner'

function getErrorMsg(err) {
  const data = err.response?.data
  if (data?.error?.message) return data.error.message
  if (data?.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
  return 'Something went wrong'
}

export function LoginPage() {
  const [tab, setTab] = useState('login')
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})
  const [loginLoading, setLoginLoading] = useState(false)

  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' })
  const [signupErrors, setSignupErrors] = useState({})
  const [signupLoading, setSignupLoading] = useState(false)

  const validateLogin = () => {
    const errs = {}
    if (!loginData.email) errs.email = 'Email is required'
    if (!loginData.password) errs.password = 'Password is required'
    return errs
  }

  const validateSignup = () => {
    const errs = {}
    if (!signupData.name.trim()) errs.name = 'Name is required'
    if (!signupData.email) errs.email = 'Email is required'
    if (!signupData.password) errs.password = 'Password is required'
    else if (signupData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setLoginErrors(errs); return }
    setLoginLoading(true)
    try {
      const tokenRes = await login(loginData)
      localStorage.setItem('token', tokenRes.data.access_token)
      const userRes = await getMe()
      loginUser(tokenRes.data.access_token, userRes.data)
      navigate('/projects')
    } catch (err) {
      localStorage.removeItem('token')
      addToast(getErrorMsg(err), 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const errs = validateSignup()
    if (Object.keys(errs).length) { setSignupErrors(errs); return }
    setSignupLoading(true)
    try {
      await signup(signupData)
      const tokenRes = await login({ email: signupData.email, password: signupData.password })
      localStorage.setItem('token', tokenRes.data.access_token)
      const userRes = await getMe()
      loginUser(tokenRes.data.access_token, userRes.data)
      addToast('Account created successfully!', 'success')
      navigate('/projects')
    } catch (err) {
      localStorage.removeItem('token')
      addToast(getErrorMsg(err), 'error')
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">🐛 IssueHub</div>
          <div className="auth-brand-tagline">Lightweight Bug Tracker</div>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => setTab('signup')}>Sign Up</button>
        </div>
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className={`form-control${loginErrors.email ? ' error' : ''}`} placeholder="alice@example.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
              {loginErrors.email && <div className="form-error">{loginErrors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className={`form-control${loginErrors.password ? ' error' : ''}`} placeholder="Your password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
              {loginErrors.password && <div className="form-error">{loginErrors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loginLoading}>
              {loginLoading ? <><Spinner white /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        )}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className={`form-control${signupErrors.name ? ' error' : ''}`} placeholder="Alice Smith" value={signupData.name} onChange={(e) => setSignupData({ ...signupData, name: e.target.value })} />
              {signupErrors.name && <div className="form-error">{signupErrors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className={`form-control${signupErrors.email ? ' error' : ''}`} placeholder="alice@example.com" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} />
              {signupErrors.email && <div className="form-error">{signupErrors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className={`form-control${signupErrors.password ? ' error' : ''}`} placeholder="Min 6 characters" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} />
              {signupErrors.password && <div className="form-error">{signupErrors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={signupLoading}>
              {signupLoading ? <><Spinner white /> Creating account…</> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
