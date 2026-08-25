import { useState, useEffect } from 'react'
import { Search, Star, Clock, Plus, Sparkles, Filter, Grid3X3, List, Heart } from 'lucide-react'
import { categories as defaultCategories, getCachedMenuItems, getMenuItems, formatPrice, optimizeImageUrl } from '../data/menuData'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { readFavoriteIds, toggleFavoriteId } from '../lib/favorites'
import AddOnModal from '../components/AddOnModal'

const isMenuSoldOut = (item) => String(item?.status || 'Tersedia').toLowerCase() === 'habis'
const defaultMenuCategories = defaultCategories.filter(category => category.id !== 'all')

export default function MenuPage() {
  const initialMenuState = () => {
    const items = getCachedMenuItems()
    return { items, loading: items.length === 0 }
  }
  const [menuState, setMenuState] = useState(initialMenuState)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [categories, setCategories] = useState(defaultMenuCategories)
  const [selectedAddOnItem, setSelectedAddOnItem] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState([])
  const { addItem } = useCart()
  const { user } = useAuth()
  const menuList = menuState.items
  const isMenuLoading = menuState.loading

  useEffect(() => {
    let isMounted = true

    getMenuItems()
      .then(data => {
        if (isMounted) setMenuState({ items: data, loading: false })
      })
      .catch(error => {
        console.error('Error fetching menu:', error)
        if (isMounted) setMenuState(prev => ({ ...prev, loading: false }))
      })

    fetch('/api/categories')
      .then(async r => {
        const data = await r.json().catch(() => [])
        if (!r.ok || !Array.isArray(data)) return []
        return data
      })
      .then(data => setCategories(data.length > 0 ? data : defaultMenuCategories))
      .catch(error => {
        console.error('Error fetching categories:', error)
        setCategories(defaultMenuCategories)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setFavoriteIds(readFavoriteIds(user?.email))
  }, [user?.email])

  const filteredItems = menuList.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAdd = (item) => {
    if (isMenuSoldOut(item)) {
      setToastMessage(`${item.name} sedang habis`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    setSelectedAddOnItem(item)
  }

  const handleToggleFavorite = (item) => {
    const nextFavorites = toggleFavoriteId(user?.email, item.id)
    const isFavorite = nextFavorites.includes(String(item.id))

    setFavoriteIds(nextFavorites)
    setToastMessage(isFavorite ? `${item.name} added to favorites` : `${item.name} removed from favorites`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleConfirmAdd = (item, quantity) => {
    for (let i = 0; i < quantity; i += 1) {
      addItem(item)
    }

    setSelectedAddOnItem(null)
    setToastMessage(`${quantity} ${item.name} added!`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <div className="menu-page">
      {/* Header */}
      <div className="menu-header">
        <div className="menu-header-top">
          <div>
            <h1 className="menu-title">Our Menu</h1>
            <p className="menu-subtitle">Discover our delicious collection of bowls</p>
          </div>
          <div className="menu-header-actions">
            <div className="menu-view-toggle">
              <button onClick={() => setViewMode('grid')} className={`menu-view-btn ${viewMode === 'grid' ? 'active' : ''}`}><Grid3X3 size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`menu-view-btn ${viewMode === 'list' ? 'active' : ''}`}><List size={16} /></button>
            </div>
            <div className="menu-filter-btn-wrap">
              <div className="menu-filter-btn"><Filter size={18} /></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="menu-search-wrap">
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" placeholder="Search menu..." className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {/* Categories */}
        <div className="menu-categories">
          <button className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
            All Menu
          </button>
          {categories.map(cat => (
            <button key={cat.id} className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-content">
        <div className="menu-item-count">
          {isMenuLoading ? 'Memuat menu...' : `${filteredItems.length} items found`}
        </div>

        <div className={`menu-items-grid ${viewMode === 'list' ? 'menu-items-list' : ''}`}>
          {isMenuLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`menu-item-card ${viewMode} menu-item-skeleton`}>
                <div className="menu-item-image menu-skeleton-block" />
                <div className="menu-item-info">
                  <div className="menu-item-info-top">
                    <div className="menu-skeleton-line title" />
                    <div className="menu-skeleton-line" />
                    <div className="menu-skeleton-line short" />
                  </div>
                  <div className="menu-item-bottom">
                    <div className="menu-skeleton-line price" />
                    <div className="menu-skeleton-circle" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredItems.map((item, i) => {
            const soldOut = isMenuSoldOut(item)
            return (
            <div key={item.id} className={`animate-fade-in card-hover menu-item-card ${viewMode} ${soldOut ? 'sold-out' : ''}`} style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
              <div className="menu-item-image">
                <img
                  src={optimizeImageUrl(item.image, viewMode === 'list' ? 220 : 360)}
                  data-fallback-src={item.fallbackImage || ''}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  className={`menu-favorite-btn ${favoriteIds.includes(String(item.id)) ? 'active' : ''}`}
                  onClick={() => handleToggleFavorite(item)}
                  aria-label={favoriteIds.includes(String(item.id)) ? 'Remove from favorites' : 'Add to favorites'}
                  title={favoriteIds.includes(String(item.id)) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={16} fill={favoriteIds.includes(String(item.id)) ? 'currentColor' : 'none'} />
                </button>
                {item.isNew && (
                  <div className="menu-item-badge new"><Sparkles size={8} /> NEW</div>
                )}
                {soldOut && (
                  <div className="menu-item-badge sold-out">HABIS</div>
                )}
                {item.originalPrice && (
                  <div className="menu-item-badge sale">{Math.round((1 - item.price / item.originalPrice) * 100)}% OFF</div>
                )}
              </div>
              <div className="menu-item-info">
                <div className="menu-item-info-top">
                  <h3 className="menu-item-name">{item.name}</h3>
                  <p className="menu-item-desc">{item.description}</p>
                  <div className="menu-item-meta">
                    <span className="menu-item-meta-item"><Star size={12} fill="#FBBF24" stroke="#FBBF24" /> {item.rating}</span>
                    <span className="menu-item-meta-item"><Clock size={12} /> {item.prepTime}</span>
                    <span className="menu-item-meta-item menu-desktop-show">{item.calories} kcal</span>
                  </div>
                </div>
                <div className="menu-item-bottom">
                  <div>
                    <span className="menu-item-price">{formatPrice(item.price)}</span>
                    {item.originalPrice && <span className="menu-item-old-price">{formatPrice(item.originalPrice)}</span>}
                  </div>
                  <button
                    onClick={() => handleAdd(item)}
                    className="menu-add-btn"
                    disabled={soldOut}
                    title={soldOut ? 'Menu sedang habis' : 'Tambah menu'}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      </div>
      {showToast && <div className="toast">{toastMessage}</div>}
      <AddOnModal
        item={selectedAddOnItem}
        onClose={() => setSelectedAddOnItem(null)}
        onConfirm={handleConfirmAdd}
      />
    </div>
  )
}
