import { useState, useEffect } from 'react'
import { Upload, CheckCircle, X } from 'lucide-react'

const cs = {
  card: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' },
  h1: { fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 },
  sub: { fontSize:14, color:'#64748b', marginBottom:24 },
  label: { display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 },
  input: { width:'100%', padding:'12px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize:14, boxSizing:'border-box' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  btn: (bg,color) => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'1px solid #e2e8f0', background:bg, color }),
  checkbox: { width:'auto', marginRight:8, transform:'scale(1.2)' }
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
      .then(r => r.json())
      .then(data => {
        setCategories(data)
        if (data.length > 0 && !editItem) {
          setCategoryId(data[0].id)
        }
      })
      .catch(console.error)
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
      .then(r => r.json())
      .then(() => {
        setLoading(false)
        alert(editItem ? 'Menu berhasil diperbarui!' : 'Menu berhasil ditambahkan!')
        if (onSaveSuccess) onSaveSuccess()
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
        alert('Gagal menyimpan menu.')
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

          <div>
            <label style={cs.label}>Pilih File Gambar Menu</label>
            <input type="file" accept="image/*" style={cs.input} onChange={handleFileChange}/>
            <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',margin:'8px 0'}}>atau isi URL gambar langsung dibawah ini</div>
            <input style={cs.input} placeholder="https://..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)}/>
          </div>

          {imageUrl && (
            <div style={{textAlign:'center', background:'#f8fafc', padding:16, borderRadius:12, border:'1px solid #e2e8f0'}}>
              <div style={cs.label}>Pratinjau Gambar:</div>
              <img src={imageUrl} alt="Pratinjau" style={{maxHeight:180, maxWidth:'100%', objectFit:'contain', borderRadius:8}}/>
            </div>
          )}

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
