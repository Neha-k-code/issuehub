import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../components/Modal'

describe('Modal', () => {
  const onClose = vi.fn()

  beforeEach(() => onClose.mockClear())

  test('renders title and children', () => {
    render(<Modal title="Test Modal" onClose={onClose}><p>Modal content</p></Modal>)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  test('renders footer when provided', () => {
    render(<Modal title="Test" onClose={onClose} footer={<button>Save</button>}><p>body</p></Modal>)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  test('calls onClose when close button clicked', () => {
    render(<Modal title="Test" onClose={onClose}><p>body</p></Modal>)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when Escape key pressed', () => {
    render(<Modal title="Test" onClose={onClose}><p>body</p></Modal>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when overlay backdrop clicked', () => {
    render(<Modal title="Test" onClose={onClose}><p>body</p></Modal>)
    fireEvent.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('does not call onClose when modal content clicked', () => {
    render(<Modal title="Test" onClose={onClose}><p>body</p></Modal>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  test('has aria-modal attribute for accessibility', () => {
    render(<Modal title="Test" onClose={onClose}><p>body</p></Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
