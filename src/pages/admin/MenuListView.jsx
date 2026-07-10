import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react'
import { formatPrice } from '../../data/menuData'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b' },
  addBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff' },
  toolbar: { padding:20, borderBottom:'1px solid #e2e8f0', display:'flex', gap:16, justifyContent:'space-between', alignItems:'center', background:'#fafafa' },
  searchWrap: { position:'relative', width:320 },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' },
  searchInput: { width:'100%', paddingLeft:40, paddingRight:16, paddingTop:10, paddingBottom:10, border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', background:'#fff' },
  filterWrap: { display:'flex', alignItems:'center', gap:8, padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff' },
  select: { background:'transparent', border:'none', outline:'none', fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' },
  table: { width:'100%', borderCollapse:'collapse', textAlign:'left' },
  th: { padding:'14px 24px', background:'#f8fafc', color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0' },
  td: { padding:'14px 24px', borderBottom:'1px solid #f1f5f9', fontSize:14, color:'#0f172a', verticalAlign:'middle' },
  badge: (bg, color) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }),
  iconBtn: (bg, color) => ({ padding:8, border:'none', borderRadius:8, cursor:'pointer', background:bg, color, display:'inline-flex', alignItems:'center' }),
}

export default function MenuListView({ onAdd, onEdit }) {
  const [menuList, setMenuList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [categories, setCategories] = useState([])

  const fetchMenu = () => {
    setLoading(true)
    fetch('/api/menu').then(r=>r.json()).then(data => { setMenuList(data); setLoading(false) }).catch(() => setLoading(false))
  }
  const fetchCategories = () => {
    fetch('/api/categories').then(r=>r.json()).then(data => setCategories(data)).catch(console.error)
  }
  useEffect(() => { fetchMenu(); fetchCategories(); }, [])

  const handleDelete = (id, name) => {
    if(window.confirm(`Hapus menu "${name}"?`)) {
      fetch(`/api/menu/${id}`, {method:'DELETE'}).then(() => fetchMenu()).catch(console.error)
    }
  }

  const filtered = menuList.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || m.category_id === filterCat
    return matchSearch && matchCat
  })

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><h1 style={cs.h1}>Daftar Menu</h1><p style={cs.sub}>Kelola menu hidangan restoran Anda</p></div>
        <button style={cs.addBtn} onClick={onAdd}><Plus size={16}/>Tambah Menu</button>
      </div>
      <div style={cs.card}>
        <div style={cs.toolbar}>
          <div style={cs.searchWrap}>
            <Search size={16} style={cs.searchIcon}/>
            <input style={cs.searchInput} placeholder="Cari nama menu..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={cs.filterWrap}>
            <Filter size={16} style={{color:'#64748b'}}/>
            <select style={cs.select} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>
              <th style={cs.th}>ID</th><th style={cs.th}>Menu Info</th><th style={cs.th}>Kategori</th><th style={cs.th}>Harga</th><th style={cs.th}>Status</th><th style={{...cs.th,textAlign:'right'}}>Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Memuat data menu...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{...cs.td,textAlign:'center',padding:40,color:'#94a3b8'}}>Tidak ada menu ditemukan.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={cs.td}><span style={{fontWeight:600,color:'#94a3b8'}}>#{item.id}</span></td>
                  <td style={cs.td}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <img src={item.image} alt={item.name} style={{width:44,height:44,borderRadius:10,objectFit:'cover',border:'1px solid #e2e8f0'}}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:'#0f172a',marginBottom:2}}>{item.name}</div>
                        <div style={{display:'flex',gap:4}}>
                          {(item.isPopular || item.is_popular) && <span style={cs.badge('#fff7ed','#c2410c')}>POPULAR</span>}
                          {(item.isNew || item.is_new) && <span style={cs.badge('#ecfdf5','#047857')}>NEW</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={cs.td}><span style={cs.badge('#f1f5f9','#475569')}>{item.category_id}</span></td>
                  <td style={cs.td}><span style={{fontWeight:700}}>{formatPrice(item.price)}</span></td>
                  <td style={cs.td}><span style={cs.badge(item.status==='Tersedia'?'#ecfdf5':'#fef2f2', item.status==='Tersedia'?'#047857':'#b91c1c')}>{item.status||'Tersedia'}</span></td>
                  <td style={{...cs.td,textAlign:'right'}}>
                    <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                      <button style={cs.iconBtn('#eff6ff','#2563eb')} onClick={() => onEdit(item)}><Edit2 size={15}/></button>
                      <button style={cs.iconBtn('#fef2f2','#dc2626')} onClick={()=>handleDelete(item.id,item.name)}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:'14px 24px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,color:'#64748b',background:'#fafafa'}}>
          <span>Menampilkan <b>{filtered.length}</b> dari <b>{menuList.length}</b> menu</span>
        </div>
      </div>
    </div>
  )
}
