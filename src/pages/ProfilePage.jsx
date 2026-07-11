import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Settings, Bell, HelpCircle, LogOut, Package, Heart, MapPin, CreditCard, Eye, ReceiptText, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatPrice, getMenuItems, optimizeImageUrl } from '../data/menuData'
import { readFavoriteIds, saveFavoriteIds } from '../lib/favorites'

const menuLinks = [
  { id: 'orders', icon: <Package size={20} />, label: 'My Orders', color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'favorites', icon: <Heart size={20} />, label: 'Favorites', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'addresses', icon: <MapPin size={20} />, label: 'Addresses', color: '#10B981', bg: '#D1FAE5' },
  { id: 'payment', icon: <CreditCard size={20} />, label: 'Payment', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'notifications', icon: <Bell size={20} />, label: 'Notifications', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings', color: '#6B7280', bg: '#F3F4F6' },
  { id: 'help', icon: <HelpCircle size={20} />, label: 'Help & Support', color: '#06B6D4', bg: '#CFFAFE' },
]

const statusColors = {
  'Menunggu Pembayaran': { bg: '#FEF3C7', color: '#B45309' },
  'Diproses': { bg: '#E0F2FE', color: '#0369A1' },
  'Sedang Dimasak': { bg: '#FEF3C7', color: '#B45309' },
  'Siap Diambil': { bg: '#D1FAE5', color: '#059669' },
  'Sedang Diantar': { bg: '#E0E7FF', color: '#4338CA' },
  'Selesai': { bg: '#D1FAE5', color: '#059669' },
  'Dibatalkan': { bg: '#FEE2E2', color: '#B91C1C' },
}

const statusSteps = ['Menunggu Pembayaran', 'Diproses', 'Sedang Dimasak', 'Siap Diambil', 'Selesai']

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activePanel, setActivePanel] = useState('orders')
  const [favoriteIds, setFavoriteIds] = useState([])
  const [menuList, setMenuList] = useState([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    if (!user?.email) return

    const fetchOrders = () => {
      fetch(`/api/orders/user/${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => {
          const formatted = data.map(o => {
            const itemsSummary = o.items && o.items.length > 0
              ? o.items.map(item => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ')
              : 'Order Details'

            return {
              ...o,
              id: o.order_number || `#${o.id}`,
              date: new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              itemsSummary,
              total: o.total,
              status: o.status || 'Diproses',
            }
          })
          setOrders(formatted)
        })
        .catch(err => {
          console.error('Error fetching orders:', err)
        })
    }

    fetchOrders()
    const timer = setInterval(fetchOrders, 10000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    setFavoriteIds(readFavoriteIds(user?.email))
    getMenuItems().then(data => setMenuList(data))

    const handleFavoritesUpdated = () => setFavoriteIds(readFavoriteIds(user?.email))
    window.addEventListener('favorites:updated', handleFavoritesUpdated)
    window.addEventListener('storage', handleFavoritesUpdated)
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdated)
      window.removeEventListener('storage', handleFavoritesUpdated)
    }
  }, [user?.email])

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CB'

  const getStepIndex = (status) => {
    if (status === 'Dibatalkan') return -1
    const index = statusSteps.indexOf(status)
    return index === -1 ? 0 : index
  }

  const favoriteItems = menuList.filter(item => favoriteIds.includes(String(item.id)))

  const removeFavorite = (itemId) => {
    setFavoriteIds(saveFavoriteIds(user?.email, favoriteIds.filter(id => id !== String(itemId))))
  }

  const renderOrdersPanel = () => (
    <>
      <h3 className="profile-orders-title">Recent Orders</h3>
      {orders.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 10px', background: 'white', borderRadius: 16, border: '1px solid #F3F4F6' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>You have no orders yet.</p>
          <Link to="/menu" className="btn-primary" style={{ marginTop: 12, padding: '8px 20px', fontSize: 13 }}>
            Order Now
          </Link>
        </div>
      ) : (
        orders.map((order, i) => {
          const sColor = statusColors[order.status] || statusColors['Diproses']
          const activeStep = getStepIndex(order.status)

          return (
            <div key={order.id} className="animate-fade-in profile-order-card" style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{order.id}</span>
                <span className="status-pill" style={{ background: sColor.bg, color: sColor.color }}>
                  {order.status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{order.itemsSummary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statusSteps.length}, 1fr)`, gap: 4, margin: '12px 0' }}>
                {statusSteps.map((step, idx) => (
                  <div key={step} title={step} style={{ height: 6, borderRadius: 999, background: activeStep >= idx ? '#DC2626' : '#E5E7EB' }} />
                ))}
              </div>
              {order.payment_status === 'Rejected' && order.rejection_reason && (
                <div style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
                  Pembayaran ditolak: {order.rejection_reason}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{order.date}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setSelectedOrder(order)} style={{ border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#4B5563', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <Eye size={13} /> Detail
                  </button>
                  <Link to={`/invoice/${order.order_number}`} style={{ border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#4B5563', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <ReceiptText size={13} /> Invoice
                  </Link>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </>
  )

  const renderFavoritesPanel = () => (
    <>
      <h3 className="profile-orders-title">Favorite Menu</h3>
      {favoriteItems.length === 0 ? (
        <div className="profile-panel-card">
          <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 12 }}>Belum ada menu favorit.</p>
          <Link to="/menu" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, textDecoration: 'none' }}>Pilih Favorite</Link>
        </div>
      ) : (
        <div className="profile-favorites-list">
          {favoriteItems.map(item => (
            <div key={item.id} className="profile-favorite-item">
              <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>{item.name}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginTop: 2 }}>{formatPrice(item.price)}</div>
              </div>
              <button type="button" className="profile-icon-action" onClick={() => removeFavorite(item.id)} title="Remove favorite">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const renderInfoPanel = (title, description, children) => (
    <>
      <h3 className="profile-orders-title">{title}</h3>
      <div className="profile-panel-card">
        <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, marginBottom: children ? 16 : 0 }}>{description}</p>
        {children}
      </div>
    </>
  )

  const renderActivePanel = () => {
    if (activePanel === 'favorites') return renderFavoritesPanel()
    if (activePanel === 'addresses') {
      return renderInfoPanel('Addresses', 'Alamat pengiriman akan digunakan saat checkout. Saat ini alamat dapat diisi langsung di halaman checkout.', (
        <Link to="/checkout" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, textDecoration: 'none' }}>Buka Checkout</Link>
      ))
    }
    if (activePanel === 'payment') {
      return renderInfoPanel('Payment', 'Metode pembayaran aktif: transfer bank, GoPay, dan bayar di tempat sesuai pilihan checkout.', (
        <Link to="/cart" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, textDecoration: 'none' }}>Lanjut ke Cart</Link>
      ))
    }
    if (activePanel === 'notifications') {
      return renderInfoPanel('Notifications', 'Atur notifikasi status pesanan dan pembayaran dari akun Anda.', (
        <button type="button" className="profile-setting-toggle" onClick={() => setNotificationsEnabled(value => !value)}>
          {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
        </button>
      ))
    }
    if (activePanel === 'settings') {
      return renderInfoPanel('Settings', 'Informasi akun yang sedang aktif.', (
        <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
          <div><strong>Nama:</strong> {user?.name || '-'}</div>
          <div><strong>Email:</strong> {user?.email || '-'}</div>
        </div>
      ))
    }
    if (activePanel === 'help') {
      return renderInfoPanel('Help & Support', 'Butuh bantuan? Hubungi admin restoran atau cek kembali status pesanan pada menu My Orders.', (
        <button type="button" className="profile-setting-toggle" onClick={() => setActivePanel('orders')}>Cek Pesanan</button>
      ))
    }
    return renderOrdersPanel()
  }

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-header">
        <div className="profile-header-decor-1" />
        <div className="profile-header-decor-2" />
        <div className="profile-header-content">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 className="profile-name">{user?.name || 'Customer'}</h2>
            <p className="profile-email">{user?.email || 'customer@email.com'}</p>
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="profile-stat-val">{orders.length}</div><div className="profile-stat-label">Orders</div></div>
            <div className="profile-stat-divider" />
            <div className="profile-stat"><div className="profile-stat-val">{orders.filter(o => o.status === 'Selesai').length}</div><div className="profile-stat-label">Done</div></div>
            <div className="profile-stat-divider" />
            <div className="profile-stat"><div className="profile-stat-val">{orders.filter(o => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length}</div><div className="profile-stat-label">Active</div></div>
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-layout">
          <div className="profile-menu-col">
            <div className="profile-menu-card">
              {menuLinks.map((item) => (
                <button key={item.id} type="button" className={`profile-menu-item ${activePanel === item.id ? 'active' : ''}`} onClick={() => setActivePanel(item.id)}>
                  <div className="profile-menu-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                  <span className="profile-menu-label">{item.label}</span>
                  <ChevronRight size={18} color="#D1D5DB" />
                </button>
              ))}
            </div>
            <button className="profile-logout" onClick={() => logout('user')}>
              <LogOut size={18} /> Log Out
            </button>
          </div>

          <div className="profile-orders-col">
            {renderActivePanel()}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(560px,100%)', maxHeight: '86vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Detail Pesanan</h3>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{selectedOrder.id} - {selectedOrder.status}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: '#F3F4F6', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Tutup</button>
            </div>
            <Link to={`/invoice/${selectedOrder.order_number}`} style={{display:'inline-flex',alignItems:'center',gap:6,textDecoration:'none',fontSize:13,fontWeight:800,color:'#DC2626',marginBottom:14}}>
              <ReceiptText size={15} /> Buka Invoice
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(selectedOrder.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #F3F4F6', borderRadius: 12, padding: 12 }}>
                  <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{item.quantity}x {item.name}</div>
                    {item.item_note && <div style={{ fontSize: 12, color: '#6B7280' }}>Catatan: {item.item_note}</div>}
                  </div>
                  <div style={{ fontWeight: 800, color: '#DC2626', fontSize: 13 }}>{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            {selectedOrder.note && (
              <div style={{ fontSize: 13, color: '#4B5563', background: '#F9FAFB', borderRadius: 12, padding: 12, marginTop: 14 }}>
                Catatan order: {selectedOrder.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
