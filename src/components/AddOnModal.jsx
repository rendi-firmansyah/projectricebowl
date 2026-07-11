import { useEffect, useRef, useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { formatPrice, optimizeImageUrl } from '../data/menuData'
import {
  buildItemNote,
  getDefaultCustomization,
  isCustomizableBowl,
  riceOptions,
  spiceOptions,
  toppingOptions,
} from '../data/orderOptions'

export default function AddOnModal({ item, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1)
  const [customization, setCustomization] = useState(() => getDefaultCustomization(item || {}))
  const noteRef = useRef('')
  const noteInputRef = useRef(null)

  useEffect(() => {
    if (!item) return
    setQuantity(1)
    setCustomization(getDefaultCustomization(item))
    noteRef.current = ''
    if (noteInputRef.current) {
      noteInputRef.current.value = ''
    }
  }, [item])

  if (!item) return null

  const isBowl = isCustomizableBowl(item)
  const toppingTotal = (customization.toppings || []).reduce((sum, topping) => sum + topping.price, 0)
  const unitTotal = Number(item.price || 0) + toppingTotal
  const lineTotal = unitTotal * quantity

  const toggleTopping = (topping) => {
    setCustomization(prev => {
      const current = prev.toppings || []
      const exists = current.some(selected => selected.id === topping.id)
      return {
        ...prev,
        toppings: exists
          ? current.filter(selected => selected.id !== topping.id)
          : [...current, topping],
      }
    })
  }

  const handleConfirm = () => {
    const configuredItem = {
      ...item,
      customization,
      note: noteRef.current,
    }

    onConfirm(configuredItem, quantity, buildItemNote(configuredItem))
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: 'min(560px, 100%)',
        maxHeight: '90vh',
        overflow: 'auto',
        background: '#FFFFFF',
        borderRadius: 18,
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 18, borderBottom: '1px solid #F1F5F9' }}>
          <img src={optimizeImageUrl(item.image, 140)} alt={item.name} style={{ width: 58, height: 58, borderRadius: 14, objectFit: 'cover' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{item.name}</div>
            <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 800 }}>{formatPrice(item.price)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{ width: 36, height: 36, borderRadius: 999, border: '1px solid #E5E7EB', background: '#FFFFFF', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18, display: 'grid', gap: 16 }}>
          {isBowl ? (
            <>
              <OptionGroup title="Pilihan Nasi">
                {riceOptions.map(option => (
                  <OptionButton
                    key={option}
                    selected={customization.rice === option}
                    onClick={() => setCustomization(prev => ({ ...prev, rice: option }))}
                  >
                    {option}
                  </OptionButton>
                ))}
              </OptionGroup>

              <OptionGroup title="Level Pedas">
                {spiceOptions.map(option => (
                  <OptionButton
                    key={option}
                    selected={customization.spice === option}
                    onClick={() => setCustomization(prev => ({ ...prev, spice: option }))}
                  >
                    {option}
                  </OptionButton>
                ))}
              </OptionGroup>

              <OptionGroup title="Topping Tambahan">
                {toppingOptions.map(topping => {
                  const selected = (customization.toppings || []).some(option => option.id === topping.id)
                  return (
                    <OptionButton key={topping.id} selected={selected} onClick={() => toggleTopping(topping)}>
                      {topping.name} +{formatPrice(topping.price)}
                    </OptionButton>
                  )
                })}
              </OptionGroup>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
              Menu ini tidak memiliki pilihan nasi khusus. Anda tetap bisa menambahkan catatan sebelum masuk ke keranjang.
            </div>
          )}

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 8 }}>Catatan Tambahan</div>
            <input
              ref={noteInputRef}
              className="input-field"
              defaultValue=""
              type="text"
              inputMode="text"
              autoComplete="off"
              onInput={event => {
                noteRef.current = event.currentTarget.value
              }}
              placeholder="Contoh: saus dipisah, tanpa bawang"
              style={{ padding: '12px 13px', fontSize: 16 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} className="qty-btn"><Minus size={14} /></button>
              <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 800 }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(value => value + 1)} className="qty-btn"><Plus size={14} /></button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>Total</div>
              <div style={{ fontSize: 18, color: '#DC2626', fontWeight: 900 }}>{formatPrice(lineTotal)}</div>
            </div>
          </div>

          <button type="button" onClick={handleConfirm} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
            <span>Tambah ke Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  )
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${selected ? '#DC2626' : '#E5E7EB'}`,
        background: selected ? '#FEF2F2' : '#FFFFFF',
        color: selected ? '#DC2626' : '#374151',
        borderRadius: 999,
        padding: '9px 12px',
        fontSize: 12,
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
