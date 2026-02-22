import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingPage } from './Spinner'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user) return <Navigate to="/login" replace />
  return children
}
