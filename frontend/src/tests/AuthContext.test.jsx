import { render, screen, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'

// Mock the auth API
vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}))

import { getMe } from '../api/auth'

function TestComponent() {
  const { user, loading, loginUser, logoutUser } = useAuth()
  if (loading) return <div>Loading...</div>
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button onClick={() => loginUser('token123', { email: 'alice@example.com', id: 1 })}>Login</button>
      <button onClick={logoutUser}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test('shows no user when no token in localStorage', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
  })

  test('loads user from token in localStorage on mount', async () => {
    localStorage.setItem('token', 'existing-token')
    getMe.mockResolvedValue({ data: { email: 'alice@example.com', id: 1 } })

    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com')
  })

  test('clears token if getMe fails on mount', async () => {
    localStorage.setItem('token', 'bad-token')
    getMe.mockRejectedValue(new Error('Unauthorized'))

    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('loginUser sets user and saves token to localStorage', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())

    act(() => screen.getByText('Login').click())
    expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com')
    expect(localStorage.getItem('token')).toBe('token123')
  })

  test('logoutUser clears user and removes token from localStorage', async () => {
    localStorage.setItem('token', 'existing-token')
    getMe.mockResolvedValue({ data: { email: 'alice@example.com', id: 1 } })

    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com'))

    act(() => screen.getByText('Logout').click())
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
