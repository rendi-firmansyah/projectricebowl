import { useState, useEffect } from 'react'
import { Star, MessageSquare, Plus, Trash2, X, CheckCircle } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const cs = {
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
  addBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff' },
  iconBtn: (bg, color) => ({ padding:8, border:'none', borderRadius:8, background:bg, color, cursor:'pointer', display:'inline-flex', alignItems:'center' }),
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 },
  modal: { background:'#fff', borderRadius:16, width:'100%', maxWidth:480, padding:24, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box', marginBottom:16 },
  btn: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'1px solid #e2e8f0', background:bg, color }),
  toast: { position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'14px 24px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:10, zIndex:9999 },
}

export default function TestimonialsView() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const showSuccessToast = (msg) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const fetchTestimonials = () => {
    setLoading(true)
    apiFetch('/api/testimonials')
      .then(r => r.json())
      .then(d => { setTestimonials(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const resetForm = () => {
    setCustomerName('')
    setRating(5)
    setComment('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customerName || !comment) return
    setSaving(true)
    apiFetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName, rating, comment })
    })
      .then(r => r.json())
      .then(() => {
        setSaving(false)
        setShowModal(false)
        resetForm()
        fetchTestimonials()
        showSuccessToast('Testimoni berhasil ditambahkan!')
      })
      .catch(() => setSaving(false))
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus testimoni ini?')) {
      apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchTestimonials()
          showSuccessToast('Testimoni berhasil dihapus')
        })
        .catch(console.error)
    }
  }

  const renderStars = (r) => {
    return Array.from({length:5}, (_,i) => (
      <Star key={i} size={14} style={{color: i < r ? '#f59e0b' : '#e2e8f0', fill: i < r ? '#f59e0b' : 'none'}}/>
    ))
  }

  const renderStarPicker = () => {
    return Array.from({length:5}, (_,i) => (
      <Star 
        key={i} 
        size={24} 
        style={{
          color: i < rating ? '#f59e0b' : '#e2e8f0', 
          fill: i < rating ? '#f59e0b' : 'none',
          cursor:'pointer',
          transition:'transform 0.1s'
        }}
        onClick={() => setRating(i + 1)}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      />
    ))
  }

  // Calculate stats
  const avgRating = testimonials.length > 0 ? (testimonials.reduce((s,t) => s + t.rating, 0) / testimonials.length).toFixed(1) : '0.0'

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><h1 style={cs.h1}>Testimoni</h1><p style={cs.sub}>Ulasan dan testimoni pelanggan</p></div>
        <button style={cs.addBtn} onClick={() => setShowModal(true)}><Plus size={16}/>Tambah Testimoni</button>
      </div>

      {/* Stats */}
      {testimonials.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:20,display:'flex',alignItems:'center',gap:16}}>
            <div style={{padding:12,borderRadius:12,background:'#fefce8'}}><Star size={22} style={{color:'#f59e0b',fill:'#f59e0b'}}/></div>
            <div>
              <div style={{fontSize:13,color:'#64748b',fontWeight:500}}>Rata-rata Rating</div>
              <div style={{fontSize:24,fontWeight:800,color:'#0f172a'}}>{avgRating} <span style={{fontSize:14,fontWeight:500,color:'#64748b'}}>/ 5</span></div>
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:20,display:'flex',alignItems:'center',gap:16}}>
            <div style={{padding:12,borderRadius:12,background:'#eff6ff'}}><MessageSquare size={22} style={{color:'#2563eb'}}/></div>
            <div>
              <div style={{fontSize:13,color:'#64748b',fontWeight:500}}>Total Testimoni</div>
              <div style={{fontSize:24,fontWeight:800,color:'#0f172a'}}>{testimonials.length}</div>
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:20,display:'flex',alignItems:'center',gap:16}}>
            <div style={{padding:12,borderRadius:12,background:'#ecfdf5'}}><Star size={22} style={{color:'#059669',fill:'#059669'}}/></div>
            <div>
              <div style={{fontSize:13,color:'#64748b',fontWeight:500}}>Rating 5 Bintang</div>
              <div style={{fontSize:24,fontWeight:800,color:'#0f172a'}}>{testimonials.filter(t => t.rating === 5).length}</div>
            </div>
          </div>
        </div>
      )}

      <div style={cs.card}>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>Pelanggan</th><th style={cs.th}>Rating</th><th style={cs.th}>Ulasan</th><th style={cs.th}>Tanggal</th><th style={{...cs.th,textAlign:'right'}}>Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat data...</td></tr>
              ) : testimonials.length === 0 ? (
                <tr><td colSpan="5" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>
                  <div><MessageSquare size={32} style={{color:'#e2e8f0',marginBottom:12}}/></div>
                  <div style={{fontWeight:600}}>Belum ada testimoni</div>
                  <div style={{fontSize:13,marginTop:4}}>Klik "Tambah Testimoni" untuk menambah ulasan baru</div>
                </td></tr>
              ) : testimonials.map(t => (
                <tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={cs.td}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>{t.customer_name?.charAt(0)||'?'}</div>
                      <span style={{fontWeight:700}}>{t.customer_name}</span>
                    </div>
                  </td>
                  <td style={cs.td}><div style={{display:'flex',gap:2}}>{renderStars(t.rating)}</div></td>
                  <td style={{...cs.td,maxWidth:400}}><span style={{color:'#475569'}}>{t.comment}</span></td>
                  <td style={{...cs.td,fontSize:12,color:'#94a3b8'}}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</td>
                  <td style={{...cs.td,textAlign:'right'}}>
                    <button onClick={() => handleDelete(t.id)} style={cs.iconBtn('#fef2f2','#dc2626')} title="Hapus testimoni">
                      <Trash2 size={15}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && testimonials.length > 0 && (
          <div style={{padding:'14px 24px',borderTop:'1px solid #e2e8f0',background:'#fafafa',fontSize:13,color:'#64748b'}}>
            Total: <b>{testimonials.length}</b> testimoni
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={cs.modalOverlay}>
          <div style={cs.modal}>
            <div style={cs.modalTitle}>
              <span>Tambah Testimoni Baru</span>
              <X size={20} style={{cursor:'pointer',color:'#64748b'}} onClick={() => { setShowModal(false); resetForm() }}/>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label style={cs.label}>Nama Pelanggan *</label>
                <input style={cs.input} required placeholder="Misal: Budi Santoso" value={customerName} onChange={e => setCustomerName(e.target.value)}/>
              </div>
              <div>
                <label style={cs.label}>Rating</label>
                <div style={{display:'flex',gap:4,marginBottom:16}}>{renderStarPicker()}</div>
              </div>
              <div>
                <label style={cs.label}>Ulasan *</label>
                <textarea rows="4" style={{...cs.input,resize:'vertical'}} required placeholder="Tulis ulasan pelanggan..." value={comment} onChange={e => setComment(e.target.value)}></textarea>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
                <button type="button" style={cs.btn('#fff','#475569')} onClick={() => { setShowModal(false); resetForm() }}>Batal</button>
                <button type="submit" disabled={saving} style={cs.btn('#dc2626','#fff')}>
                  {saving ? 'Menyimpan...' : <><CheckCircle size={16}/>Simpan Testimoni</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div style={cs.toast}>
          <CheckCircle size={18}/>{toastMsg}
        </div>
      )}
    </div>
  )
}
