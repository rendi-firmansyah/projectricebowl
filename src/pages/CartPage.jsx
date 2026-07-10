import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice, optimizeImageUrl } from '../data/menuData'
import { isCustomizableBowl } from '../data/orderOptions'

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, totalItems, getItemUnitPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header"><h1 className="cart-title">Your Cart</h1></div>
        <div className="empty-state" style={{ minHeight: 400 }}>
          <ShoppingBag size={56} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h3>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>Add some delicious bowls to get started!</p>
          <Link to="/menu" className="btn-primary"><span>Browse Menu</span><ArrowRight size={16} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">Your Cart</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>{totalItems} items</p>
      </div>

      <div className="cart-layout">
        {/* Items Column */}
        <div className="cart-items-col">
          {items.map((item, i) => (
            <div key={item.cartKey || item.id} className="animate-fade-in cart-item" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
              <div className="cart-item-image">
                <img src={optimizeImageUrl(item.image, 180)} alt={item.name} loading="lazy" decoding="async" />
              </div>
              <div className="cart-item-info">
                <div className="cart-item-top">
                  <div>
                    <h3 className="cart-item-name">{item.name}</h3>
                    <p className="cart-item-desc">{item.description}</p>
                  </div>
                  <button onClick={() => removeItem(item.cartKey)} className="cart-item-remove"><Trash2 size={16} /></button>
                </div>
                {item.note && (
                  <div style={{fontSize:12,color:'#64748b',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'6px 8px',marginTop:8}}>
                    Catatan: {item.note}
                  </div>
                )}
                {isCustomizableBowl(item) && (
                  <div style={{fontSize:12,color:'#64748b',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:'6px 8px',marginTop:8,lineHeight:1.5}}>
                    Level: {item.customization?.spice || 'Tidak Pedas'}
                    {(item.customization?.toppings || []).length > 0 && (
                      <div>Topping: {item.customization.toppings.map(topping => topping.name).join(', ')}</div>
                    )}
                  </div>
                )}
                <div className="cart-item-bottom">
                  <p className="cart-item-price">{formatPrice(getItemUnitPrice(item))}</p>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}><Minus size={14} /></button>
                    <span className="cart-item-qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Column */}
        <div className="cart-summary-col">
          <div className="cart-summary">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            <div className="cart-summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="cart-summary-row">
              <span>Delivery</span>
              <span style={{ color: deliveryFee === 0 ? '#10B981' : undefined }}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
            </div>
            {deliveryFee > 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                Free delivery on orders above Rp100.000
              </div>
            )}
            <div className="cart-summary-total">
              <span>Total</span><span style={{ color: '#DC2626' }}>{formatPrice(total)}</span>
            </div>
            <Link to="/checkout" className="btn-primary cart-checkout-btn">
              <span><ShoppingBag size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Checkout</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
