import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Edit2, X, CheckCircle, Save } from 'lucide-react'

const cs = {
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' },
  h1: { fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '14px 24px', background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px 24px', borderBottom: '1px solid #f1f5f9', fontSize: 14, verticalAlign: 'middle' },
  input: { padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: 14 },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' },
  iconBtn: (bg, color) => ({ padding: 8, border: 'none', borderRadius: 8, background: bg, color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }),
  toast: { position: 'fixed', bottom: 24, right: 24, background: '#059669', color: '#fff', padding: '14px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 9999 },
}

export default function MenuCategoryView() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showSuccessToast = (msg) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const fetchCategories = () => {
    setLoading(true)
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { setCategories(d); setLoading(false); })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newId || !newName) return
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newId.toLowerCase().replace(/\s+/g, '-'), name: newName, icon: 'Utensils' })
    })
      .then(r => r.json())
      .then(() => {
        setNewId('')
        setNewName('')
        fetchCategories()
        showSuccessToast('Kategori berhasil ditambahkan!')
      })
      .catch(console.error)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Hapus kategori "${name}"?\n\nMenu yang terhubung ke kategori ini akan kehilangan referensi kategorinya.`)) {
      fetch(`/api/categories/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchCategories()
          showSuccessToast(`Kategori "${name}" berhasil dihapus`)
        })
        .catch(console.error)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditIcon(cat.icon || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditIcon('')
  }

  const saveEdit = (id) => {
    if (!editName.trim()) return
    fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, icon: editIcon || 'Utensils' })
    })
      .then(r => {
        if (r.ok) {
          cancelEdit()
          fetchCategories()
          showSuccessToast('Kategori berhasil diperbarui!')
        }
      })
      .catch(console.error)
  }

  return (
    <div>
      <h1 style={cs.h1}>Kategori Menu</h1>
      <p style={cs.sub}>Kelola kategori hidangan Couple Bowl</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div style={cs.card}>
          <table style={cs.table}>
            <thead>
              <tr>
                <th style={cs.th}>ID Kategori</th>
                <th style={cs.th}>Nama Kategori</th>
                <th style={cs.th}>Icon</th>
                <th style={{ ...cs.th, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ ...cs.td, textAlign: 'center', color: '#94a3b8', padding: 40 }}>Memuat data...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="4" style={{ ...cs.td, textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                  <div><Tag size={32} style={{ color: '#e2e8f0', marginBottom: 12 }} /></div>
                  <div style={{ fontWeight: 600 }}>Belum ada kategori</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Tambahkan kategori pertama menggunakan form di samping</div>
                </td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={cs.td}><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 13 }}>{cat.id}</span></td>
                  <td style={{ ...cs.td, fontWeight: 700 }}>
                    {editingId === cat.id ? (
                      <input
                        style={{ ...cs.input, width: '100%', boxSizing: 'border-box', padding: '6px 10px' }}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit() }}
                        autoFocus
                      />
                    ) : cat.name}
                  </td>
                  <td style={cs.td}>
                    {editingId === cat.id ? (
                      <input
                        style={{ ...cs.input, width: 80, padding: '6px 10px' }}
                        value={editIcon}
                        onChange={e => setEditIcon(e.target.value)}
                        placeholder="Icon"
                      />
                    ) : (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{cat.icon || '-'}</span>
                    )}
                  </td>
                  <td style={{ ...cs.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => saveEdit(cat.id)} style={cs.iconBtn('#ecfdf5', '#059669')} title="Simpan">
                            <Save size={15} />
                          </button>
                          <button onClick={cancelEdit} style={cs.iconBtn('#f1f5f9', '#64748b')} title="Batal">
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)} style={cs.iconBtn('#eff6ff', '#2563eb')} title="Edit kategori">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            style={cs.iconBtn('#fef2f2', '#dc2626')}
                            title="Hapus kategori"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && categories.length > 0 && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#fafafa', fontSize: 13, color: '#64748b' }}>
              Total: <b>{categories.length}</b> kategori
            </div>
          )}
        </div>

        <div style={{ ...cs.card, padding: 24, height: 'fit-content' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} style={{ color: '#dc2626' }} />Tambah Kategori Baru
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>ID Kategori (slug)</label>
              <input
                style={{ ...cs.input, width: '100%', boxSizing: 'border-box' }}
                required
                placeholder="misal: snack"
                value={newId}
                onChange={e => setNewId(e.target.value)}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Akan otomatis diformat: huruf kecil, spasi jadi strip</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Nama Kategori</label>
              <input
                style={{ ...cs.input, width: '100%', boxSizing: 'border-box' }}
                required
                placeholder="misal: Cemilan"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <button type="submit" style={{ ...cs.addBtn, justifyContent: 'center', marginTop: 8 }}>
              <Plus size={16} /> Tambah Kategori
            </button>
          </form>
        </div>
      </div>

      {showToast && (
        <div style={cs.toast}>
          <CheckCircle size={18} />{toastMsg}
        </div>
      )}
    </div>
  )
}
