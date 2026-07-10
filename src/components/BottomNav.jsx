import { NavLink, useLocation } from 'react-router-dom'
import { Home, UtensilsCrossed, ShoppingCart, User } from 'lucide-react'
import { useCart } from '../context/CartContext'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const { totalItems } = useCart()
  const location = useLocation()

  // Hide on checkout and success pages
  if (['/checkout', '/order-success', '/admin'].some(p => location.pathname.startsWith(p))) {
    return null
  }

  return (
    <nav className="bottom-nav">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || 
            (to !== '/' && location.pathname.startsWith(to))
          const isCart = label === 'Cart'

          return (
            <NavLink
              key={to}
              to={to}
              className={`tab-item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isCart && totalItems > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -10,
                      background: '#DC2626',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid white',
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
