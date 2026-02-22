import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthContext } from '../context/AuthContext'

function renderWithAuth(user, loading = false) {
  render(
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={
            <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  test('shows protected content when user is logged in', () => {
    renderWithAuth({ id: 1, email: 'alice@example.com' })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('redirects to /login when user is not logged in', () => {
    renderWithAuth(null)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('shows loading spinner while auth is loading', () => {
    renderWithAuth(null, true)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
