import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Utensils, ShoppingBag, Users, Tag, CreditCard, Image as ImageIcon, MessageSquare, FileText, Settings, UserCircle, LogOut, ChevronDown, Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../data/menuData'
import { absoluteApiUrl, apiFetch } from '../../lib/api'
import './admin.css'
import DashboardView from './DashboardView'
import MenuListView from './MenuListView'
import MenuFormView from './MenuFormView'
import OrdersView from './OrdersView'
import CustomersView from './CustomersView'
import PromoView from './PromoView'
import PaymentsView from './PaymentsView'
import GalleryView from './GalleryView'
import TestimonialsView from './TestimonialsView'
import SettingsView from './SettingsView'
import ProfileView from './ProfileView'
import MenuCategoryView from './MenuCategoryView'
import ReportsView from './ReportsView'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu', icon: Utensils, subItems: [
    { id: 'menu-list', label: 'Daftar Menu' },
    { id: 'menu-add', label: 'Tambah Menu' },
    { id: 'menu-category', label: 'Kategori Menu' },
  ]},
  { id: 'orders', label: 'Pesanan', icon: ShoppingBag, subItems: [
    { id: 'orders-all', label: 'Semua Pesanan' },
    { id: 'orders-new', label: 'Pesanan Baru' },
    { id: 'orders-processing', label: 'Diproses' },
    { id: 'orders-cooking', label: 'Sedang Dimasak' },
    { id: 'orders-ready', label: 'Siap Diambil' },
    { id: 'orders-completed', label: 'Selesai' },
    { id: 'orders-cancelled', label: 'Dibatalkan' },
  ]},
  { id: 'customers', label: 'Pelanggan', icon: Users },
  { id: 'promo', label: 'Promo', icon: Tag },
  { id: 'payments', label: 'Pembayaran', icon: CreditCard },
  { id: 'gallery', label: 'Galeri', icon: ImageIcon },
  { id: 'testimonials', label: 'Testimoni', icon: MessageSquare },
  { id: 'reports', label: 'Laporan', icon: FileText, subItems: [
    { id: 'reports-sales', label: 'Penjualan' },
    { id: 'reports-revenue', label: 'Pendapatan' },
    { id: 'reports-top-menu', label: 'Menu Terlaris' },
  ]},
  { id: 'settings', label: 'Pengaturan Website', icon: Settings },
  { id: 'profile', label: 'Profil Admin', icon: UserCircle },
]

