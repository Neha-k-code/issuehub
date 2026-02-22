import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../components/Toast'

function ToastTrigger({ message, type }) {
  const { addToast } = useToast()
  return <button onClick={() => addToast(message, type)}>Show Toast</button>
}

describe('Toast', () => {
  test('shows toast message when triggered', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Issue created!" type="success" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Issue created!')).toBeInTheDocument()
  })

  test('shows error toast with correct type class', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Something went wrong" type="error" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('Show Toast'))
    const toast = screen.getByText('Something went wrong')
    expect(toast).toBeInTheDocument()
    expect(toast.closest('.toast')).toHaveClass('toast-error')
  })

  test('shows success toast with correct type class', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Saved!" type="success" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Saved!').closest('.toast')).toHaveClass('toast-success')
  })

  test('toast can be dismissed by clicking X', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Dismiss me" type="info" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Dismiss me')).toBeInTheDocument()
    fireEvent.click(screen.getByText('×'))
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })

  test('multiple toasts shown simultaneously', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Toast A" type="success" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('Show Toast'))
    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getAllByText('Toast A')).toHaveLength(2)
  })

  test('toast container renders in the DOM', () => {
    const { container } = render(
      <ToastProvider>
        <ToastTrigger message="Hello" type="info" />
      </ToastProvider>
    )
    expect(container.querySelector('.toast-container')).toBeInTheDocument()
  })
})
