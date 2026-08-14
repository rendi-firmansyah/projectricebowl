import { useState, useEffect } from 'react'
import { Upload, CheckCircle, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  btn: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'1px solid #e2e8f0', background:bg, color }),
  checkbox: { width:'auto', marginRight:8, transform:'scale(1.2)' },
  uploadPanel: { border:'1px solid #fecaca', borderRadius:18, background:'linear-gradient(135deg, #fff7f7 0%, #ffffff 58%)', overflow:'hidden', boxShadow:'0 14px 30px rgba(220,38,38,0.08)' },
  uploadHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'16px 18px', borderBottom:'1px solid #fee2e2' },
  uploadTitle: { display:'flex', alignItems:'center', gap:10, fontSize:15, fontWeight:800, color:'#0f172a' },
  uploadBadge: { fontSize:11, fontWeight:800, color:'#b91c1c', background:'#fee2e2', padding:'5px 9px', borderRadius:999, whiteSpace:'nowrap' },
  uploadBody: { display:'grid', gridTemplateColumns:'minmax(180px, 240px) 1fr', gap:18, padding:18, alignItems:'stretch' },
  previewBox: { minHeight:210, borderRadius:16, border:'1px dashed #fca5a5', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' },
  previewEmpty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'#94a3b8', textAlign:'center', padding:22 },
  uploadHint: { fontSize:12, color:'#64748b', lineHeight:1.45, marginTop:8 },
  fileButton: { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid #dc2626', background:'#dc2626', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' },
  clearImageBtn: { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'11px 16px', borderRadius:12, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', fontSize:13, fontWeight:800, cursor:'pointer' }
}

const getImageSourceLabel = (imageUrl) => {
  if (!imageUrl) return 'Belum ada gambar'
  if (imageUrl.startsWith('data:image/')) return 'File baru siap disimpan'
  if (imageUrl.startsWith('http')) return 'Menggunakan URL gambar'
  return 'Menggunakan gambar tersimpan'
}

export default function MenuFormView({ editItem, onSaveSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('rice-bowl')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [prepTime, setPrepTime] = useState('10 min')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPopular, setIsPopular] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [status, setStatus] = useState('Tersedia')

  // Fetch categories from DB
  useEffect(() => {
    fetch('/api/categories')
      .then(async r => {
        const data = await r.json().catch(() => [])
        if (!r.ok || !Array.isArray(data)) return []
        return data
      })
      .then(data => {
        setCategories(data)
        if (data.length > 0 && !editItem) {
          setCategoryId(data[0].id)
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error)
        setCategories([])
      })
  }, [editItem])

  // Populate data in edit mode
  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '')
      setCategoryId(editItem.category_id || '')
      setPrice(editItem.price || '')
      setOriginalPrice(editItem.original_price || '')
      setPrepTime(editItem.prep_time || '10 min')
      setDescription(editItem.description || '')
      setImageUrl(editItem.image || '')
      setIsPopular(editItem.is_popular === 1 || editItem.isPopular === true)
      setIsNew(editItem.is_new === 1 || editItem.isNew === true)
      setStatus(editItem.status || 'Tersedia')
    }
  }, [editItem])

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
    setLoading(true)

    const payload = {
      name,
      description,
      price: parseInt(price),
      original_price: originalPrice ? parseInt(originalPrice) : null,
      image: imageUrl,
      category_id: categoryId,
      is_popular: isPopular ? 1 : 0,
      is_new: isNew ? 1 : 0,
      prep_time: prepTime,
      status
    }

    const url = editItem 
      ? `/api/menu/${editItem.id}`
      : '/api/menu'
    
    const method = editItem ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async r => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.message || 'Gagal menyimpan menu');
        }
        return r.json();
      })
      .then(() => {
        setLoading(false)
        alert(editItem ? 'Menu berhasil diperbarui!' : 'Menu berhasil ditambahkan!')
        if (onSaveSuccess) onSaveSuccess()
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
        alert(err.message || 'Gagal menyimpan menu.')
      })
  }

  return (
    <div style={{maxWidth:720,margin:'0 auto'}}>
      <h1 style={cs.h1}>{editItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h1>
      <p style={cs.sub}>{editItem ? 'Ubah informasi menu yang sudah terdaftar' : 'Masukkan detail menu baru untuk restoran Anda'}</p>
      
      <form onSubmit={handleSubmit} style={cs.card}>
        <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
          
          <div style={cs.grid2}>
            <div>
              <label style={cs.label}>Nama Menu *</label>
              <input style={cs.input} required value={name} onChange={e=>setName(e.target.value)} placeholder="Misal: Nasi Goreng Spesial"/>
            </div>
            <div>
              <label style={cs.label}>Kategori *</label>
              <select style={cs.input} value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={cs.label}>Harga Jual (Rp) *</label>
              <input type="number" style={cs.input} required value={price} onChange={e=>setPrice(e.target.value)} placeholder="25000"/>
            </div>
            <div>
              <label style={cs.label}>Harga Sebelum Diskon (Rp - Opsional)</label>
              <input type="number" style={cs.input} value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} placeholder="Misal: 30000"/>
            </div>
            <div>
              <label style={cs.label}>Waktu Persiapan (misal: 10 min)</label>
              <input style={cs.input} value={prepTime} onChange={e=>setPrepTime(e.target.value)} placeholder="10 min"/>
            </div>
            <div>
              <label style={cs.label}>Status Menu</label>
              <select style={cs.input} value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="Tersedia">Tersedia</option>
                <option value="Habis">Habis</option>
              </select>
            </div>
          </div>

          <div style={{display:'flex', gap:24, marginTop:8}}>
            <label style={{display:'flex', alignItems:'center', cursor:'pointer', fontSize:14, fontWeight:600}}>
              <input type="checkbox" style={cs.checkbox} checked={isPopular} onChange={e=>setIsPopular(e.target.checked)}/>
              Tampilkan badge POPULAR
            </label>
            <label style={{display:'flex', alignItems:'center', cursor:'pointer', fontSize:14, fontWeight:600}}>
              <input type="checkbox" style={cs.checkbox} checked={isNew} onChange={e=>setIsNew(e.target.checked)}/>
              Tampilkan badge NEW
            </label>
          </div>

          <div>
            <label style={cs.label}>Deskripsi Hidangan</label>
            <textarea rows="3" style={{...cs.input,resize:'vertical'}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tulis deskripsi atau komposisi makanan..."></textarea>
          </div>

          <div style={cs.uploadPanel}>
            <div style={cs.uploadHeader}>
              <div style={cs.uploadTitle}>
                <ImageIcon size={18} style={{color:'#dc2626'}}/>
                <span>Foto Menu</span>
              </div>
              <span style={cs.uploadBadge}>{getImageSourceLabel(imageUrl)}</span>
            </div>
            <div style={cs.uploadBody} className="admin-menu-upload-body">
              <div style={cs.previewBox}>
                {imageUrl ? (
                  <img src={imageUrl} alt="Pratinjau menu" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ) : (
                  <div style={cs.previewEmpty}>
                    <ImageIcon size={34}/>
                    <div>
                      <div style={{fontWeight:800,color:'#64748b'}}>Belum ada foto</div>
                      <div style={{fontSize:12,marginTop:4}}>Upload gambar agar menu tampil lebih menarik</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14,justifyContent:'center'}}>
                <div>
                  <label style={cs.label}>Upload File Gambar</label>
                  <label style={cs.fileButton}>
                    <Upload size={16}/>
                    <span>{imageUrl ? 'Ganti Foto Menu' : 'Pilih Foto Menu'}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{display:'none'}}/>
                  </label>
                  <div style={cs.uploadHint}>Gunakan foto makanan yang terang dan jelas. Format JPG, PNG, atau WEBP.</div>
                </div>
                <div>
                  <label style={cs.label}>Atau Pakai URL Gambar</label>
                  <div style={{position:'relative'}}>
                    <LinkIcon size={16} style={{position:'absolute',left:14,top:14,color:'#94a3b8'}}/>
                    <input style={{...cs.input,paddingLeft:40,marginBottom:0}} placeholder="https://..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)}/>
                  </div>
                </div>
                {imageUrl && (
                  <button type="button" style={cs.clearImageBtn} onClick={() => setImageUrl('')}>
                    <X size={15}/>
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        <div style={{padding:'16px 24px',borderTop:'1px solid #e2e8f0',background:'#fafafa',display:'flex',justifyContent:'flex-end',gap:12}}>
          <button type="button" onClick={onCancel} style={cs.btn('#fff','#475569')}>Batal</button>
          <button type="submit" disabled={loading} style={cs.btn('#dc2626','#fff')}>
            {loading ? 'Menyimpan...' : <><CheckCircle size={16}/>Simpan Menu</>}
          </button>
        </div>
      </form>
    </div>
  )
}
