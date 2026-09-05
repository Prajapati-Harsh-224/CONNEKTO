import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { getOrder } from '../services/orderService.js'
import { findSupplier } from '../utils/supplierDemoData.js'

export default function ShopOwnerOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrder(orderId).then((response) => setOrder(response.data.order)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) return <LoadingState message="Loading order details..." />
  if (error) return <section className="order-detail-page"><p className="form-message error" role="alert">{error}</p><Link className="button secondary" to="/dashboard/shop-owner/orders">Back to orders</Link></section>
  if (!order) return <EmptyState title="Order not found" message="This supplier order is not available." />

  const supplier = findSupplier(order.supplierId)
  const paymentLabels = { CASH_ON_DELIVERY: 'Cash on Delivery', PAY_LATER: 'Pay Later', REQUEST_ORDER: 'Request Order' }
  return <section className="order-detail-page"><Link className="back-link" to="/dashboard/shop-owner/orders">← Back to orders</Link><div className="eyebrow">Supplier order</div><div className="order-detail-heading"><div><h1>{order.id}</h1><p className="muted">{order.supplierName}</p></div><StatusBadge status={order.status} /></div><div className="order-detail-meta"><div><span>Order date</span><strong>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div><div><span>Subtotal</span><strong>Rs {Number(order.subtotal).toLocaleString('en-IN')}</strong></div><div><span>Delivery area</span><strong>{order.serviceArea || supplier?.serviceAreas.join(', ') || 'Service area on file'}</strong></div><div><span>Payment method</span><strong>{paymentLabels[order.paymentMethod] || 'Request Order'}</strong></div></div><section className="order-items-panel"><span className="section-kicker">Products</span><h2>Supplier order details</h2>{order.items.map((item) => <div className="order-detail-item" key={item.productId}><div><strong>{item.productNameSnapshot}</strong><span>{item.quantity} × Rs {Number(String(item.unitPriceSnapshot).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}</span></div><strong>Rs {Number(item.lineTotal).toLocaleString('en-IN')}</strong></div>)}<div className="order-detail-total"><span>Supplier subtotal</span><strong>Rs {Number(order.subtotal).toLocaleString('en-IN')}</strong></div></section><section className="timeline-panel"><div className="section-kicker">Status timeline</div><h2>Order progress</h2><StatusTimeline currentStatus={order.status} /></section><p className="prototype-note">Status updates are managed by the supplier in a later workflow.</p></section>
}