export default function AdminPage() {
  const { logout, admin } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingMenu, setEditingMenu] = useState(null)
  const [expandedMenus, setExpandedMenus] = useState({ menu: true, orders: false })
  const [stats, setStats] = useState({ totalMenu: 0, totalOrders: 0, totalCustomers: 0, revenueToday: 0, revenueMonth: 0, ordersToday: 24 })
  const [orderCounts, setOrderCounts] = useState({})
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900)
  const [newOrderNotice, setNewOrderNotice] = useState(null)
  const lastPendingCountRef = useRef(null)

  useEffect(() => {
    apiFetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(prev => ({ ...prev, totalMenu: data.totalMenu||0, totalOrders: data.totalOrders||0, totalCustomers: data.totalCustomers||0, revenueToday: data.totalRevenue||0, revenueMonth: data.totalRevenue||0 })))
      .catch(console.error)
  }, [])

  const refreshOrderCounts = () => {
    apiFetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        const orders = Array.isArray(data) ? data : []
        const pendingCount = orders.filter(o => o.status === 'Menunggu Pembayaran').length
        if (lastPendingCountRef.current !== null && pendingCount > lastPendingCountRef.current) {
          const latest = orders.find(o => o.status === 'Menunggu Pembayaran')
          setNewOrderNotice({
            count: pendingCount - lastPendingCountRef.current,
            orderNumber: latest?.order_number || '',
            customerName: latest?.customer_name || 'Customer',
          })
          setTimeout(() => setNewOrderNotice(null), 6000)
        }
        lastPendingCountRef.current = pendingCount

        setOrderCounts({
          'orders-all': orders.length,
          'orders-new': pendingCount,
          'orders-processing': orders.filter(o => o.status === 'Diproses').length,
          'orders-cooking': orders.filter(o => o.status === 'Sedang Dimasak').length,
          'orders-ready': orders.filter(o => o.status === 'Siap Diambil').length,
          'orders-completed': orders.filter(o => o.status === 'Selesai').length,
          'orders-cancelled': orders.filter(o => o.status === 'Dibatalkan').length,
        })
      })
      .catch(console.error)
  }

  useEffect(() => {
    refreshOrderCounts()
    const timer = setInterval(refreshOrderCounts, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!admin?.token) return

    const url = absoluteApiUrl('/api/events/admin')
    url.searchParams.set('token', admin.token)
    const events = new EventSource(url.toString())

    const handleOrderEvent = (event) => {
      const data = JSON.parse(event.data || '{}')
      refreshOrderCounts()
      if (event.type === 'new-order') {
        setNewOrderNotice({
          count: 1,
          orderNumber: data.order_number || '',
          customerName: data.customer_name || 'Customer',
        })
        setTimeout(() => setNewOrderNotice(null), 6000)
      }
    }

    events.addEventListener('new-order', handleOrderEvent)
    events.addEventListener('order-status-updated', handleOrderEvent)
    events.addEventListener('payment-verified', handleOrderEvent)
    events.addEventListener('payment-rejected', handleOrderEvent)

    return () => events.close()
  }, [admin?.token])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSubmenu = (id) => setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }))

  const handleNavClick = (item) => {
    if (!item.subItems) {
      setActiveTab(item.id)
      return
    }

    setExpandedMenus(prev => ({ ...prev, [item.id]: true }))
    if (item.id === 'orders') {
      setActiveTab('orders-all')
    } else if (item.id === 'menu') {
      setActiveTab('menu-list')
    } else if (item.id === 'reports') {
      setActiveTab('reports-sales')
    }
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView stats={stats} />
      case 'menu-list': return <MenuListView onAdd={() => { setEditingMenu(null); setActiveTab('menu-add'); }} onEdit={(item) => { setEditingMenu(item); setActiveTab('menu-add'); }} />
      case 'menu-add': return <MenuFormView editItem={editingMenu} onSaveSuccess={() => { setEditingMenu(null); setActiveTab('menu-list'); }} onCancel={() => { setEditingMenu(null); setActiveTab('menu-list'); }} />
      case 'menu-category': return <MenuCategoryView />
      case 'orders-all': case 'orders-new': case 'orders-processing': case 'orders-cooking': case 'orders-ready': case 'orders-completed': case 'orders-cancelled':
        return <OrdersView filter={activeTab} onOrdersChanged={refreshOrderCounts} />
      case 'customers': return <CustomersView />
      case 'promo': return <PromoView />
      case 'payments': return <PaymentsView />
      case 'gallery': return <GalleryView />
      case 'testimonials': return <TestimonialsView />
      case 'reports-sales': return <ReportsView type="sales" />
      case 'reports-revenue': return <ReportsView type="revenue" />
      case 'reports-top-menu': return <ReportsView type="top-menu" />
      case 'settings': return <SettingsView />
      case 'profile': return <ProfileView />
      default: return <DashboardView stats={stats} />
    }
  }

  const mobileNavItems = sidebarItems.flatMap(item => item.subItems ? item.subItems.map(sub => ({ ...sub, parent: item.label })) : [item])

  const s = {
    root: { display:'flex', flexDirection: isMobile ? 'column' : 'row', minHeight:'100vh', height: isMobile ? 'auto' : '100vh', background:'#f8fafc', fontFamily:"'Inter',system-ui,sans-serif", overflow: isMobile ? 'visible' : 'hidden', width:'100%' },
    sidebar: { width:260, background:'#fff', borderRight:'1px solid #e2e8f0', flexShrink:0, display: isMobile ? 'none' : 'flex', flexDirection:'column', height:'100%' },
    logoArea: { height:64, display:'flex', alignItems:'center', padding:'0 24px', borderBottom:'1px solid #f1f5f9' },
    logoBox: { width:32, height:32, background:'#dc2626', color:'#fff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, marginRight:12 },
    logoText: { fontWeight:800, fontSize:18, letterSpacing:'-0.5px', color:'#0f172a' },
    navArea: { flex:1, overflowY:'auto', padding:'16px 12px' },
    navBtn: (active) => ({ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 16px', borderRadius:10, marginBottom:4, border:'none', background: active ? '#fee2e2' : 'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.2s', color: active ? '#dc2626' : '#64748b', fontWeight: active ? 700 : 600, fontSize:14 }),
    navIcon: (active) => ({ marginRight:12, flexShrink:0, color: active ? '#dc2626' : '#94a3b8' }),
    subMenu: { marginLeft:28, paddingLeft:12, borderLeft:'1px solid #e2e8f0', marginBottom:8, display:'flex', flexDirection:'column', gap:4 },
    subBtn: (active) => ({ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, width:'100%', padding:'8px 12px', borderRadius:6, fontSize:13, fontWeight: active ? 700 : 500, color: active ? '#dc2626' : '#64748b', border:'none', background: active ? '#fee2e2' : 'transparent', textAlign:'left', cursor:'pointer' }),
    countBadge: { minWidth:22, height:22, padding:'0 7px', borderRadius:999, background:'#dc2626', color:'#fff', fontSize:11, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center' },
    logoutArea: { padding:16, borderTop:'1px solid #f1f5f9' },
    logoutBtn: { width:'100%', display:'flex', alignItems:'center', padding:'10px 16px', fontSize:14, fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'none', borderRadius:10, cursor:'pointer' },
    main: { flex:1, display:'flex', flexDirection:'column', minHeight: isMobile ? 'auto' : '100%', height: isMobile ? 'auto' : '100%', overflow: isMobile ? 'visible' : 'hidden', width: isMobile ? '100%' : undefined },
    header: { minHeight:64, background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent:'space-between', gap: isMobile ? 14 : 20, padding: isMobile ? 16 : '0 24px', zIndex:10, flexDirection: isMobile ? 'column' : 'row', position: isMobile ? 'sticky' : 'static', top: 0 },
    searchBox: { display:'flex', alignItems:'center', background:'#f1f5f9', borderRadius:9999, padding:'8px 16px', width: isMobile ? '100%' : 320 },
    searchInput: { background:'transparent', border:'none', outline:'none', fontSize:13, marginLeft:8, width:'100%' },
    headerRight: { display:'flex', alignItems:'center', justifyContent: isMobile ? 'space-between' : undefined, gap:20 },
    avatar: { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#dc2626,#f97316)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 },
    scrollArea: { flex:1, overflowY: isMobile ? 'visible' : 'auto', overflowX:'hidden', padding: isMobile ? 16 : 32, background:'#f8fafc' },
    mobileNav: { display:'flex', gap:8, overflowX:'auto', padding:'12px 16px', background:'#fff', borderBottom:'1px solid #e2e8f0', position:'sticky', top: isMobile ? 126 : 0, zIndex:9, scrollbarWidth:'none' },
    mobileNavBtn: (active) => ({ flex:'0 0 auto', border:'1px solid ' + (active ? '#dc2626' : '#e2e8f0'), background: active ? '#fee2e2' : '#fff', color: active ? '#dc2626' : '#475569', borderRadius:999, padding:'9px 14px', fontSize:13, fontWeight: active ? 800 : 700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }),
  }

  return (
    <div style={s.root} id="admin-page-root">
      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoBox}>CB</div>
          <span style={s.logoText}>Admin<span style={{color:'#dc2626'}}>Panel</span></span>
        </div>
        <div style={s.navArea}>
          {sidebarItems.map(item => {
            const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab))
            return (
              <div key={item.id}>
                <button style={s.navBtn(isActive)} onClick={() => handleNavClick(item)}
                  onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#0f172a' }}}
                  onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' }}}>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <item.icon size={18} style={s.navIcon(isActive)} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'orders' && orderCounts['orders-new'] > 0 && <span style={s.countBadge}>{orderCounts['orders-new']}</span>}
                  {item.subItems && <ChevronDown size={14} onClick={(e) => { e.stopPropagation(); toggleSubmenu(item.id); }} style={{transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'none', transition:'transform 0.2s'}} />}
                </button>
                {item.subItems && expandedMenus[item.id] && (
                  <div style={s.subMenu}>
                    {item.subItems.map(sub => (
                      <button key={sub.id} style={s.subBtn(activeTab === sub.id)} onClick={() => setActiveTab(sub.id)}
                        onMouseEnter={e => { if(activeTab !== sub.id) e.currentTarget.style.background='#f1f5f9' }}
                        onMouseLeave={e => { if(activeTab !== sub.id) e.currentTarget.style.background='transparent' }}>
                        <span>{sub.label}</span>
                        {sub.id.startsWith('orders-') && orderCounts[sub.id] > 0 && <span style={s.countBadge}>{orderCounts[sub.id]}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={s.logoutArea}>
          <button style={s.logoutBtn} onClick={() => logout('admin')}>
            <LogOut size={16} style={{marginRight:12}} /> Logout Account
          </button>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={16} style={{color:'#94a3b8'}} />
            <input style={s.searchInput} placeholder="Search anything..." />
          </div>
          <div style={s.headerRight}>
            <div style={{position:'relative',cursor:'pointer'}}>
              <Bell size={20} style={{color:'#64748b'}} />
              <span style={{position:'absolute',top:-2,right:-2,width:8,height:8,background:'#dc2626',borderRadius:'50%'}}></span>
            </div>
            <div style={{height:32,width:1,background:'#e2e8f0'}}></div>
            <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>Admin Restaurant</div>
                <div style={{fontSize:12,color:'#64748b'}}>Superadmin</div>
              </div>
              <div style={s.avatar}>AR</div>
            </div>
          </div>
        </header>
        {isMobile && (
          <div style={s.mobileNav}>
            {mobileNavItems.map(item => (
              <button key={item.id} style={s.mobileNavBtn(activeTab === item.id)} onClick={() => setActiveTab(item.id)}>
                <span>{item.label}</span>
                {item.id.startsWith('orders-') && orderCounts[item.id] > 0 && <span style={s.countBadge}>{orderCounts[item.id]}</span>}
              </button>
            ))}
          </div>
        )}
        <main style={s.scrollArea}>
          <div style={{maxWidth: isMobile ? '100%' : 1200, margin:'0 auto', overflowX:'auto'}}>
            {renderContent()}
          </div>
        </main>
      </div>
      {newOrderNotice && (
        <button
          onClick={() => { setActiveTab('orders-new'); setExpandedMenus(prev => ({ ...prev, orders: true })); setNewOrderNotice(null) }}
          style={{
            position:'fixed',
            right:isMobile ? 16 : 24,
            bottom:isMobile ? 16 : 24,
            zIndex:9999,
            border:'1px solid #fecaca',
            background:'#fff',
            color:'#0f172a',
            borderRadius:16,
            padding:'14px 18px',
            boxShadow:'0 18px 45px rgba(15,23,42,0.18)',
            cursor:'pointer',
            textAlign:'left',
            minWidth:isMobile ? 'calc(100vw - 32px)' : 300,
          }}
        >
          <div style={{fontSize:13,fontWeight:900,color:'#dc2626',marginBottom:4}}>
            {newOrderNotice.count} pesanan baru masuk
          </div>
          <div style={{fontSize:13,color:'#475569'}}>
            {newOrderNotice.orderNumber && `#${newOrderNotice.orderNumber} - `}{newOrderNotice.customerName}
          </div>
        </button>
      )}
    </div>
  )
}
