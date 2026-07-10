import { useState, useEffect } from 'react'
import { Search, Star, Clock, Plus, Sparkles, Filter, Grid3X3, List } from 'lucide-react'
import { getMenuItems, formatPrice, optimizeImageUrl } from '../data/menuData'
import { useCart } from '../context/CartContext'
import AddOnModal from '../components/AddOnModal'

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [menuList, setMenuList] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedAddOnItem, setSelectedAddOnItem] = useState(null)
  const { addItem } = useCart()

  useEffect(() => {
    getMenuItems().then(data => setMenuList(data))
    fetch('/api/categories').then(r=>r.json()).then(data => setCategories(data)).catch(console.error)
  }, [])

  const filteredItems = menuList.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAdd = (item) => {
    setSelectedAddOnItem(item)
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
        <div className="menu-item-count">{filteredItems.length} items found</div>

        <div className={`menu-items-grid ${viewMode === 'list' ? 'menu-items-list' : ''}`}>
          {filteredItems.map((item, i) => (
            <div key={item.id} className={`animate-fade-in card-hover menu-item-card ${viewMode}`} style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
              <div className="menu-item-image">
                <img src={optimizeImageUrl(item.image, viewMode === 'list' ? 220 : 360)} alt={item.name} loading="lazy" decoding="async" />
                {item.isNew && (
                  <div className="menu-item-badge new"><Sparkles size={8} /> NEW</div>
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
                  <button onClick={() => handleAdd(item)} className="menu-add-btn"><Plus size={18} /></button>
                </div>
              </div>
            </div>
          ))}
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
