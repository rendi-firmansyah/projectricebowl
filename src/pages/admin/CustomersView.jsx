import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/menuData'
import { Search, Mail, Phone } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  table: { width:'100%', borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, verticalAlign:'middle' },
}

export default function CustomersView() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/customers').then(r=>r.json()).then(d => { setCustomers(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><h1 style={cs.h1}>Pelanggan</h1><p style={cs.sub}>Daftar pelanggan Couple Bowl</p></div>
        <div style={{position:'relative',width:280}}>
          <Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
          <input style={{width:'100%',paddingLeft:40,paddingRight:16,paddingTop:10,paddingBottom:10,border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box'}} placeholder="Cari pelanggan..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      <div style={cs.card}>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>Pelanggan</th><th style={cs.th}>Email</th><th style={cs.th}>Telepon</th><th style={cs.th}>Total Belanja</th><th style={cs.th}>Bergabung</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Belum ada pelanggan.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={cs.td}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14}}>{c.name?.charAt(0)||'?'}</div>
                      <span style={{fontWeight:700}}>{c.name}</span>
                    </div>
                  </td>
                  <td style={cs.td}><div style={{display:'flex',alignItems:'center',gap:6}}><Mail size={14} style={{color:'#94a3b8'}}/>{c.email}</div></td>
                  <td style={cs.td}><div style={{display:'flex',alignItems:'center',gap:6}}><Phone size={14} style={{color:'#94a3b8'}}/>{c.phone}</div></td>
                  <td style={cs.td}><span style={{fontWeight:700,color:'#059669'}}>{formatPrice(c.total_spent)}</span></td>
                  <td style={{...cs.td,fontSize:12,color:'#94a3b8'}}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
