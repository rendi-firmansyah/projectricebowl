import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Users, Activity, BarChart3, PieChart, ArrowUpRight, Package, Clock, CheckCircle2 } from 'lucide-react'
import { formatPrice, optimizeImageUrl } from '../../data/menuData'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  grid4: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:20, marginBottom:24 },
  grid2: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  statTitle: { fontSize:13, color:'#64748b', fontWeight:500, marginBottom:6 },
  statValue: { fontSize:24, fontWeight:800, letterSpacing:'-0.5px', color:'#0f172a' },
  trend: { fontSize:12, fontWeight:700, padding:'4px 8px', borderRadius:9999, background:'#ecfdf5', color:'#047857' },
}

export default function DashboardView({ stats }) {
  const [orders, setOrders] = useState([])
  const [topMenu, setTopMenu] = useState([])
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))

    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setDashboard(d))
      .catch(() => setDashboard(null))

    fetch('/api/menu')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          // Sort by reviews (as proxy for popularity)
          const sorted = [...d].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 4)
          setTopMenu(sorted)
        }
      })
      .catch(() => {})
  }, [])

  // Calculate real stats from orders
  const today = new Date().toDateString()
  const ordersToday = orders.filter(o => new Date(o.created_at).toDateString() === today).length
  const cookingOrders = orders.filter(o => o.status === 'Sedang Dimasak').length
  const readyOrders = orders.filter(o => o.status === 'Siap Diambil').length
  const revenueToday = dashboard?.revenueToday ?? orders
    .filter(o => new Date(o.created_at).toDateString() === today && o.status === 'Selesai')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
  const revenueMonth = dashboard?.revenueMonth ?? stats.revenueMonth
  const pendingPayments = dashboard?.pendingPayments ?? 0

  // Weekly sales data from orders (last 7 days)
  const weekDays = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const backendWeekly = Array.isArray(dashboard?.weeklySales) ? dashboard.weeklySales : []
  const weeklySales = last7Days.map(day => {
    const dayStr = day.toDateString()
    const backendDay = backendWeekly.find(item => new Date(item.order_date).toDateString() === dayStr)
    if (backendDay) {
      return {
        label: weekDays[day.getDay()],
        count: Number(backendDay.orders || 0),
        revenue: Number(backendDay.revenue || 0)
      }
    }
    const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dayStr)
    return {
      label: weekDays[day.getDay()],
      count: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    }
  })
  const maxSales = Math.max(...weeklySales.map(d => d.count), 1)

  const statCards = [
    { title:'Pendapatan Bulan Ini', value: formatPrice(revenueMonth), icon: DollarSign, bg:'#ecfdf5', iconColor:'#059669', trend:'Bulan ini' },
    { title:'Pendapatan Hari Ini', value: formatPrice(revenueToday), icon: TrendingUp, bg:'#eff6ff', iconColor:'#2563eb', trend:'+5.2%' },
    { title:'Pesanan Hari Ini', value: ordersToday, icon: ShoppingCart, bg:'#fff7ed', iconColor:'#ea580c', trend:'+2.1%' },
    { title:'Total Pelanggan', value: stats.totalCustomers, icon: Users, bg:'#faf5ff', iconColor:'#9333ea', trend:'+18.0%' },
  ]
  const topMenuToShow = Array.isArray(dashboard?.topMenu) && dashboard.topMenu.length > 0 ? dashboard.topMenu : topMenu
  const recentOrders = Array.isArray(dashboard?.recentOrders) && dashboard.recentOrders.length > 0 ? dashboard.recentOrders : orders.slice(0, 5)

  return (
    <div>
      <h1 style={cs.h1}>Dashboard Overview</h1>
      <p style={cs.sub}>Welcome back, here's what's happening with your store today.</p>

      <div style={cs.grid4}>
        {statCards.map((stat, i) => (
          <div key={i} style={cs.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div style={{padding:12,borderRadius:12,background:stat.bg}}>
                <stat.icon size={22} style={{color:stat.iconColor}} />
              </div>
              <span style={cs.trend}>{stat.trend}</span>
            </div>
            <div style={cs.statTitle}>{stat.title}</div>
            <div style={cs.statValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:24}}>
        {[
          {label:'Total Menu', value:`${stats.totalMenu} Items`, color:'#0f172a', icon: Package},
          {label:'Total Pesanan', value:`${stats.totalOrders} Orders`, color:'#0f172a', icon: ShoppingCart},
          {label:'Pembayaran Pending', value:`${pendingPayments} Pending`, color:'#dc2626', icon: Clock},
          {label:'Sedang Dimasak', value:`${cookingOrders} Orders`, color:'#ea580c', icon: Clock},
          {label:'Siap Diambil', value:`${readyOrders} Orders`, color:'#059669', icon: CheckCircle2},
        ].map((m,i) => (
          <div key={i} style={{...cs.card,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <m.icon size={16} style={{color:m.color,opacity:0.6}}/>
              <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>{m.label}</span>
            </div>
            <span style={{fontSize:18,fontWeight:800,color:m.color}}>{m.value}</span>
          </div>
        ))}
      </div>

      <div style={cs.grid2}>
        <div style={cs.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Grafik Pesanan (7 Hari Terakhir)</h3>
            <Activity size={18} style={{color:'#94a3b8'}} />
          </div>
          <div style={{height:200,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8}}>
            {weeklySales.map((d,i) => {
              const h = Math.max((d.count / maxSales) * 100, 8)
              return (
                <div key={i} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}} title={`${d.count} pesanan`}>
                  <div style={{fontSize:11,fontWeight:700,color:'#dc2626',marginBottom:4}}>{d.count > 0 ? d.count : ''}</div>
                  <div style={{width:'100%',borderRadius:'6px 6px 0 0',height:`${h}%`,background: d.count > 0 ? 'linear-gradient(180deg, #dc2626 0%, #fee2e2 100%)' : '#f1f5f9',transition:'height 0.3s ease',minHeight:4}}></div>
                  <span style={{fontSize:11,color:'#64748b',marginTop:8,fontWeight:600}}>{d.label}</span>
                </div>
              )
            })}
          </div>
          {orders.length === 0 && (
            <div style={{textAlign:'center',padding:'20px 0',fontSize:13,color:'#94a3b8'}}>
              Belum ada data pesanan untuk ditampilkan
            </div>
          )}
        </div>

        <div style={cs.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Menu Terlaris</h3>
            <span style={{fontSize:12,fontWeight:700,color:'#dc2626',background:'#fef2f2',padding:'4px 8px',borderRadius:6}}>Bulan Ini</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {topMenuToShow.length === 0 ? (
              <div style={{textAlign:'center',padding:20,color:'#94a3b8',fontSize:13}}>Memuat data menu...</div>
            ) : topMenuToShow.map((item,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:14}}>
                <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" style={{width:48,height:48,borderRadius:12,objectFit:'cover'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#64748b'}}>{item.sold || item.reviews || 0} terjual</div>
                </div>
                <div style={{width:32,height:32,borderRadius:'50%',background:i === 0 ? '#fef2f2' : '#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:i === 0 ? '#dc2626' : '#475569'}}>#{i+1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div style={{...cs.card, marginTop:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Pesanan Terbaru</h3>
            <span style={{fontSize:12,color:'#64748b'}}>5 terakhir</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}>
              <thead>
                <tr>
                  <th style={{padding:'10px 16px',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'}}>Order</th>
                  <th style={{padding:'10px 16px',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'}}>Customer</th>
                  <th style={{padding:'10px 16px',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'}}>Total</th>
                  <th style={{padding:'10px 16px',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const colors = {
                    'Selesai': {bg:'#ecfdf5',c:'#047857'},
                    'Sedang Dimasak': {bg:'#fefce8',c:'#a16207'},
                    'Siap Diambil': {bg:'#ecfdf5',c:'#047857'},
                    'Dibatalkan': {bg:'#fef2f2',c:'#b91c1c'},
                  }
                  const sc = colors[o.status] || {bg:'#f1f5f9',c:'#475569'}
                  return (
                    <tr key={o.id}>
                      <td style={{padding:'10px 16px',fontSize:14,fontWeight:700,borderBottom:'1px solid #f1f5f9'}}>#{o.order_number}</td>
                      <td style={{padding:'10px 16px',fontSize:14,borderBottom:'1px solid #f1f5f9'}}>{o.customer_name}</td>
                      <td style={{padding:'10px 16px',fontSize:14,fontWeight:700,color:'#dc2626',borderBottom:'1px solid #f1f5f9'}}>{formatPrice(o.total)}</td>
                      <td style={{padding:'10px 16px',borderBottom:'1px solid #f1f5f9'}}>
                        <span style={{display:'inline-flex',padding:'4px 10px',borderRadius:9999,fontSize:12,fontWeight:700,background:sc.bg,color:sc.c}}>{o.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
