import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Crown, Calendar, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatPrice } from '../../data/menuData'
import { apiFetch } from '../../lib/api'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  statTitle: { fontSize:13, color:'#64748b', fontWeight:500, marginBottom:6 },
  statValue: { fontSize:24, fontWeight:800, letterSpacing:'-0.5px', color:'#0f172a' },
  badge: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }),
  table: { width:'100%', borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
  emptyState: { textAlign:'center', padding:60, color:'#94a3b8' },
}

const statusColors = {
  'Selesai': {bg:'#ecfdf5',c:'#047857'},
  'Menunggu Pembayaran': {bg:'#fff7ed',c:'#c2410c'},
  'Diproses': {bg:'#eff6ff',c:'#2563eb'},
  'Sedang Dimasak': {bg:'#fefce8',c:'#a16207'},
  'Siap Diambil': {bg:'#ecfdf5',c:'#047857'},
  'Dibatalkan': {bg:'#fef2f2',c:'#b91c1c'},
}

// ===================== SALES REPORT =====================
function SalesReport() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const completedOrders = orders.filter(o => o.status === 'Selesai')
  const cancelledOrders = orders.filter(o => o.status === 'Dibatalkan')
  const pendingOrders = orders.filter(o => !['Selesai','Dibatalkan'].includes(o.status))
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0)

  // Group by date
  const salesByDate = {}
  orders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
    if (!salesByDate[date]) salesByDate[date] = { count: 0, revenue: 0, completed: 0, cancelled: 0 }
    salesByDate[date].count++
    if (o.status === 'Selesai') {
      salesByDate[date].revenue += Number(o.total || 0)
      salesByDate[date].completed++
    }
    if (o.status === 'Dibatalkan') salesByDate[date].cancelled++
  })

  const dateEntries = Object.entries(salesByDate).reverse().slice(0, 14)

  if (loading) return <div style={cs.emptyState}>Memuat data laporan...</div>

  return (
    <div>
      <h1 style={cs.h1}>Laporan Penjualan</h1>
      <p style={cs.sub}>Analisis performa penjualan restoran</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,marginBottom:24}}>
        {[
          {label:'Total Transaksi', value:orders.length, icon:ShoppingCart, bg:'#eff6ff', ic:'#2563eb'},
          {label:'Pesanan Selesai', value:completedOrders.length, icon:ArrowUpRight, bg:'#ecfdf5', ic:'#059669'},
          {label:'Pesanan Dibatalkan', value:cancelledOrders.length, icon:ArrowDownRight, bg:'#fef2f2', ic:'#dc2626'},
          {label:'Sedang Diproses', value:pendingOrders.length, icon:TrendingUp, bg:'#fff7ed', ic:'#ea580c'},
        ].map((s,i) => (
          <div key={i} style={cs.card}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{padding:10,borderRadius:10,background:s.bg}}><s.icon size={18} style={{color:s.ic}}/></div>
              <span style={cs.statTitle}>{s.label}</span>
            </div>
            <div style={cs.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      {dateEntries.length === 0 ? (
        <div style={{...cs.card, ...cs.emptyState}}>
          <ShoppingCart size={48} style={{color:'#e2e8f0',marginBottom:16}}/>
          <div style={{fontWeight:700,fontSize:16,color:'#475569',marginBottom:4}}>Belum Ada Data Penjualan</div>
          <div style={{fontSize:14}}>Data laporan akan muncul setelah ada pesanan masuk</div>
        </div>
      ) : (
        <div style={{...cs.card, padding:0, overflow:'hidden'}}>
          <div style={{padding:'20px 24px',borderBottom:'1px solid #e2e8f0'}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Rincian Penjualan per Hari</h3>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={cs.table}>
              <thead><tr>
                <th style={cs.th}>Tanggal</th>
                <th style={cs.th}>Jumlah Pesanan</th>
                <th style={cs.th}>Selesai</th>
                <th style={cs.th}>Dibatalkan</th>
                <th style={cs.th}>Pendapatan</th>
              </tr></thead>
              <tbody>
                {dateEntries.map(([date, data], i) => (
                  <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={cs.td}><div style={{display:'flex',alignItems:'center',gap:8}}><Calendar size={14} style={{color:'#94a3b8'}}/><span style={{fontWeight:600}}>{date}</span></div></td>
                    <td style={cs.td}><span style={{fontWeight:700}}>{data.count}</span></td>
                    <td style={cs.td}><span style={cs.badge('#ecfdf5','#047857')}>{data.completed}</span></td>
                    <td style={cs.td}><span style={cs.badge('#fef2f2','#b91c1c')}>{data.cancelled}</span></td>
                    <td style={cs.td}><span style={{fontWeight:700,color:'#059669'}}>{formatPrice(data.revenue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:'14px 24px',borderTop:'1px solid #e2e8f0',background:'#fafafa',fontSize:13,color:'#64748b',display:'flex',justifyContent:'space-between'}}>
            <span>Total: <b>{orders.length}</b> pesanan</span>
            <span>Total Pendapatan: <b style={{color:'#059669'}}>{formatPrice(totalRevenue)}</b></span>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== REVENUE REPORT =====================
function RevenueReport() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const completedOrders = orders.filter(o => o.status === 'Selesai')
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  // Group by month
  const revenueByMonth = {}
  completedOrders.forEach(o => {
    const monthKey = new Date(o.created_at).toLocaleDateString('id-ID', { month:'long', year:'numeric' })
    if (!revenueByMonth[monthKey]) revenueByMonth[monthKey] = { revenue: 0, count: 0 }
    revenueByMonth[monthKey].revenue += Number(o.total || 0)
    revenueByMonth[monthKey].count++
  })
  const monthEntries = Object.entries(revenueByMonth)
  const maxMonthRevenue = Math.max(...monthEntries.map(([,d]) => d.revenue), 1)

  // Group by payment method
  const byMethod = {}
  completedOrders.forEach(o => {
    const method = o.payment_method || 'Transfer'
    if (!byMethod[method]) byMethod[method] = { count: 0, revenue: 0 }
    byMethod[method].count++
    byMethod[method].revenue += Number(o.total || 0)
  })

  if (loading) return <div style={cs.emptyState}>Memuat data pendapatan...</div>

  return (
    <div>
      <h1 style={cs.h1}>Laporan Pendapatan</h1>
      <p style={cs.sub}>Ringkasan pendapatan restoran</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:24}}>
        <div style={cs.card}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{padding:10,borderRadius:10,background:'#ecfdf5'}}><DollarSign size={18} style={{color:'#059669'}}/></div>
            <span style={cs.statTitle}>Total Pendapatan</span>
          </div>
          <div style={{...cs.statValue, color:'#059669'}}>{formatPrice(totalRevenue)}</div>
        </div>
        <div style={cs.card}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{padding:10,borderRadius:10,background:'#eff6ff'}}><BarChart3 size={18} style={{color:'#2563eb'}}/></div>
            <span style={cs.statTitle}>Rata-rata per Pesanan</span>
          </div>
          <div style={cs.statValue}>{formatPrice(Math.round(avgOrderValue))}</div>
        </div>
        <div style={cs.card}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{padding:10,borderRadius:10,background:'#faf5ff'}}><ShoppingCart size={18} style={{color:'#9333ea'}}/></div>
            <span style={cs.statTitle}>Pesanan Selesai</span>
          </div>
          <div style={cs.statValue}>{completedOrders.length}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
        {/* Revenue by Month chart */}
        <div style={cs.card}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:20}}>Pendapatan per Bulan</h3>
          {monthEntries.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>Belum ada data pendapatan</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {monthEntries.map(([month, data], i) => (
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:14,fontWeight:600,color:'#334155'}}>{month}</span>
                    <span style={{fontSize:14,fontWeight:700,color:'#059669'}}>{formatPrice(data.revenue)}</span>
                  </div>
                  <div style={{height:8,background:'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:999,background:'linear-gradient(90deg,#dc2626,#f97316)',width:`${(data.revenue/maxMonthRevenue)*100}%`,transition:'width 0.5s ease'}}></div>
                  </div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>{data.count} pesanan selesai</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Payment Method */}
        <div style={cs.card}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:20}}>Metode Pembayaran</h3>
          {Object.entries(byMethod).length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>Belum ada data</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {Object.entries(byMethod).map(([method, data], i) => {
                const colors = ['#dc2626','#2563eb','#059669','#9333ea','#ea580c']
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'#f8fafc',borderRadius:12}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:colors[i % colors.length]}}></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>{method}</div>
                      <div style={{fontSize:12,color:'#64748b'}}>{data.count} transaksi</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:'#059669'}}>{formatPrice(data.revenue)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===================== TOP MENU REPORT =====================
function TopMenuReport() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/menu')
      .then(r => r.json())
      .then(d => { setMenuItems(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Sort by reviews (proxy for popularity) then rating
  const ranked = [...menuItems].sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
  const topByRating = [...menuItems].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5)

  if (loading) return <div style={cs.emptyState}>Memuat data menu...</div>

  return (
    <div>
      <h1 style={cs.h1}>Menu Terlaris</h1>
      <p style={cs.sub}>Ranking menu berdasarkan popularitas dan penilaian</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:24}}>
        {/* Top by sales/reviews */}
        <div style={cs.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Paling Banyak Dipesan</h3>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {ranked.slice(0, 5).map((item, i) => {
              const medalColors = ['#fbbf24','#94a3b8','#cd7f32','#64748b','#64748b']
              return (
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:14,padding:12,borderRadius:12,background: i === 0 ? '#fffbeb' : 'transparent',border: i === 0 ? '1px solid #fde68a' : '1px solid transparent'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background: i < 3 ? medalColors[i] : '#f1f5f9',color: i < 3 ? '#fff' : '#475569',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>#{i+1}</div>
                  <img src={item.image} alt={item.name} style={{width:44,height:44,borderRadius:10,objectFit:'cover',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                    <div style={{fontSize:12,color:'#64748b'}}>{item.reviews || 0} ulasan - Rating {item.rating || 0}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:'#dc2626'}}>{formatPrice(item.price)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top by rating */}
        <div style={cs.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Rating Tertinggi</h3>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {topByRating.map((item, i) => (
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:14,padding:12,borderRadius:12,background: i === 0 ? '#fef3c7' : 'transparent',border: i === 0 ? '1px solid #fde68a' : '1px solid transparent'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#fef2f2',color:'#dc2626',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>#{i+1}</div>
                <img src={item.image} alt={item.name} style={{width:44,height:44,borderRadius:10,objectFit:'cover',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#64748b'}}>{item.reviews || 0} ulasan</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:13,fontWeight:800,color:'#f59e0b'}}>Rating</span>
                  <span style={{fontSize:16,fontWeight:800,color:'#f59e0b'}}>{item.rating || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full ranking table */}
      <div style={{...cs.card, padding:0, overflow:'hidden'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #e2e8f0'}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Ranking Lengkap Semua Menu</h3>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>#</th>
              <th style={cs.th}>Menu</th>
              <th style={cs.th}>Kategori</th>
              <th style={cs.th}>Harga</th>
              <th style={cs.th}>Rating</th>
              <th style={cs.th}>Ulasan</th>
              <th style={cs.th}>Status</th>
            </tr></thead>
            <tbody>
              {ranked.map((item, i) => (
                <tr key={item.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={cs.td}><span style={{fontWeight:700,color: i < 3 ? '#dc2626' : '#94a3b8'}}>{i+1}</span></td>
                  <td style={cs.td}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <img src={item.image} alt={item.name} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{item.name}</div>
                        <div style={{display:'flex',gap:4,marginTop:2}}>
                          {(item.isPopular || item.is_popular) && <span style={cs.badge('#fff7ed','#c2410c')}>POPULAR</span>}
                          {(item.isNew || item.is_new) && <span style={cs.badge('#ecfdf5','#047857')}>NEW</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={cs.td}><span style={cs.badge('#f1f5f9','#475569')}>{item.category_id}</span></td>
                  <td style={cs.td}><span style={{fontWeight:700}}>{formatPrice(item.price)}</span></td>
                  <td style={cs.td}><span style={{fontWeight:700,color:'#f59e0b'}}>{item.rating || 0}</span></td>
                  <td style={cs.td}><span style={{fontWeight:600}}>{item.reviews || 0}</span></td>
                  <td style={cs.td}><span style={cs.badge(item.status==='Tersedia'?'#ecfdf5':'#fef2f2', item.status==='Tersedia'?'#047857':'#b91c1c')}>{item.status||'Tersedia'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ===================== MAIN EXPORT =====================
export default function ReportsView({ type }) {
  switch(type) {
    case 'sales': return <SalesReport />
    case 'revenue': return <RevenueReport />
    case 'top-menu': return <TopMenuReport />
    default: return <SalesReport />
  }
}
