import { useRef, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, CreditCard, ArrowRight, Upload, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, optimizeImageUrl } from '../data/menuData'
import { buildItemNote, isCustomizableBowl, riceOptions, spiceOptions, toppingOptions } from '../data/orderOptions'

const paymentMethods = [
  { id: 'transfer', name: 'BCA Bank Transfer', icon: 'Bank', desc: 'Transfer manually & upload proof' },
  { id: 'gopay', name: 'GoPay QRIS', icon: 'QR', desc: 'Scan QRIS code & upload proof' },
  { id: 'cod', name: 'Cash on Delivery', icon: 'COD', desc: 'Pay with cash upon delivery' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    clearCart,
    updateItemNote,
    updateItemOptions,
    getItemUnitPrice,
    getItemLineTotal,
  } = useCart()
  const { user } = useAuth()
  
  const [selectedPayment, setSelectedPayment] = useState('transfer')
  const orderNoteRef = useRef(null)
  const itemNoteRefs = useRef({})
  
  const [copied, setCopied] = useState(false)
  const [proofImage, setProofImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '')
      setCustomerPhone(user.phone || '')
      setCustomerAddress(user.address || '')
    }
  }, [user])

  const toggleTopping = (item, topping) => {
    const currentToppings = item.customization?.toppings || []
    const exists = currentToppings.some(selected => selected.id === topping.id)
    updateItemOptions(item.cartKey, {
      toppings: exists
        ? currentToppings.filter(selected => selected.id !== topping.id)
        : [...currentToppings, topping],
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size is too large. Max size is 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Harap lengkapi Nama Penerima, Nomor Telepon, dan Alamat Pengiriman.')
      return
    }

    if (['transfer', 'gopay'].includes(selectedPayment) && !proofImage) {
      alert('Harap upload bukti transfer terlebih dahulu.')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        customer_name: customerName,
        customer_email: user?.email || '',
        customer_phone: customerPhone,
        address: customerAddress,
        note: orderNoteRef.current?.value || '',
        payment_method: selectedPayment,
        total: total,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: getItemUnitPrice(item),
          image: item.image,
          note: buildItemNote({
            ...item,
            note: itemNoteRefs.current[item.cartKey] ?? item.note ?? ''
          })
        })),
        proof_image: proofImage || null
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || errorData?.error || 'Failed to create order')
      }

      const result = await response.json()

      // Save latest order to sessionStorage for the success page
      sessionStorage.setItem('couple-bowl-latest-order', JSON.stringify(result))

      clearCart()
      setLoading(false)
      navigate('/order-success')
    } catch (error) {
      console.error('Order error:', error)
      alert(`Gagal membuat pesanan: ${error.message}`)
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-back-row">
          <Link to="/cart" style={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><ChevronLeft size={24} /><h1 style={{ fontSize: 20, fontWeight: 800 }}>Checkout</h1></Link>
        </div>
        <div className="empty-state"><p style={{ color: '#9CA3AF' }}>Your cart is empty</p><Link to="/menu" className="btn-primary" style={{ marginTop: 16 }}><span>Browse Menu</span></Link></div>
      </div>
    )
  }

  return (
    <div className="checkout-page animate-fade-in">
      <div className="checkout-back-row">
        <Link to="/cart" style={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <ChevronLeft size={24} /><h1 style={{ fontSize: 20, fontWeight: 800 }}>Checkout</h1>
        </Link>
      </div>

      <div className="checkout-layout">
        {/* Left Column */}
        <div className="checkout-forms-col">
          {/* Shipping & Contact Info */}
          <div className="checkout-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MapPin size={18} color="#DC2626" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Shipping & Contact Info</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>Nama Penerima</label>
                <input
                  type="text"
                  className="input-field"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama penerima"
                  style={{ fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>Nomor Telepon</label>
                <input
                  type="tel"
                  className="input-field"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon aktif"
                  style={{ fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>Alamat Pengiriman</label>
                <textarea
                  className="input-field"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Masukkan alamat pengiriman lengkap"
                  rows={2}
                  style={{ fontSize: 15, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="checkout-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Order Items</h3>
            {items.map(item => (
              <div key={item.cartKey || item.id} style={{ padding: '12px 0', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>x{item.quantity} | {formatPrice(getItemUnitPrice(item))} / porsi</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{formatPrice(getItemLineTotal(item))}</span>
                </div>

                {isCustomizableBowl(item) && (
                  <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Pilihan Nasi</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {riceOptions.map(option => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => updateItemOptions(item.cartKey, { rice: option })}
                            style={{
                              border: `1px solid ${(item.customization?.rice || 'Nasi Daun Jeruk') === option ? '#DC2626' : '#E5E7EB'}`,
                              background: (item.customization?.rice || 'Nasi Daun Jeruk') === option ? '#FEF2F2' : '#FFFFFF',
                              color: (item.customization?.rice || 'Nasi Daun Jeruk') === option ? '#DC2626' : '#374151',
                              borderRadius: 999,
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Level Pedas</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {spiceOptions.map(option => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => updateItemOptions(item.cartKey, { spice: option })}
                            style={{
                              border: `1px solid ${(item.customization?.spice || 'Tidak Pedas') === option ? '#DC2626' : '#E5E7EB'}`,
                              background: (item.customization?.spice || 'Tidak Pedas') === option ? '#FEF2F2' : '#FFFFFF',
                              color: (item.customization?.spice || 'Tidak Pedas') === option ? '#DC2626' : '#374151',
                              borderRadius: 999,
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Topping Tambahan</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {toppingOptions.map(topping => {
                          const selected = (item.customization?.toppings || []).some(option => option.id === topping.id)
                          return (
                            <button
                              type="button"
                              key={topping.id}
                              onClick={() => toggleTopping(item, topping)}
                              style={{
                                border: `1px solid ${selected ? '#DC2626' : '#E5E7EB'}`,
                                background: selected ? '#FEF2F2' : '#FFFFFF',
                                color: selected ? '#DC2626' : '#374151',
                                borderRadius: 10,
                                padding: '9px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {topping.name} +{formatPrice(topping.price)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={element => {
                    if (element) itemNoteRefs.current[item.cartKey] = element.value
                  }}
                  className="input-field"
                  defaultValue={item.note || ''}
                  onInput={e => {
                    itemNoteRefs.current[item.cartKey] = e.currentTarget.value
                  }}
                  onBlur={e => updateItemNote(item.cartKey, e.currentTarget.value)}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="Catatan tambahan, contoh: tanpa bawang, saus dipisah"
                  style={{ marginTop: 10, padding: '11px 12px', fontSize: 16 }}
                />
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="checkout-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Note (Optional)</h3>
            <textarea
              ref={orderNoteRef}
              className="input-field"
              placeholder="Add special instructions..."
              rows={3}
              style={{ resize: 'none', fontSize: 16 }}
            />
          </div>

          {/* Payment Method */}
          <div className="checkout-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Payment Method</h3>
            <div className="checkout-payment-grid">
              {paymentMethods.map(method => (
                <button key={method.id} onClick={() => { setSelectedPayment(method.id); setProofImage(null); }} className={`checkout-payment-option ${selectedPayment === method.id ? 'selected' : ''}`}>
                  <span style={{ fontSize: 28 }}>{method.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{method.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{method.desc}</div>
                  </div>
                  <div className="checkout-radio">
                    {selectedPayment === method.id && <div className="checkout-radio-dot" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Transfer Details / Upload Proof */}
            {['transfer', 'gopay'].includes(selectedPayment) && (
              <div className="animate-fade-in" style={{ marginTop: 20, borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Transfer Details</h3>
                <div className="bank-details-box">
                  {selectedPayment === 'transfer' ? (
                    <>
                      <div className="bank-row">
                        <span style={{ color: '#6B7280' }}>Bank Name:</span>
                        <span style={{ fontWeight: 700 }}>BCA (Bank Central Asia)</span>
                      </div>
                      <div className="bank-row">
                        <span style={{ color: '#6B7280' }}>Account Number:</span>
                        <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          7829103920
                          <button 
                            type="button"
                            onClick={() => { 
                              navigator.clipboard.writeText('7829103920'); 
                              setCopied(true); 
                              setTimeout(() => setCopied(false), 2000); 
                            }} 
                            className="bank-copy-btn"
                          >
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </span>
                      </div>
                      <div className="bank-row">
                        <span style={{ color: '#6B7280' }}>Account Name:</span>
                        <span style={{ fontWeight: 700 }}>Couple Bowl Indonesia</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bank-row">
                        <span style={{ color: '#6B7280' }}>QRIS Merchant:</span>
                        <span style={{ fontWeight: 700 }}>Couple Bowl Restaurant</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                        <div style={{ border: '2px solid #E5E7EB', padding: 12, borderRadius: 16, background: 'white', boxShadow: 'var(--shadow-card)' }}>
                          <div style={{ width: 140, height: 140, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12, borderRadius: 8 }}>
                            <span style={{ color: '#10B981', fontSize: 16, marginBottom: 4 }}>QRIS</span>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>Couple Bowl Indo</span>
                            <div style={{ width: 60, height: 60, border: '4px solid white', background: 'black', margin: '8px 0' }} />
                            <span style={{ fontSize: 8, opacity: 0.6 }}>NMID: ID102030405</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.4 }}>
                        Scan the QRIS code using GoPay, OVO, DANA, or any bank app.
                      </div>
                    </>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '20px 0 10px' }}>Upload Proof of Transfer</h3>
                {proofImage ? (
                  <div className="proof-preview-container">
                    <img src={proofImage} alt="Proof of transfer" className="proof-preview-img" />
                    <button type="button" onClick={() => setProofImage(null)} className="proof-remove-btn">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="proof-upload-zone" onClick={() => document.getElementById('proof-file-input').click()}>
                    <Upload size={24} style={{ color: '#9CA3AF', marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#4B5563' }}>Choose transfer receipt file</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Supports JPG, JPEG, PNG (Max 5MB)</p>
                    <input 
                      id="proof-file-input" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="checkout-summary-col">
          <div className="checkout-summary-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            <div className="checkout-summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="checkout-summary-row">
              <span>Delivery</span>
              <span style={{ color: deliveryFee === 0 ? '#10B981' : undefined }}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="checkout-summary-total"><span>Total</span><span style={{ color: '#DC2626' }}>{formatPrice(total)}</span></div>
            
            <button 
              onClick={handleOrder} 
              disabled={loading || (['transfer', 'gopay'].includes(selectedPayment) && !proofImage)} 
              className="btn-primary checkout-place-btn" 
              style={{ opacity: (loading || (['transfer', 'gopay'].includes(selectedPayment) && !proofImage)) ? 0.7 : 1 }}
            >
              <span>{loading ? 'Processing...' : 'Place Order'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
