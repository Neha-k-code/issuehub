import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.location
delete window.location
window.location = { href: '', pathname: '/login' }

// Suppress React Router future flag warnings
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('React Router Future Flag')) return
  originalWarn(...args)
}
