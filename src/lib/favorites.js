const FAVORITES_KEY = 'couple-bowl-favorites'

const keyForUser = (email) => `${FAVORITES_KEY}:${String(email || 'guest').toLowerCase()}`

export const readFavoriteIds = (email) => {
  try {
    const saved = localStorage.getItem(keyForUser(email))
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    localStorage.removeItem(keyForUser(email))
    return []
  }
}

export const saveFavoriteIds = (email, ids) => {
  const uniqueIds = [...new Set((ids || []).map(String))]
  localStorage.setItem(keyForUser(email), JSON.stringify(uniqueIds))
  window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { email, ids: uniqueIds } }))
  return uniqueIds
}

export const toggleFavoriteId = (email, id) => {
  const itemId = String(id)
  const current = readFavoriteIds(email)
  const next = current.includes(itemId)
    ? current.filter(savedId => savedId !== itemId)
    : [...current, itemId]

  return saveFavoriteIds(email, next)
}
