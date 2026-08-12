// For both local development (using Vite dev server proxy) and Vercel production,
// relative same-origin paths are used. No external API base URL environment variable is needed.
export const API_BASE_URL = ''

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
