import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Download, ReceiptText } from 'lucide-react'
import { formatPrice } from '../data/menuData'

const paymentLabels = {
  transfer: 'BCA Bank Transfer',
  gopay: 'GoPay QRIS',
  cod: 'Cash on Delivery',
}

export default function InvoicePage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    fetch(`/api/orders/number/${encodeURIComponent(orderNumber)}`)
      .then(async response => {
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.message || 'Invoice tidak ditemukan')
        return data
      })
      .then(data => {
        setOrder(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [orderNumber])

  const subtotal = useMemo(() => {
    if (!order?.items) return 0
    return order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  }, [order])

  const deliveryFee = Math.max(Number(order?.total || 0) - subtotal, 0)

  if (loading) {
    return (
      <div className="invoice-page">
        <div className="invoice-card">
          <p style={{ color: '#64748b' }}>Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="invoice-page">
        <div className="invoice-card">
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Invoice Tidak Tersedia</h1>
          <p style={{ color: '#64748b', marginBottom: 20 }}>{error || 'Order tidak ditemukan.'}</p>
          <Link to="/profile" className="btn-primary"><span>Kembali ke Profile</span></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <Link to="/profile" className="invoice-back">
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </Link>
        <button onClick={() => window.print()} className="invoice-print-btn">
          <Printer size={16} />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      <div className="invoice-card">
        <div className="invoice-header">
          <div>
            <div className="invoice-brand">
              <div className="invoice-logo">CB</div>
              <div>
                <h1>Couple Bowl</h1>
                <p>Fresh rice bowl restaurant</p>
              </div>
            </div>
          </div>
          <div className="invoice-title">
            <ReceiptText size={24} />
            <div>
              <h2>Invoice</h2>
              <p>#{order.order_number}</p>
            </div>
          </div>
        </div>

        <div className="invoice-meta-grid">
          <div>
            <span>Customer</span>
            <strong>{order.customer_name}</strong>
            <p>{order.customer_email || '-'}</p>
            <p>{order.customer_phone || '-'}</p>
          </div>
          <div>
            <span>Tanggal</span>
            <strong>{new Date(order.created_at).toLocaleString('id-ID')}</strong>
            <p>Status: {order.status}</p>
            <p>Pembayaran: {order.payment_status || (order.payment_method === 'cod' ? 'COD' : 'Pending')}</p>
          </div>
          <div>
            <span>Metode</span>
            <strong>{paymentLabels[order.payment_method] || order.payment_method || '-'}</strong>
            <p>{order.address || '-'}</p>
          </div>
        </div>

        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Catatan</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.item_note || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.note && (
          <div className="invoice-note">
            <strong>Catatan order:</strong> {order.note}
          </div>
        )}

        <div className="invoice-total-box">
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div><span>Delivery</span><strong>{deliveryFee > 0 ? formatPrice(deliveryFee) : 'Gratis'}</strong></div>
          <div className="invoice-grand-total"><span>Grand Total</span><strong>{formatPrice(order.total)}</strong></div>
        </div>

        <div className="invoice-footer">
          <p>Terima kasih sudah memesan di Couple Bowl.</p>
          <p>Invoice ini dibuat otomatis oleh sistem.</p>
        </div>
      </div>
    </div>
  )
}
