import { useState, useEffect } from 'react'
import { Save, Globe, Clock, MapPin, CheckCircle } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const cs = {
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:24 },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  saveBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff', marginTop:8 },
  saveBtnDisabled: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'not-allowed', border:'none', background:'#94a3b8', color:'#fff', marginTop:8 },
  sectionTitle: { fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #e2e8f0' },
  toast: { position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'14px 24px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:10, zIndex:9999 },
}

export default function SettingsView() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    apiFetch('/api/settings').then(r=>r.json()).then(d => { setSettings(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const updateField = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setSaving(true)
    apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then(r => r.json())
      .then(() => {
        setSaving(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      })
      .catch(() => {
        setSaving(false)
        alert('Gagal menyimpan pengaturan.')
      })
  }

  if (loading) return <div style={{textAlign:'center',padding:60,color:'#94a3b8'}}>Memuat pengaturan...</div>

  return (
    <div>
      <h1 style={cs.h1}>Pengaturan Website</h1>
      <p style={cs.sub}>Konfigurasi umum restoran Anda</p>
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <div style={cs.card}>
          <div style={cs.sectionTitle}><Globe size={18} style={{display:'inline',verticalAlign:'middle',marginRight:8}}/>Informasi Restoran</div>
          <div style={cs.grid2}>
            <div style={{marginBottom:16}}>
              <label style={cs.label}>Nama Restoran</label>
              <input style={cs.input} value={settings.website_name || ''} onChange={e => updateField('website_name', e.target.value)}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={cs.label}>Email</label>
              <input style={cs.input} value={settings.email || ''} onChange={e => updateField('email', e.target.value)}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={cs.label}>Nomor WhatsApp</label>
              <input style={cs.input} value={settings.whatsapp_number || ''} onChange={e => updateField('whatsapp_number', e.target.value)}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={cs.label}>Instagram</label>
              <input style={cs.input} value={settings.instagram || ''} onChange={e => updateField('instagram', e.target.value)}/>
            </div>
          </div>
        </div>
        <div style={cs.card}>
          <div style={cs.sectionTitle}><MapPin size={18} style={{display:'inline',verticalAlign:'middle',marginRight:8}}/>Alamat</div>
          <div style={{marginBottom:16}}>
            <label style={cs.label}>Alamat Lengkap</label>
            <textarea rows="3" style={{...cs.input,resize:'vertical'}} value={settings.address || ''} onChange={e => updateField('address', e.target.value)}></textarea>
          </div>
        </div>
        <div style={cs.card}>
          <div style={cs.sectionTitle}><Clock size={18} style={{display:'inline',verticalAlign:'middle',marginRight:8}}/>Jam Operasional</div>
          <div style={{marginBottom:16}}>
            <label style={cs.label}>Jam Operasional (misal: 10:00 - 22:00)</label>
            <input style={cs.input} value={settings.operational_hours || ''} onChange={e => updateField('operational_hours', e.target.value)} placeholder="10:00 - 22:00"/>
          </div>
        </div>
        <button style={saving ? cs.saveBtnDisabled : cs.saveBtn} onClick={handleSave} disabled={saving}>
          <Save size={16}/>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {showToast && (
        <div style={cs.toast}>
          <CheckCircle size={18}/>Pengaturan berhasil disimpan!
        </div>
      )}
    </div>
  )
}
