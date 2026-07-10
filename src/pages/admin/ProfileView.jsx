import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Save, Shield, Key } from 'lucide-react'

const cs = {
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:24 },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  saveBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff', marginTop:8 },
  sectionTitle: { fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #e2e8f0' },
}

export default function ProfileView() {
  const { user } = useAuth()

  return (
    <div>
      <h1 style={cs.h1}>Profil Admin</h1>
      <p style={cs.sub}>Kelola informasi akun administrator</p>
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <div style={cs.card}>
          <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#dc2626,#f97316)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:28}}>AR</div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>Admin Restaurant</div>
              <div style={{fontSize:14,color:'#64748b'}}>Superadmin</div>
              <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:8,padding:'4px 10px',borderRadius:9999,fontSize:12,fontWeight:700,background:'#ecfdf5',color:'#047857'}}><Shield size={12}/>Verified</div>
            </div>
          </div>
          <div style={cs.sectionTitle}>Informasi Akun</div>
          <div style={cs.grid2}>
            <div style={{marginBottom:16}}><label style={cs.label}>Nama Lengkap</label><input style={cs.input} defaultValue="Admin Restaurant"/></div>
            <div style={{marginBottom:16}}><label style={cs.label}>Email</label><input style={cs.input} defaultValue={user?.email || 'admin@couplebowl.id'}/></div>
            <div style={{marginBottom:16}}><label style={cs.label}>Nomor Telepon</label><input style={cs.input} defaultValue="+62 812-3456-7890"/></div>
            <div style={{marginBottom:16}}><label style={cs.label}>Role</label><input style={cs.input} defaultValue="Superadmin" disabled/></div>
          </div>
        </div>
        <div style={cs.card}>
          <div style={cs.sectionTitle}><Key size={18} style={{display:'inline',verticalAlign:'middle',marginRight:8}}/>Ubah Password</div>
          <div style={cs.grid2}>
            <div style={{marginBottom:16}}><label style={cs.label}>Password Lama</label><input type="password" style={cs.input} placeholder="********"/></div>
            <div style={{marginBottom:16}}><label style={cs.label}>Password Baru</label><input type="password" style={cs.input} placeholder="********"/></div>
          </div>
        </div>
        <button style={cs.saveBtn} onClick={() => alert('Profil disimpan! (Simulasi)')}><Save size={16}/>Simpan Perubahan</button>
      </div>
    </div>
  )
}
