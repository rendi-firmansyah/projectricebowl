import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Star, Clock, Flame, Sparkles,
  ArrowRight, Truck, CreditCard, Search, Zap, Users, Award
} from 'lucide-react'
import { getMenuItems, formatPrice, optimizeImageUrl } from '../data/menuData'
import { useCart } from '../context/CartContext'
import AddOnModal from '../components/AddOnModal'

const howItWorks = [
  { icon: <UtensilsCrossed />, title: 'Choose Menu', desc: 'Browse our curated bowl selections', color: '#DC2626', bg: '#FEE2E2' },
  { icon: <Truck />, title: 'Smart Order', desc: 'AI-powered ordering experience', color: '#F97316', bg: '#FFEDD5' },
  { icon: <CreditCard />, title: 'Checkout & Pay', desc: 'Secure and instant payment', color: '#10B981', bg: '#D1FAE5' },
]

function UtensilsCrossed() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/>
      <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c1.7 1.7 4.3 1.7 6 0"/>
      <path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"/>
    </svg>
  )
}

const desktopStats = [
  { icon: <Users size={22} />, value: '10K+', label: 'Happy Customers', color: '#3B82F6', bg: '#DBEAFE' },
  { icon: <Award size={22} />, value: '4.9', label: 'Average Rating', color: '#F59E0B', bg: '#FEF3C7' },
  { icon: <Zap size={22} />, value: '15min', label: 'Avg Delivery', color: '#10B981', bg: '#D1FAE5' },
]

export default function HomePage() {
  const { addItem } = useCart()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [menuList, setMenuList] = useState([])
  const [selectedAddOnItem, setSelectedAddOnItem] = useState(null)

  useEffect(() => {
    getMenuItems().then(data => setMenuList(data))
  }, [])

  const popularItems = menuList.filter(item => item.isPopular).slice(0, 6)

  const handleAddToCart = (item) => {
    setSelectedAddOnItem(item)
  }

  const handleConfirmAdd = (item, quantity) => {
    for (let i = 0; i < quantity; i += 1) {
      addItem(item)
    }

    setSelectedAddOnItem(null)
    setToastMessage(`${quantity} ${item.name} added to cart!`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero gradient-hero">
        <div className="home-hero-decor-1" />
        <div className="home-hero-decor-2" />
        <div className="home-hero-decor-3" />

        {/* Mobile header */}
        <div className="home-mobile-header">
          <div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Welcome back</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>Couple Bowl</div>
          </div>
          <Link to="/profile" className="home-mobile-avatar">CB</Link>
        </div>

        {/* Search (mobile) */}
        <div className="home-mobile-search">
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" placeholder="Search your favorite bowl..." className="search-input" style={{ background: 'rgba(255,255,255,0.8)' }} />
        </div>

        {/* Hero Card */}
        <div className="home-hero-card animate-fade-in">
          <div className="home-hero-card-content">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Special Offer
            </div>
            <h1 className="home-hero-title">
              The Perfect Bowl<br />
              <span style={{ color: '#DC2626' }}>For Every Couple</span>
            </h1>
            <p className="home-hero-desc">
              Fresh, healthy & delicious bowls crafted with love. Order now and enjoy premium rice bowls delivered to your doorstep.
            </p>
            <div className="home-hero-actions">
              <Link to="/menu" className="btn-primary" style={{ padding: '12px 28px' }}>
                <span>Order Now</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/smart-order" className="btn-outline home-desktop-only" style={{ padding: '10px 24px' }}>
                <Zap size={16} />
                Smart Order
              </Link>
            </div>
          </div>
          <div className="home-hero-image-wrap animate-float">
            <img
              src={optimizeImageUrl('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop', 420)}
              alt="Bowl"
              loading="eager"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="home-stats home-desktop-only">
          {desktopStats.map((stat, i) => (
            <div key={i} className="home-stat-item animate-slide-up" style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">How It Works</h2>
        </div>
        <div className="home-hiw-grid">
          {howItWorks.map((step, i) => (
            <div key={i} className="animate-slide-up card-hover home-hiw-card" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: step.bg, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                {step.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1F2937' }}>{i + 1}. {step.title}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Bowls */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">
            <Flame size={22} style={{ display: 'inline', marginRight: 8, color: '#DC2626', verticalAlign: 'text-bottom' }} />
            Popular Bowls
          </h2>
          <Link to="/menu" className="home-see-all">See All <ChevronRight size={16} /></Link>
        </div>
        <div className="home-bowls-grid">
          {popularItems.map((item, i) => (
            <div key={item.id} className="animate-scale-in card-hover home-bowl-card" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="home-bowl-image">
                <img src={optimizeImageUrl(item.image, 360)} alt={item.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {item.originalPrice && (
                  <div className="home-bowl-badge" style={{ background: '#DC2626' }}>
                    {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
                  </div>
                )}
                {item.isNew && (
                  <div className="home-bowl-badge" style={{ background: '#10B981', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Sparkles size={10} /> NEW
                  </div>
                )}
                <div className="home-bowl-rating">
                  <Star size={10} fill="#FBBF24" stroke="#FBBF24" /> {item.rating}
                </div>
              </div>
              <div className="home-bowl-info">
                <h3 className="home-bowl-name">{item.name}</h3>
                <p className="home-bowl-desc home-desktop-only">{item.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 12, color: '#9CA3AF' }}>
                  <Clock size={12} /> {item.prepTime}
                  <span className="home-desktop-only" style={{ marginLeft: 8 }}>- {item.calories} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>{formatPrice(item.price)}</div>
                    {item.originalPrice && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>{formatPrice(item.originalPrice)}</div>
                    )}
                  </div>
                  <button onClick={() => handleAddToCart(item)} className="home-add-btn">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="home-section">
        <div className="home-promo gradient-primary">
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Limited Time</div>
            <div className="home-promo-title">Free Delivery</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>On orders above Rp100.000</div>
            <Link to="/menu" style={{ background: 'white', color: '#DC2626', padding: '10px 24px', borderRadius: 24, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Order Now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="home-promo-emoji">Free</div>
        </div>
      </section>

      {showToast && <div className="toast">{toastMessage}</div>}
      <AddOnModal
        item={selectedAddOnItem}
        onClose={() => setSelectedAddOnItem(null)}
        onConfirm={handleConfirmAdd}
      />

      {/* Desktop Footer */}
      <footer className="home-footer home-desktop-only">
        <div className="home-footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: 'white', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CB</div>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-family-display)' }}>Couple Bowl</span>
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 300, lineHeight: 1.6 }}>Fresh, healthy & delicious bowls crafted with love. The perfect meal for every couple.</p>
          </div>
          <div style={{ display: 'flex', gap: 60 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280' }}>Menu</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/menu" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Rice Bowls</Link>
                <Link to="/menu" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Rice Base</Link>
                <Link to="/menu" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Risoles</Link>
                <Link to="/menu" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Add-ons</Link>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>About Us</a>
                <a href="#" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Careers</a>
                <a href="#" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20, marginTop: 20, textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>
          Copyright 2026 Couple Bowl. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
