import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/menuData'
import { apiUrl, apiFetch } from '../../lib/api'
import { CreditCard, CheckCircle, XCircle, Clock, Eye, X, ZoomIn, ZoomOut } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  table: { width:'100%', minWidth:980, borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
  badge: (bg,color) => ({ display:'inline-flex', padding:'4px 10px', borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }),
  iconBtn: (bg, color) => ({ padding:'6px 12px', border:'none', borderRadius:8, background:bg, color, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700 }),
  toast: { position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'14px 24px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:10, zIndex:9999 },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998, padding:24 },
  modal: { width:'min(720px, 100%)', maxHeight:'90vh', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(15,23,42,0.35)' },
  modalHeader: { padding:'16px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  modalBody: { padding:20, background:'#f8fafc', display:'flex', justifyContent:'center', overflow:'auto' },
  proofImg: { maxHeight:'70vh', objectFit:'contain', borderRadius:12, border:'1px solid #e2e8f0', background:'#fff' },
  textarea: { width:'100%', minHeight:72, padding:12, border:'1px solid #e2e8f0', borderRadius:10, outline:'none', resize:'vertical', fontSize:13 },
}

const statusConfig = {
  'Pending': { bg:'#fff7ed', color:'#c2410c', icon: Clock },
  'Verified': { bg:'#ecfdf5', color:'#047857', icon: CheckCircle },
  'Rejected': { bg:'#fef2f2', color:'#b91c1c', icon: XCircle },
}

export default function PaymentsView() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [selectedProof, setSelectedProof] = useState(null)
  const [proofZoom, setProofZoom] = useState(100)
  const [rejectReason, setRejectReason] = useState('')

  const showSuccessToast = (msg) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const fetchPayments = () => {
    setLoading(true)
    apiFetch('/api/payments')
      .then(r => r.json())
      .then(d => { setPayments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const updateStatus = (id, status, rejectionReason = '') => {
    apiFetch(`/api/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason: rejectionReason })
    })
      .then(r => r.json())
      .then(() => {
        fetchPayments()
        showSuccessToast(`Pembayaran ${status === 'Verified' ? 'diverifikasi' : 'ditolak'}`)
      })
      .catch(console.error)
  }

  // Stats
  const pending = payments.filter(p => p.status === 'Pending').length
  const verified = payments.filter(p => p.status === 'Verified').length
  const rejected = payments.filter(p => p.status === 'Rejected').length
  const totalVerified = payments.filter(p => p.status === 'Verified').reduce((s, p) => s + Number(p.amount || 0), 0)
  const openProof = (payment) => {
    setSelectedProof(payment)
    setProofZoom(100)
    setRejectReason('')
  }

  return (
    <div>
      <h1 style={cs.h1}>Pembayaran</h1>
      <p style={cs.sub}>Riwayat transaksi pembayaran</p>

      {/* Stats */}
      {payments.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>Total Transaksi</span>
            <span style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{payments.length}</span>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>Menunggu</span>
            <span style={{fontSize:18,fontWeight:800,color:'#c2410c'}}>{pending}</span>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>Terverifikasi</span>
            <span style={{fontSize:18,fontWeight:800,color:'#047857'}}>{verified}</span>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>Total Diverifikasi</span>
            <span style={{fontSize:16,fontWeight:800,color:'#059669'}}>{formatPrice(totalVerified)}</span>
          </div>
        </div>
      )}

      <div style={cs.card}>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>ID Transaksi</th><th style={cs.th}>Order</th><th style={cs.th}>Metode</th><th style={cs.th}>Jumlah</th><th style={cs.th}>Status</th><th style={cs.th}>Bukti</th><th style={cs.th}>Waktu</th><th style={{...cs.th,textAlign:'right'}}>Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat data...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="8" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>
                  <div><CreditCard size={32} style={{color:'#e2e8f0',marginBottom:12}}/></div>
                  <div style={{fontWeight:600}}>Belum ada transaksi pembayaran</div>
                </td></tr>
              ) : payments.map(p => {
                const sc = statusConfig[p.status] || statusConfig['Pending']
                return (
                  <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={cs.td}><span style={{fontWeight:700,fontFamily:'monospace'}}>#{p.id}</span></td>
                    <td style={cs.td}>#{p.order_number || p.order_id}</td>
                    <td style={cs.td}><span style={cs.badge('#eff6ff','#2563eb')}>{p.payment_method || 'Transfer'}</span></td>
                    <td style={cs.td}><span style={{fontWeight:700,color:'#059669'}}>{formatPrice(p.amount)}</span></td>
                    <td style={cs.td}>
                      <span style={{...cs.badge(sc.bg,sc.color),display:'inline-flex',alignItems:'center',gap:4}}>
                        <sc.icon size={12}/>{p.status === 'Verified' ? 'Terverifikasi' : p.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </td>
                    <td style={cs.td}>
                      {p.proof_image ? (
                        <button onClick={() => openProof(p)} style={cs.iconBtn('#f1f5f9','#334155')}>
                          <Eye size={14}/>Lihat Bukti
                        </button>
                      ) : (
                        <span style={{fontSize:12,color:'#94a3b8'}}>Tidak ada</span>
                      )}
                    </td>
                    <td style={{...cs.td,fontSize:12,color:'#94a3b8'}}>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                    <td style={{...cs.td,textAlign:'right'}}>
                      {p.status === 'Pending' ? (
                        <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
                          <button onClick={() => updateStatus(p.id, 'Verified')} style={cs.iconBtn('#ecfdf5','#047857')}>
                            <CheckCircle size={14}/>Verifikasi
                          </button>
                          <button onClick={() => { openProof(p); setRejectReason('') }} style={cs.iconBtn('#fef2f2','#b91c1c')}>
                            <XCircle size={14}/>Tolak
                          </button>
                        </div>
                      ) : (
                        <span style={{fontSize:12,color:'#94a3b8'}}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && payments.length > 0 && (
          <div style={{padding:'14px 24px',borderTop:'1px solid #e2e8f0',background:'#fafafa',fontSize:13,color:'#64748b'}}>
            Total: <b>{payments.length}</b> transaksi
          </div>
        )}
      </div>

      {showToast && (
        <div style={cs.toast}>
          <CheckCircle size={18}/>{toastMsg}
        </div>
      )}

      {selectedProof && (
        <div style={cs.modalOverlay} onClick={() => setSelectedProof(null)}>
          <div style={cs.modal} onClick={e => e.stopPropagation()}>
            <div style={cs.modalHeader}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>Bukti Transfer</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Order #{selectedProof.order_number || selectedProof.order_id}</div>
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
            {selectedProof.status === 'Pending' && (
              <div style={{padding:16,borderTop:'1px solid #e2e8f0'}}>
                <textarea
                  style={cs.textarea}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Alasan jika bukti ditolak, contoh: nominal tidak sesuai / gambar tidak jelas"
                />
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                <button onClick={() => { updateStatus(selectedProof.id, 'Rejected', rejectReason); setSelectedProof(null); }} style={cs.iconBtn('#fef2f2','#b91c1c')}>
                  <XCircle size={14}/>Tolak
                </button>
                <button onClick={() => { updateStatus(selectedProof.id, 'Verified'); setSelectedProof(null); }} style={cs.iconBtn('#ecfdf5','#047857')}>
                  <CheckCircle size={14}/>Verifikasi
                </button>
                </div>
              </div>
            )}
            {selectedProof.status === 'Rejected' && selectedProof.rejection_reason && (
              <div style={{padding:16,borderTop:'1px solid #e2e8f0',fontSize:13,color:'#b91c1c',background:'#fef2f2'}}>
                Alasan ditolak: {selectedProof.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
