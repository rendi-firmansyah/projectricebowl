import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Home, FileText, Hourglass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function OrderSuccessPage() {
  const { user } = useAuth()
  const [latestOrder, setLatestOrder] = useState(null)

  useEffect(() => {
    // Read from sessionStorage (set by CheckoutPage after API response)
    const savedOrder = sessionStorage.getItem('couple-bowl-latest-order')
    if (savedOrder) {
      try {
        setLatestOrder(JSON.parse(savedOrder))
      } catch (e) {
        console.error('Error parsing order:', e)
      }
    }
  }, [])

  const isPendingConfirmation = latestOrder?.status === 'Menunggu Pembayaran'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', background: 'white' }}>
      <div className="animate-scale-in" style={{ opacity: 0, animationFillMode: 'forwards' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: isPendingConfirmation ? '#F3E8FF' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          {isPendingConfirmation ? (
            <Hourglass size={50} color="#7E22CE" strokeWidth={2.5} style={{ animation: 'spin-slow 4s infinite linear' }} />
          ) : (
            <CheckCircle size={50} color="#10B981" strokeWidth={2.5} />
          )}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1F2937' }}>
          {isPendingConfirmation ? 'Menunggu Konfirmasi Admin' : 'Order Confirmed!'}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 1.6, maxWidth: 450, margin: '0 auto 12px' }}>
          {isPendingConfirmation 
            ? 'Bukti transfer Anda telah berhasil diunggah. Mohon tunggu verifikasi pembayaran dari Admin sebelum pesanan diproses.' 
            : 'Your order has been placed successfully and is being processed.'}
        </p>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>
          Order ID: {latestOrder?.order_number || 'CB-XXXX'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280, margin: '0 auto' }}>
          {latestOrder?.order_number && (
            <Link to={`/invoice/${latestOrder.order_number}`} className="btn-primary" style={{ width: '100%', padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <FileText size={18} /><span>Lihat Invoice</span>
            </Link>
          )}
          <Link to="/" className="btn-primary" style={{ width: '100%', padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Home size={18} /><span>Back to Home</span>
          </Link>
          <Link to="/profile" className="btn-outline" style={{ width: '100%', padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <FileText size={18} /><span>View Orders History</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
