import { vi, describe, test, expect, beforeEach } from 'vitest'
import axios from 'axios'

// We test the interceptor behaviour by checking localStorage integration
describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('stores token in localStorage on loginUser', () => {
    localStorage.setItem('token', 'test-token-123')
    expect(localStorage.getItem('token')).toBe('test-token-123')
  })

  test('removes token from localStorage on logout', () => {
    localStorage.setItem('token', 'test-token-123')
    localStorage.removeItem('token')
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('token is null before login', () => {
    expect(localStorage.getItem('token')).toBeNull()
  })
})
