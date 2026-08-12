const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || ''

const normalizeApiBaseUrl = (url) => {
  const trimmed = String(url || '').trim().replace(/\/$/, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) return `http://${trimmed}`
  return `https://${trimmed}`
}

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiUrl)

export const apiUrl = (path) => {
  if (!path) return API_BASE_URL || window.location.origin
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const absoluteApiUrl = (path) => new URL(apiUrl(path), window.location.origin)

export const apiFetch = (path, options = {}) => {
  const { method, headers, body, ...rest } = options

  const fetchOptions = {
    ...rest,
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body !== undefined) {
    fetchOptions.body = body
  }

  return fetch(apiUrl(path), fetchOptions)
}
