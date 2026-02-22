import { render, screen } from '@testing-library/react'
import { StatusBadge, PriorityBadge } from '../components/Badge'

describe('StatusBadge', () => {
  test('renders open status', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText('open')).toBeInTheDocument()
  })

  test('renders in_progress with space instead of underscore', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('in progress')).toBeInTheDocument()
  })

  test('renders resolved status', () => {
    render(<StatusBadge status="resolved" />)
    expect(screen.getByText('resolved')).toBeInTheDocument()
  })

  test('renders closed status', () => {
    render(<StatusBadge status="closed" />)
    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  test('renders fallback when status is undefined', () => {
    render(<StatusBadge />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('applies correct CSS class', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText('open')).toHaveClass('badge-status-open')
  })
})

describe('PriorityBadge', () => {
  test('renders critical priority', () => {
    render(<PriorityBadge priority="critical" />)
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  test('renders high priority', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  test('renders medium priority', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  test('renders low priority', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('low')).toBeInTheDocument()
  })

  test('renders fallback when priority is undefined', () => {
    render(<PriorityBadge />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('applies correct CSS class', () => {
    render(<PriorityBadge priority="critical" />)
    expect(screen.getByText('critical')).toHaveClass('badge-priority-critical')
  })
})
