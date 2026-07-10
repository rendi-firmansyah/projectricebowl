import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import DesktopNav from './components/DesktopNav'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import ProfilePage from './pages/ProfilePage'
import SmartOrderPage from './pages/SmartOrderPage'
import InvoicePage from './pages/InvoicePage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { user, admin } = useAuth()
  const location = useLocation()

  const currentPath = location.pathname.toLowerCase()
  const isAdminRoute = currentPath.startsWith('/admin')
  const isLoginPage = currentPath === '/login'

  const showNavs = !isAdminRoute && !isLoginPage

  return (
    <div className={isAdminRoute ? "" : "app-shell"} style={isAdminRoute ? { width:'100%', minHeight:'100vh', margin:0, padding:0 } : {}}>
      {showNavs && <DesktopNav />}
      <main className={isAdminRoute ? "" : "app-main"} style={isAdminRoute ? { padding:0, maxWidth:'100%', margin:0, minHeight:'100vh' } : (isLoginPage ? { padding:0, maxWidth:'100%', margin:0, minHeight:'100vh' } : {})}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/smart-order" element={<SmartOrderPage />} />
          
          {/* Guest browsing allowed, but protect these pages - uses user session */}
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/checkout" element={user ? <CheckoutPage /> : <Navigate to="/login?redirect=checkout" />} />
          <Route path="/order-success" element={user ? <OrderSuccessPage /> : <Navigate to="/login" />} />
          <Route path="/invoice/:orderNumber" element={(user || admin) ? <InvoicePage /> : <Navigate to="/login" />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin routes - uses admin session, completely independent from user session */}
          <Route path="/admin" element={admin ? <AdminPage /> : <Navigate to="/login?mode=admin" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {showNavs && <BottomNav />}
    </div>
  )
}


export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}
