import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { apiUrl } from './lib/api'
import './index.css'

const originalFetch = window.fetch.bind(window)
const readStoredSession = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

window.fetch = (input, init) => {
  if (typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/uploads'))) {
    if (input.startsWith('/uploads')) return originalFetch(apiUrl(input), init)

    const adminSession = readStoredSession('couple-bowl-admin-session')
    const userSession = readStoredSession('couple-bowl-user-session')
    const token = window.location.pathname.toLowerCase().startsWith('/admin')
      ? adminSession?.token
      : userSession?.token || adminSession?.token

    const headers = new Headers(init?.headers || {})
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return originalFetch(apiUrl(input), { ...init, headers }).then(response => {
      if (response.status === 401 && !input.startsWith('/api/auth')) {
        const isAdminRoute = window.location.pathname.toLowerCase().startsWith('/admin')
        localStorage.removeItem(isAdminRoute ? 'couple-bowl-admin-session' : 'couple-bowl-user-session')
        const target = isAdminRoute ? '/login?mode=admin' : '/login'
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign(target)
        }
      }
      return response
    })
  }

  return originalFetch(input, init)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
