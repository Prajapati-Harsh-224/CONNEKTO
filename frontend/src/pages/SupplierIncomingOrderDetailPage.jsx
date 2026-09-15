import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrder, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const statusTransitions = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
}

function normalizeOrder(order) {
  return {
    ...order,
    customer: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    shopOwner: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    phone: order.shopOwnerPhone || '',
    address: order.shopAddress || '',
    date: order.createdAt,
    subtotal: Number(order.subtotal || 0),
    total: Number(order.subtotal || 0),
    items: (order.items || []).map((item) => ({
      ...item,
      product: item.productNameSnapshot || item.name || 'Product',
      sku: item.productId,
      unitPrice: item.unitPriceSnapshot,
      total: item.lineTotal,
    })),
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SupplierIncomingOrderDetailPage() {
  const { orderId } = useParams()
  const { t } = useLocale()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')
    setStatusError('')
    setOrder(null)

    getSupplierOrder(orderId)
      .then((response) => {
        if (isMounted) setOrder(response?.data?.order ? normalizeOrder(response.data.order) : null)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [orderId])

  const items = useMemo(() => order?.items || [], [order])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.total || item.unitPrice * item.quantity || 0), 0), [items])
  const total = Number(order?.total ?? order?.subtotal ?? subtotal ?? 0)

  async function updateStatus(event) {
    const nextStatus = event.target.value
    if (!nextStatus || !order) return
    setStatusError('')
    setIsUpdating(true)

    try {
      const response = await updateSupplierOrderStatus(order.id, nextStatus)
      setOrder(normalizeOrder(response?.data?.order || { ...order, status: nextStatus }))
    } catch (requestError) {
      setStatusError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingIncomingOrders')} />
  if (error) return <section className="order-detail-page"><p className="form-message error" role="alert">{error}</p><Link className="button secondary" to="/dashboard/supplier/orders">{t('backToIncomingOrders')}</Link></section>
  if (!order) return <EmptyState title={t('orderNotFound')} message={t('orderUnavailable')} />

  const customerName = order.customer || order.shopOwner || 'Shop owner'

  return (
    <section className="supplier-order-detail-page">
      <div className="orders-breadcrumb">
        <span>{t('supplier')}</span>
        <span>›</span>
        <span>{t('orders')}</span>
        <span>›</span>
        <span>Order #{order.id || order.orderId}</span>
      </div>

      <div className="supplier-detail-header-row">
        <div className="supplier-detail-header-copy">
          <p className="supplier-detail-eyebrow">Supplier {t('orders')}</p>
          <h1>Order #{order.id || order.orderId}</h1>
          <p className="supplier-detail-subtitle">Received from {customerName}</p>
          <div className="supplier-detail-meta-row">
            <span>{formatDate(order.date)}</span>
            <span>{order.time || '10:42 AM'}</span>
            <span>Status: {order.status || 'New'}</span>
          </div>
        </div>
      </div>

      <div className="supplier-detail-content">
        <div className="supplier-detail-main-col">
          <div className="supplier-detail-card supplier-items-card">
            <div className="supplier-card-header">
              <h2>Order Items</h2>
              <span>{items.length} items</span>
            </div>

            <div className="supplier-items-table">
              <div className="supplier-items-table-head">
                <span>Product</span>
                <span>SKU</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>Total</span>
              </div>

              {items.map((item, index) => {
                const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1)
                const isBox = unitsPerBox > 1
                const boxes = item.boxes || (isBox ? Math.floor(item.quantity / unitsPerBox) : item.quantity)
                return (
                  <div className="supplier-items-table-row" key={`${item.sku || item.product}-${index}`}>
                    <div className="supplier-product-cell">
                      <span className="supplier-product-thumb" aria-hidden="true">{item.product?.slice(0, 2).toUpperCase() || 'PR'}</span>
                      <div>
                        <strong>{item.product || item.name || 'Product'}</strong>
                        {isBox && <small style={{ color: '#6b7280', display: 'block', fontSize: '0.78rem' }}>{boxes} {boxes === 1 ? 'box' : 'boxes'} ({item.quantity} packets)</small>}
                      </div>
                    </div>
                    <span>{item.sku || '—'}</span>
                    <span>{isBox ? `${boxes} box (${item.quantity} pkts)` : item.quantity}</span>
                    <span>{formatCurrency(item.unitPrice || 0)}/pkt</span>
                    <span>{formatCurrency(item.total || Number(item.unitPrice || 0) * Number(item.quantity || 1))}</span>
                  </div>
                )
              })}
            </div>

            <div className="supplier-order-totals">
              <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div><span>Delivery</span><strong>—</strong></div>
              <div><span>Discount</span><strong>—</strong></div>
              <div className="supplier-total-row"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            </div>
          </div>
        </div>

        <aside className="supplier-detail-side-col">
          <div className="supplier-detail-card supplier-customer-card">
            <div className="supplier-card-header">
              <h2>Customer / Shop</h2>
            </div>
            <div className="supplier-customer-card-body">
              <div className="supplier-customer-name-row">
                <span className="supplier-customer-avatar">{customerName.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{customerName}</strong>
                  <small>{order.area || order.serviceArea || '—'}</small>
                </div>
              </div>
              <div className="supplier-detail-info-block">
                <label>Shop owner</label>
                <strong>{order.shopOwner || '—'}</strong>
              </div>
              <div className="supplier-detail-info-block">
                <label>Phone</label>
                <strong>{order.phone || '+91 98XXXXXX45'}</strong>
              </div>
              <div className="supplier-detail-info-block">
                <label>Delivery Address</label>
                <strong>{order.address || '—'}</strong>
              </div>
              <div className="supplier-customer-actions">
                <button className="supplier-detail-primary" type="button">Call Customer</button>
                <button className="supplier-detail-secondary" type="button">View Customer</button>
              </div>
            </div>
          </div>

          <div className="supplier-detail-card supplier-payment-card">
            <div className="supplier-card-header">
              <h2>Payment Details</h2>
            </div>
            <div className="supplier-detail-info-block">
              <label>Payment Method</label>
              <strong>{order.paymentMethod || '—'}</strong>
            </div>
            <div className="supplier-detail-info-block">
              <label>Payment Status</label>
              <strong>—</strong>
            </div>
            <div className="supplier-detail-info-block">
              <label>Order Total</label>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="supplier-detail-card supplier-delivery-card">
            <div className="supplier-card-header">
              <h2>Delivery Details</h2>
            </div>
            <div className="supplier-detail-info-block">
              <label>Delivery Address</label>
              <strong>{order.address || '—'}</strong>
            </div>
            <div className="supplier-detail-info-block">
              <label>Expected Delivery</label>
              <strong>—</strong>
            </div>
            <div className="supplier-detail-info-block">
              <label>Delivery Status</label>
              <strong>{order.status || '—'}</strong>
            </div>
            <div className="supplier-detail-info-block">
              <label>Delivery Type</label>
              <strong>—</strong>
            </div>
          </div>

          <div className="supplier-detail-card supplier-summary-card">
            <div className="supplier-card-header">
              <h2>Order Summary</h2>
            </div>
            <div className="supplier-summary-list">
              <div><span>Order ID</span><strong>#{order.id || order.orderId}</strong></div>
              <div><span>Customer</span><strong>{customerName}</strong></div>
              <div><span>Total Items</span><strong>{items.length}</strong></div>
              <div><span>Order Total</span><strong>{formatCurrency(total)}</strong></div>
              <div><span>Payment</span><strong>{order.paymentMethod || '—'}</strong></div>
              <div><span>Status</span><strong>{order.status || 'New'}</strong></div>
              <div><span>Order Date</span><strong>{formatDateTime(order.date)}</strong></div>
            </div>
          </div>
        </aside>
      </div>

      <div className="supplier-action-panel">
        <div className="supplier-card-header">
          <h2>Supplier Actions</h2>
        </div>
        <div className="supplier-action-buttons">
          {(statusTransitions[order.status] || []).map((nextStatus) => <button className={nextStatus === 'Cancelled' ? 'supplier-detail-destructive' : 'supplier-detail-secondary'} disabled={isUpdating} key={nextStatus} onClick={() => updateStatus({ target: { value: nextStatus } })} type="button">{nextStatus === 'Accepted' ? 'Accept Order' : nextStatus === 'Preparing' ? 'Mark as Preparing' : nextStatus === 'Out for Delivery' ? 'Mark as Out for Delivery' : nextStatus === 'Delivered' ? 'Mark as Delivered' : 'Cancel Order'}</button>)}
          {statusError && <p className="form-message error" role="alert">{statusError}</p>}
        </div>
      </div>

      <Link className="supplier-back-link" to="/dashboard/supplier/orders">← Back to Orders</Link>
    </section>
  )
}
