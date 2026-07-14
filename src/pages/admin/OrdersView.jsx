import { useState, useEffect } from 'react'
import { formatPrice, optimizeImageUrl } from '../../data/menuData'
import { apiUrl, apiFetch } from '../../lib/api'
import { AlertCircle, Eye, X, CheckCircle, XCircle, ZoomIn, ZoomOut, ReceiptText } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  table: { width:'100%', minWidth:980, borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
  badge: (bg,color) => ({ display:'inline-flex', padding:'4px 10px', borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }),
  selectStatus: { padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, fontWeight:600, outline:'none', cursor:'pointer', background:'#fff' },
  iconBtn: (bg, color) => ({ padding:'6px 12px', border:'none', borderRadius:8, background:bg, color, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700 }),
  modalOverlay: { position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998, padding:24 },
  modal: { width:'min(920px, 100%)', maxHeight:'90vh', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(15,23,42,0.35)' },
  modalHeader: { padding:'16px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  modalBody: { padding:20, background:'#f8fafc', display:'flex', justifyContent:'center', overflow:'auto' },
  proofImg: { maxHeight:'70vh', objectFit:'contain', borderRadius:12, border:'1px solid #e2e8f0', background:'#fff' },
  textarea: { width:'100%', minHeight:72, padding:12, border:'1px solid #e2e8f0', borderRadius:10, outline:'none', resize:'vertical', fontSize:13 },
}

const statusColors = {
  'Menunggu Pembayaran': {bg:'#fff7ed',color:'#c2410c'},
  'Diproses': {bg:'#eff6ff',color:'#2563eb'},
  'Sedang Dimasak': {bg:'#fefce8',color:'#a16207'},
  'Siap Diambil': {bg:'#ecfdf5',color:'#047857'},
  'Sedang Diantar': {bg:'#e0e7ff',color:'#4338ca'},
  'Selesai': {bg:'#f0fdf4',color:'#15803d'},
  'Dibatalkan': {bg:'#fef2f2',color:'#b91c1c'},
}

const statusOptions = [
  'Menunggu Pembayaran',
  'Diproses',
  'Sedang Dimasak',
  'Siap Diambil',
  'Sedang Diantar',
  'Selesai',
  'Dibatalkan'
]

const nextStatusMap = {
  'Menunggu Pembayaran': 'Diproses',
  'Diproses': 'Sedang Dimasak',
  'Sedang Dimasak': 'Siap Diambil',
  'Siap Diambil': 'Selesai',
  'Sedang Diantar': 'Selesai',
}

export default function OrdersView({ filter, onOrdersChanged }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProof, setSelectedProof] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [proofZoom, setProofZoom] = useState(100)
  const [rejectReason, setRejectReason] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    setError('')
    apiFetch('/api/orders')
      .then(async r => {
        const data = await r.json().catch(() => null)
        if (!r.ok) {
          throw new Error(data?.message || 'Gagal memuat pesanan')
        }
        return data
      })
      .then(d => {
        setOrders(Array.isArray(d) ? d : [])
        setLoading(false)
        onOrdersChanged?.()
      })
      .catch(err => {
        setOrders([])
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = (id, newStatus) => {
    apiFetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(r => r.json())
      .then(() => fetchOrders())
      .catch(console.error)
  }

  const updatePaymentStatus = (paymentId, status, rejectionReason = '') => {
    apiFetch(`/api/payments/${paymentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason: rejectionReason })
    })
      .then(r => r.json())
      .then(() => {
        setSelectedProof(null)
        fetchOrders()
      })
      .catch(console.error)
  }

  const statusMap = {
    'orders-new': 'Menunggu Pembayaran',
    'orders-processing': 'Diproses',
    'orders-cooking': 'Sedang Dimasak',
    'orders-ready': 'Siap Diambil',
    'orders-completed': 'Selesai',
    'orders-cancelled': 'Dibatalkan'
  }

  const filtered = filter === 'orders-all' ? orders : orders.filter(o => o.status === statusMap[filter])
  const title = filter === 'orders-all' ? 'Semua Pesanan' : statusMap[filter] || 'Pesanan'
  const openProof = (order) => {
    setSelectedProof(order)
    setProofZoom(100)
    setRejectReason('')
  }

  return (
    <div>
      <h1 style={cs.h1}>{title}</h1>
      <p style={cs.sub}>Pantau dan kelola pesanan masuk secara real-time</p>
      <div style={cs.card}>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>Order ID</th>
              <th style={cs.th}>Customer</th>
              <th style={cs.th}>Total</th>
              <th style={cs.th}>Waktu</th>
              <th style={cs.th}>Status Saat Ini</th>
              <th style={cs.th}>Pembayaran</th>
              <th style={{...cs.th, textAlign:'right'}}>Ubah Status</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat pesanan...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{...cs.td,textAlign:'center',padding:40,color:'#dc2626'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,fontWeight:700}}>
                      <AlertCircle size={18} /> {error}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Belum ada pesanan dalam kategori ini.</td></tr>
              ) : filtered.map(o => {
                const sc = statusColors[o.status] || {bg:'#f1f5f9',color:'#475569'}
                return (
                  <tr key={o.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={cs.td}><span style={{fontWeight:700}}>#{o.order_number}</span></td>
                    <td style={cs.td}>
                      <div style={{fontWeight:600}}>{o.customer_name}</div>
                      <div style={{fontSize:12,color:'#64748b'}}>{o.customer_phone}</div>
                      <button onClick={() => setSelectedOrder(o)} style={{...cs.iconBtn('#f8fafc','#334155'),marginTop:8}}>
                        <Eye size={14}/>Detail Pesanan
                      </button>
                    </td>
                    <td style={cs.td}><span style={{fontWeight:700,color:'#dc2626'}}>{formatPrice(o.total)}</span></td>
                    <td style={{...cs.td,fontSize:12,color:'#94a3b8'}}>{new Date(o.created_at).toLocaleString()}</td>
                    <td style={cs.td}>
                      <span style={cs.badge(sc.bg,sc.color)}>{o.status}</span>
                    </td>
                    <td style={cs.td}>
                      {o.payment_method === 'transfer' || o.payment_method === 'gopay' ? (
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={cs.badge(o.payment_status === 'Verified' ? '#ecfdf5' : o.payment_status === 'Rejected' ? '#fef2f2' : '#fff7ed', o.payment_status === 'Verified' ? '#047857' : o.payment_status === 'Rejected' ? '#b91c1c' : '#c2410c')}>
                            {o.payment_status === 'Verified' ? 'Terverifikasi' : o.payment_status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                          </span>
                          {o.proof_image ? (
                            <button onClick={() => openProof(o)} style={cs.iconBtn('#f1f5f9','#334155')}>
                              <Eye size={14}/>Lihat Bukti
                            </button>
                          ) : (
                            <span style={{fontSize:12,color:'#94a3b8'}}>Belum upload</span>
                          )}
                        </div>
                      ) : (
                        <span style={cs.badge('#f1f5f9','#475569')}>COD</span>
                      )}
                    </td>
                    <td style={{...cs.td,textAlign:'right'}}>
                      <select 
                        style={cs.selectStatus} 
                        value={o.status} 
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {nextStatusMap[o.status] && (
                        <button
                          onClick={() => handleStatusChange(o.id, nextStatusMap[o.status])}
                          style={{...cs.iconBtn('#fee2e2','#dc2626'),marginTop:8,marginLeft:8}}
                        >
                          Lanjut ke {nextStatusMap[o.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProof && (
        <div style={cs.modalOverlay} onClick={() => setSelectedProof(null)}>
          <div style={cs.modal} onClick={e => e.stopPropagation()}>
            <div style={cs.modalHeader}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>Bukti Transfer</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Order #{selectedProof.order_number}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={() => setProofZoom(z => Math.max(60, z - 20))} style={cs.iconBtn('#f8fafc','#475569')}><ZoomOut size={16}/></button>
                <span style={{fontSize:12,fontWeight:700,color:'#64748b'}}>{proofZoom}%</span>
                <button onClick={() => setProofZoom(z => Math.min(220, z + 20))} style={cs.iconBtn('#f8fafc','#475569')}><ZoomIn size={16}/></button>
                <button onClick={() => setSelectedProof(null)} style={cs.iconBtn('#f8fafc','#475569')}>
                  <X size={16}/>Tutup
                </button>
              </div>
            </div>
            <div style={cs.modalBody}>
              <img src={apiUrl(selectedProof.proof_image)} alt="Bukti transfer" style={{...cs.proofImg,width:`${proofZoom}%`}} />
            </div>
            {selectedProof.payment_status === 'Pending' && selectedProof.payment_id && (
              <div style={{padding:16,borderTop:'1px solid #e2e8f0'}}>
                <textarea
                  style={cs.textarea}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Alasan jika bukti ditolak, contoh: nominal tidak sesuai / gambar tidak jelas"
                />
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                <button onClick={() => updatePaymentStatus(selectedProof.payment_id, 'Rejected', rejectReason)} style={cs.iconBtn('#fef2f2','#b91c1c')}>
                  <XCircle size={14}/>Tolak
                </button>
                <button onClick={() => updatePaymentStatus(selectedProof.payment_id, 'Verified')} style={cs.iconBtn('#ecfdf5','#047857')}>
                  <CheckCircle size={14}/>Verifikasi
                </button>
                </div>
              </div>
            )}
            {selectedProof.payment_status === 'Rejected' && selectedProof.rejection_reason && (
              <div style={{padding:16,borderTop:'1px solid #e2e8f0',fontSize:13,color:'#b91c1c',background:'#fef2f2'}}>
                Alasan ditolak: {selectedProof.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div style={cs.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div style={{...cs.modal,width:'min(760px, 100%)'}} onClick={e => e.stopPropagation()}>
            <div style={cs.modalHeader}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>Detail Pesanan</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Order #{selectedOrder.order_number}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={cs.iconBtn('#f8fafc','#475569')}>
                <X size={16}/>Tutup
              </button>
            </div>
            <div style={{padding:20}}>
              <button onClick={() => window.open(`/invoice/${selectedOrder.order_number}`, '_blank')} style={{...cs.iconBtn('#fee2e2','#dc2626'),marginBottom:14}}>
                <ReceiptText size={14}/>Buka Invoice
              </button>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:18}}>
                <div><div style={{fontSize:12,color:'#64748b'}}>Customer</div><div style={{fontWeight:800}}>{selectedOrder.customer_name}</div></div>
                <div><div style={{fontSize:12,color:'#64748b'}}>Metode</div><div style={{fontWeight:800}}>{selectedOrder.payment_method}</div></div>
                <div><div style={{fontSize:12,color:'#64748b'}}>Total</div><div style={{fontWeight:800,color:'#dc2626'}}>{formatPrice(selectedOrder.total)}</div></div>
              </div>
              {selectedOrder.note && (
                <div style={{padding:12,borderRadius:12,background:'#f8fafc',border:'1px solid #e2e8f0',marginBottom:16,fontSize:13}}>
                  Catatan order: {selectedOrder.note}
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(selectedOrder.items || []).map(item => (
                  <div key={item.id} style={{display:'flex',gap:12,alignItems:'center',border:'1px solid #e2e8f0',borderRadius:12,padding:12}}>
                    <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" style={{width:52,height:52,borderRadius:10,objectFit:'cover'}} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800}}>{item.quantity}x {item.name}</div>
                      {item.item_note && <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Catatan: {item.item_note}</div>}
                    </div>
                    <div style={{fontWeight:800,color:'#dc2626'}}>{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
