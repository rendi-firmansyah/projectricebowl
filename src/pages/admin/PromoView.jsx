import { useState, useEffect } from 'react'
import { Plus, Tag, Percent, Calendar, Trash2, X, CheckCircle } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  table: { width:'100%', borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
  badge: (bg,color) => ({ display:'inline-flex', padding:'4px 10px', borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }),
  addBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff' },
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 },
  modal: { background:'#fff', borderRadius:16, width:'100%', maxWidth:480, padding:24, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box', marginBottom:16 },
  btn: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'1px solid #e2e8f0', background:bg, color }),
  deleteBtn: (bg,color) => ({ padding:8, border:'none', borderRadius:8, cursor:'pointer', background:bg, color, display:'inline-flex', alignItems:'center' }),
}

export default function PromoView() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('percent')
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountNominal, setDiscountNominal] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchPromos = () => {
    setLoading(true)
    fetch('/api/promos').then(r=>r.json()).then(d => { setPromos(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPromos()
  }, [])

  const resetForm = () => {
    setName(''); setType('percent'); setDiscountPercent(''); setDiscountNominal(''); setMinPurchase(''); setStartDate(''); setEndDate('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    fetch('/api/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        discount_percent: type === 'percent' ? parseInt(discountPercent) || 0 : 0,
        discount_nominal: type === 'nominal' ? parseInt(discountNominal) || 0 : 0,
        min_purchase: parseInt(minPurchase) || 0,
        start_date: startDate || null,
        end_date: endDate || null,
      })
    })
      .then(r => r.json())
      .then(() => {
        setSaving(false)
        setShowModal(false)
        resetForm()
        fetchPromos()
      })
      .catch(() => setSaving(false))
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Hapus promo "${name}"?`)) {
      fetch(`/api/promos/${id}`, { method: 'DELETE' })
        .then(() => fetchPromos())
        .catch(console.error)
    }
  }

  const formatDiscount = (p) => {
    if (p.type === 'percent') return `${p.discount_percent}%`
    return `Rp ${Number(p.discount_nominal).toLocaleString('id-ID')}`
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><h1 style={cs.h1}>Promo & Diskon</h1><p style={cs.sub}>Kelola promo dan kupon diskon</p></div>
        <button style={cs.addBtn} onClick={() => setShowModal(true)}><Plus size={16}/>Tambah Promo</button>
      </div>
      <div style={cs.card}>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>Nama Promo</th><th style={cs.th}>Tipe</th><th style={cs.th}>Diskon</th><th style={cs.th}>Min. Belanja</th><th style={cs.th}>Periode</th><th style={cs.th}>Status</th><th style={{...cs.th, textAlign:'right'}}>Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat data...</td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan="7" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>
                  <div><Tag size={32} style={{color:'#e2e8f0',marginBottom:12}}/></div>
                  <div style={{fontWeight:600}}>Belum ada promo</div>
                  <div style={{fontSize:13,color:'#94a3b8',marginTop:4}}>Klik "Tambah Promo" untuk membuat promo baru</div>
                </td></tr>
              ) : promos.map(p => (
                <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={cs.td}><span style={{fontWeight:700}}>{p.name}</span></td>
                  <td style={cs.td}><span style={cs.badge(p.type==='percent'?'#eff6ff':'#fff7ed', p.type==='percent'?'#2563eb':'#c2410c')}><Percent size={12}/>{p.type === 'percent' ? 'Persen' : 'Nominal'}</span></td>
                  <td style={cs.td}><span style={{fontWeight:700,color:'#dc2626'}}>{formatDiscount(p)}</span></td>
                  <td style={cs.td}>Rp {Number(p.min_purchase).toLocaleString('id-ID')}</td>
                  <td style={{...cs.td,fontSize:12}}><div style={{display:'flex',alignItems:'center',gap:6}}><Calendar size={14} style={{color:'#94a3b8'}}/>{formatDate(p.start_date)} - {formatDate(p.end_date)}</div></td>
                  <td style={cs.td}><span style={cs.badge(p.status?'#ecfdf5':'#fef2f2', p.status?'#047857':'#b91c1c')}>{p.status ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td style={{...cs.td,textAlign:'right'}}>
                    <button style={cs.deleteBtn('#fef2f2','#dc2626')} onClick={() => handleDelete(p.id, p.name)}><Trash2 size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={cs.modalOverlay}>
          <div style={cs.modal}>
            <div style={cs.modalTitle}>
              <span>Tambah Promo Baru</span>
              <X size={20} style={{cursor:'pointer',color:'#64748b'}} onClick={() => { setShowModal(false); resetForm() }}/>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label style={cs.label}>Nama Promo *</label>
                <input style={cs.input} required placeholder="Misal: Diskon Spesial Weekend" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div>
                <label style={cs.label}>Tipe Diskon</label>
                <select style={cs.input} value={type} onChange={e=>setType(e.target.value)}>
                  <option value="percent">Persen (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>
              {type === 'percent' ? (
                <div>
                  <label style={cs.label}>Diskon Persen (%)</label>
                  <input type="number" style={cs.input} placeholder="10" value={discountPercent} onChange={e=>setDiscountPercent(e.target.value)}/>
                </div>
              ) : (
                <div>
                  <label style={cs.label}>Diskon Nominal (Rp)</label>
                  <input type="number" style={cs.input} placeholder="5000" value={discountNominal} onChange={e=>setDiscountNominal(e.target.value)}/>
                </div>
              )}
              <div>
                <label style={cs.label}>Minimum Belanja (Rp)</label>
                <input type="number" style={cs.input} placeholder="0" value={minPurchase} onChange={e=>setMinPurchase(e.target.value)}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={cs.label}>Tanggal Mulai</label>
                  <input type="date" style={cs.input} value={startDate} onChange={e=>setStartDate(e.target.value)}/>
                </div>
                <div>
                  <label style={cs.label}>Tanggal Berakhir</label>
                  <input type="date" style={cs.input} value={endDate} onChange={e=>setEndDate(e.target.value)}/>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
                <button type="button" style={cs.btn('#fff','#475569')} onClick={() => { setShowModal(false); resetForm() }}>Batal</button>
                <button type="submit" disabled={saving} style={cs.btn('#dc2626','#fff')}>
                  {saving ? 'Menyimpan...' : <><CheckCircle size={16}/>Simpan Promo</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
