import { NavLink, useLocation, Link } from 'react-router-dom'
import { Home, UtensilsCrossed, ShoppingCart, User, Zap } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/smart-order', label: 'Smart Order', icon: Zap },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function DesktopNav() {
  const { totalItems } = useCart()
  const { user } = useAuth()
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) return null

  return (
    <header className="desktop-nav">
      <div className="desktop-nav-inner">
        {/* Logo */}
        <Link to="/" className="desktop-nav-logo">
          <div className="desktop-nav-logo-icon">CB</div>
          <span className="desktop-nav-logo-text">Couple Bowl</span>
        </Link>

        {/* Nav Links */}
        <nav className="desktop-nav-links">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to))
            const isCart = label === 'Cart'

            return (
              <NavLink
                key={to}
                to={to}
                className={`desktop-nav-link ${isActive ? 'active' : ''}`}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {isCart && totalItems > 0 && (
                    <span className="desktop-nav-badge">{totalItems}</span>
                  )}
                </div>
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Right Section */}
        <div className="desktop-nav-right">
          {user ? (
            <Link to="/profile" className="desktop-nav-avatar" title={user.name}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Link>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', height: 38 }}>
              <span>Sign In</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
