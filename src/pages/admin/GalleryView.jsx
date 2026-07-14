import { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon, X, Trash2, CheckCircle } from 'lucide-react'

const cs = {
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  addBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none', background:'#dc2626', color:'#fff' },
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyOrigin:'center', justifyContent:'center', zIndex:999, padding:20 },
  modal: { background:'#fff', borderRadius:16, width:'100%', maxWidth:480, padding:24, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box', marginBottom:16 },
  btn: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'1px solid #e2e8f0', background:bg, color }),
  deleteBtn: { position:'absolute', top:8, right:8, padding:8, background:'rgba(255,255,255,0.9)', color:'#dc2626', border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }
}

export default function GalleryView() {
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('food')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetchGallery = () => {
    setLoading(true)
    fetch('/api/gallery')
      .then(r=>r.json())
      .then(d => { setGallery(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchGallery()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!imageUrl) return alert('Silakan pilih file gambar atau isi URL gambar')
    setUploading(true)
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, image_url: imageUrl })
    })
      .then(r => r.json())
      .then(() => {
        setTitle('')
        setImageUrl('')
        setShowModal(false)
        setUploading(false)
        fetchGallery()
      })
      .catch(() => setUploading(false))
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus foto ini dari galeri?')) {
      fetch(`/api/gallery/${id}`, { method: 'DELETE' })
        .then(() => fetchGallery())
        .catch(console.error)
    }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><h1 style={cs.h1}>Galeri</h1><p style={cs.sub}>Kelola foto galeri restoran</p></div>
        <button style={cs.addBtn} onClick={() => setShowModal(true)}><Plus size={16}/>Upload Foto</button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'#94a3b8'}}>Memuat galeri...</div>
      ) : gallery.length === 0 ? (
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:60,textAlign:'center'}}>
          <ImageIcon size={48} style={{color:'#e2e8f0',marginBottom:16}}/>
          <div style={{fontWeight:700,fontSize:16,color:'#475569',marginBottom:4}}>Galeri Kosong</div>
          <div style={{fontSize:14,color:'#94a3b8'}}>Klik "Upload Foto" untuk menambah foto baru</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:20}}>
          {gallery.map(img => (
            <div key={img.id} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,overflow:'hidden',position:'relative'}}>
              <button style={cs.deleteBtn} onClick={() => handleDelete(img.id)}><Trash2 size={14}/></button>
              <img src={img.image_url} alt={img.title||''} style={{width:'100%',height:200,objectFit:'cover'}}/>
              <div style={{padding:16}}>
                <div style={{fontWeight:700,fontSize:14,color:'#0f172a'}}>{img.title || 'Gambar Galeri'}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  <span style={{fontSize:11,fontWeight:700,background:'#f1f5f9',color:'#475569',padding:'2px 8px',borderRadius:4,textTransform:'uppercase'}}>{img.type}</span>
                  <span style={{fontSize:12,color:'#94a3b8'}}>{img.created_at ? new Date(img.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={cs.modalOverlay}>
          <div style={cs.modal}>
            <div style={cs.modalTitle}>
              <span>Upload Foto Baru</span>
              <X size={20} style={{cursor:'pointer',color:'#64748b'}} onClick={() => setShowModal(false)}/>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label style={cs.label}>Judul/Caption</label>
                <input style={cs.input} placeholder="Misal: Suasana Restoran Malam Hari" value={title} onChange={e=>setTitle(e.target.value)}/>
              </div>
              <div>
                <label style={cs.label}>Tipe Foto</label>
                <select style={cs.input} value={type} onChange={e=>setType(e.target.value)}>
                  <option value="food">Makanan/Menu</option>
                  <option value="restaurant">Restoran/Suasana</option>
                  <option value="banner">Banner Depan</option>
                </select>
              </div>
              <div>
                <label style={cs.label}>Pilih File Gambar</label>
                <input type="file" accept="image/*" style={cs.input} onChange={handleFileChange}/>
              </div>
              <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginBottom:16}}>atau isi URL gambar langsung dibawah ini</div>
              <div>
                <label style={cs.label}>URL Gambar</label>
                <input style={cs.input} placeholder="https://..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)}/>
              </div>

              {imageUrl && (
                <div style={{marginBottom:16,textAlign:'center'}}>
                  <label style={cs.label}>Pratinjau:</label>
                  <img src={imageUrl} alt="preview" style={{width:'100%',maxHeight:150,objectFit:'contain',borderRadius:8,border:'1px solid #e2e8f0'}}/>
                </div>
              )}

              <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:20}}>
                <button type="button" style={cs.btn('#fff','#475569')} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" disabled={uploading} style={cs.btn('#dc2626','#fff')}>
                  {uploading ? 'Menyimpan...' : <><CheckCircle size={16}/>Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
