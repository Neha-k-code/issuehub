import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { AuthContext } from '../context/AuthContext'
import { ToastContext } from '../components/Toast'

// Mock API calls
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  getMe: vi.fn(),
}))

import { login, signup, getMe } from '../api/auth'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLoginPage() {
  const loginUser = vi.fn()
  const addToast = vi.fn()

  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: null, loading: false, loginUser }}>
        <ToastContext.Provider value={{ addToast }}>
          <LoginPage />
        </ToastContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  )

  return { loginUser, addToast }
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavigate.mockClear()
  })

  test('renders login tab by default', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  test('switches to sign up tab', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByText('Sign Up'))
    expect(screen.getByPlaceholderText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Create Account')).toBeInTheDocument()
  })

  test('shows validation error when email is empty', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByText('Sign In'))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
  })

  test('shows validation error when password is empty', async () => {
    renderLoginPage()
    await userEvent.type(screen.getByPlaceholderText('alice@example.com'), 'alice@example.com')
    await userEvent.click(screen.getByText('Sign In'))
    expect(await screen.findByText('Password is required')).toBeInTheDocument()
  })

  test('successful login navigates to /projects', async () => {
    login.mockResolvedValue({ data: { access_token: 'tok123', token_type: 'bearer' } })
    getMe.mockResolvedValue({ data: { id: 1, email: 'alice@example.com', name: 'Alice' } })

    renderLoginPage()
    await userEvent.type(screen.getByPlaceholderText('alice@example.com'), 'alice@example.com')
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'password123')
    await userEvent.click(screen.getByText('Sign In'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/projects'))
  })

  test('shows error toast on login failure', async () => {
    login.mockRejectedValue({ response: { data: { error: { message: 'Invalid credentials' } } } })

    const { addToast } = renderLoginPage()
    await userEvent.type(screen.getByPlaceholderText('alice@example.com'), 'wrong@example.com')
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'wrongpass')
    await userEvent.click(screen.getByText('Sign In'))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Invalid credentials', 'error'))
  })

  test('signup shows name required error', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByText('Sign Up'))
    await userEvent.click(screen.getByText('Create Account'))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })

  test('signup shows password too short error', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByText('Sign Up'))
    await userEvent.type(screen.getByPlaceholderText('Alice Smith'), 'Alice')
    await userEvent.type(screen.getAllByPlaceholderText('alice@example.com')[0], 'alice@example.com')
    await userEvent.type(screen.getByPlaceholderText('Min 6 characters'), 'abc')
    await userEvent.click(screen.getByText('Create Account'))
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
  })

  test('successful signup navigates to /projects', async () => {
    signup.mockResolvedValue({ data: {} })
    login.mockResolvedValue({ data: { access_token: 'tok123', token_type: 'bearer' } })
    getMe.mockResolvedValue({ data: { id: 2, email: 'new@example.com', name: 'New User' } })

    renderLoginPage()
    await userEvent.click(screen.getByText('Sign Up'))
    await userEvent.type(screen.getByPlaceholderText('Alice Smith'), 'New User')
    await userEvent.type(screen.getAllByPlaceholderText('alice@example.com')[0], 'new@example.com')
    await userEvent.type(screen.getByPlaceholderText('Min 6 characters'), 'password123')
    await userEvent.click(screen.getByText('Create Account'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/projects'))
  })
})
