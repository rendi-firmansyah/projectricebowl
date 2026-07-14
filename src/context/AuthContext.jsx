import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext()

const USER_SESSION_KEY = 'couple-bowl-user-session'
const ADMIN_SESSION_KEY = 'couple-bowl-admin-session'

const readSession = (key) => {
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : null
    if (parsed && !parsed.token) {
      localStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

const saveSession = (key, session) => {
  localStorage.setItem(key, JSON.stringify(session))
}

export function AuthProvider({ children }) {
  const [userSession, setUserSession] = useState(null)
  const [adminSession, setAdminSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUserSession(readSession(USER_SESSION_KEY))
    setAdminSession(readSession(ADMIN_SESSION_KEY))
    setLoading(false)
  }, [])

  const login = async (email, password, expectedRole = 'user') => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole })
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return { success: false, message: data?.message || 'Login gagal' }
      }

      const sessionData = { ...data.user, token: data.token }
      if (data.user.role === 'admin') {
        saveSession(ADMIN_SESSION_KEY, sessionData)
        setAdminSession(sessionData)
      } else {
        saveSession(USER_SESSION_KEY, sessionData)
        setUserSession(sessionData)
      }

      return { success: true, role: data.user.role }
    } catch {
      return { success: false, message: 'Tidak bisa terhubung ke server auth' }
    }
  }

  const register = async (name, email, password, phone) => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return { success: false, message: data?.message || 'Registrasi gagal' }
      }

      const sessionData = { ...data.user, token: data.token }
      saveSession(USER_SESSION_KEY, sessionData)
      setUserSession(sessionData)
      return { success: true, role: 'user' }
    } catch {
      return { success: false, message: 'Tidak bisa terhubung ke server auth' }
    }
  }

  const updateProfile = async (name, phone, address) => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address })
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return { success: false, message: data?.message || 'Gagal memperbarui profil' }
      }

      const sessionData = { ...data.user, token: data.token }
      saveSession(USER_SESSION_KEY, sessionData)
      setUserSession(sessionData)
      return { success: true, user: data.user }
    } catch {
      return { success: false, message: 'Tidak bisa terhubung ke server' }
    }
  }

  const logout = (role) => {
    if (role === 'admin') {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      setAdminSession(null)
    } else {
      localStorage.removeItem(USER_SESSION_KEY)
      setUserSession(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user: userSession,
      admin: adminSession,
      userSession,
      adminSession,
      login,
      register,
      logout,
      updateProfile,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
