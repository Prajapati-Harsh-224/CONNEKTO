import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { getOrder } from '../services/orderService.js'

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

  const paymentLabels = { CASH_ON_DELIVERY: 'Cash on Delivery', PAY_LATER: 'Pay Later', REQUEST_ORDER: 'Request Order' }
  return <section className="order-detail-page"><div className="order-detail-breadcrumb"><Link to="/dashboard/shop-owner/orders">Orders</Link><span aria-hidden="true">›</span><span>Supplier order</span></div><div className="order-detail-heading"><div><span className="section-kicker">Supplier order</span><h1>{order.id}</h1><p className="order-detail-supplier">{order.supplierName}</p></div><StatusBadge status={order.status} /></div><div className="order-detail-meta"><div><span>Order date</span><strong>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div><div><span>Subtotal</span><strong>Rs {Number(order.subtotal).toLocaleString('en-IN')}</strong></div><div><span>Delivery area</span><strong>{order.serviceArea || '—'}</strong></div><div><span>Payment method</span><strong>{paymentLabels[order.paymentMethod] || 'Request Order'}</strong></div></div><div className="order-detail-layout"><main className="order-detail-main"><section className="order-items-panel"><div className="order-detail-section-heading"><div><span className="section-kicker">Products</span><h2>Supplier order details</h2></div><span className="order-detail-item-count">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span></div><div className="order-detail-items-heading"><span>Product</span><span>Amount</span></div>{order.items.map((item) => {
    const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1)
    const isBox = unitsPerBox > 1
    const boxes = item.boxes || (isBox ? Math.floor(item.quantity / unitsPerBox) : item.quantity)
    const unitPrice = Number(String(item.unitPriceSnapshot || item.unitPrice || 0).replace(/[^0-9.]/g, ''))
    return (
      <div className="order-detail-item" key={item.productId}>
        <div>
          <strong>{item.productNameSnapshot || item.name}</strong>
          <span>
            {isBox
              ? `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} (${item.quantity} packets) × Rs ${unitPrice.toLocaleString('en-IN')}/packet`
              : `${item.quantity} units × Rs ${unitPrice.toLocaleString('en-IN')}`}
          </span>
        </div>
        <strong>Rs {Number(item.lineTotal).toLocaleString('en-IN')}</strong>
      </div>
    )
  })}<div className="order-detail-total"><span>Supplier subtotal</span><strong>Rs {Number(order.subtotal).toLocaleString('en-IN')}</strong></div></section></main><aside className="order-detail-side"><section className="timeline-panel"><div className="order-detail-section-heading"><div><span className="section-kicker">Status timeline</span><h2>Order progress</h2></div><StatusBadge status={order.status} /></div><StatusTimeline currentStatus={order.status} /></section><div className="order-detail-note"><strong>Order updates</strong><p>Status updates are managed by the supplier in a later workflow.</p></div></aside></div></section>
}
