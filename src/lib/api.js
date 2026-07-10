export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const apiUrl = (path) => {
  if (!path) return API_BASE_URL || window.location.origin
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const absoluteApiUrl = (path) => new URL(apiUrl(path), window.location.origin)

export const apiFetch = (path, options) => fetch(apiUrl(path), options)
