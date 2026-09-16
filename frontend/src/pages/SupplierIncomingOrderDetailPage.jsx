import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrder, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const statusTransitions = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
}

const paymentLabels = {
  CASH_ON_DELIVERY: 'Cash on Delivery',
  PAY_LATER: 'Pay Later',
  REQUEST_ORDER: 'Request Order',
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
    <section className="order-detail-page">
      <div className="order-detail-breadcrumb">
        <Link to="/dashboard/supplier/orders">{t('orders') || 'Orders'}</Link>
        <span aria-hidden="true">›</span>
        <span>Order #{order.id || order.orderId}</span>
      </div>

      <div className="order-detail-heading">
        <div>
          <span className="section-kicker">Supplier order</span>
          <h1>Order #{order.id || order.orderId}</h1>
          <p className="order-detail-supplier">Customer: {customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="order-detail-meta">
        <div>
          <span>Order date</span>
          <strong>{formatDate(order.date)}</strong>
        </div>
        <div>
          <span>Total amount</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div>
          <span>Delivery area</span>
          <strong>{order.area || order.serviceArea || '—'}</strong>
        </div>
        <div>
          <span>Payment method</span>
          <strong>{paymentLabels[order.paymentMethod] || order.paymentMethod || 'Cash on Delivery'}</strong>
        </div>
      </div>

      <div className="order-detail-layout">
        <main className="order-detail-main">
          <section className="order-items-panel">
            <div className="order-detail-section-heading">
              <div>
                <span className="section-kicker">Products</span>
                <h2>Order Items</h2>
              </div>
              <span className="order-detail-item-count">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="order-detail-items-heading">
              <span>Product</span>
              <span>Amount</span>
            </div>

            {items.map((item, index) => {
              const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1)
              const isBox = unitsPerBox > 1
              const boxes = item.boxes || (isBox ? Math.floor(item.quantity / unitsPerBox) : item.quantity)
              const unitPrice = Number(String(item.unitPriceSnapshot || item.unitPrice || 0).replace(/[^0-9.]/g, ''))
              return (
                <div className="order-detail-item" key={`${item.sku || item.product}-${index}`}>
                  <div>
                    <strong>{item.product || item.name || 'Product'}</strong>
                    <span>
                      {isBox
                        ? `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} (${item.quantity} packets) × ${formatCurrency(unitPrice)}/packet`
                        : `${item.quantity} units × ${formatCurrency(unitPrice)}`}
                    </span>
                  </div>
                  <strong>{formatCurrency(item.total || unitPrice * (item.quantity || 1))}</strong>
                </div>
              )
            })}

            <div className="order-detail-total">
              <span>Supplier subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            {total !== subtotal && (
              <div className="order-detail-total" style={{ borderTop: 'none', paddingTop: '0.4rem' }}>
                <span>Supplier total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            )}
          </section>

          <section className="customer-info-panel" style={{ marginTop: '1rem' }}>
            <div className="order-detail-section-heading">
              <div>
                <span className="section-kicker">Customer Information</span>
                <h2>Customer &amp; Delivery Details</h2>
              </div>
            </div>

            <div className="customer-info-grid">
              <div className="customer-info-item">
                <label>Shop / Customer</label>
                <strong>{customerName}</strong>
                <small>{order.area || order.serviceArea || '—'}</small>
              </div>
              <div className="customer-info-item">
                <label>Shop Owner</label>
                <strong>{order.shopOwner || customerName}</strong>
              </div>
              <div className="customer-info-item">
                <label>Phone Number</label>
                <strong>{order.phone || '—'}</strong>
              </div>
              <div className="customer-info-item">
                <label>Delivery Address</label>
                <strong>{order.address || order.area || '—'}</strong>
              </div>
            </div>

            <div className="customer-actions-row">
              {order.phone && (
                <a
                  className="supplier-detail-primary"
                  href={`tel:${order.phone}`}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Call Customer
                </a>
              )}
              <Link
                className="supplier-detail-secondary"
                to="/dashboard/supplier/customers"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                View Customers
              </Link>
            </div>
          </section>
        </main>

        <aside className="order-detail-side">
          <section className="timeline-panel">
            <div className="order-detail-section-heading">
              <div>
                <span className="section-kicker">Status timeline</span>
                <h2>Order progress</h2>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <StatusTimeline currentStatus={order.status} />
          </section>

          <section className="supplier-actions-panel">
            <div className="order-detail-section-heading">
              <div>
                <span className="section-kicker">Action Required</span>
                <h2>Supplier Actions</h2>
              </div>
            </div>

            {(statusTransitions[order.status] || []).length > 0 ? (
              <div className="supplier-action-buttons-stack">
                {(statusTransitions[order.status] || []).map((nextStatus) => {
                  const isDestructive = nextStatus === 'Cancelled'
                  const label = nextStatus === 'Accepted'
                    ? 'Accept Order'
                    : nextStatus === 'Preparing'
                      ? 'Mark as Preparing'
                      : nextStatus === 'Out for Delivery'
                        ? 'Mark as Out for Delivery'
                        : nextStatus === 'Delivered'
                          ? 'Mark as Delivered'
                          : 'Cancel Order'

                  return (
                    <button
                      className={isDestructive ? 'supplier-detail-destructive' : 'supplier-detail-primary'}
                      disabled={isUpdating}
                      key={nextStatus}
                      onClick={() => updateStatus({ target: { value: nextStatus } })}
                      type="button"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="order-detail-note">
                <strong>No Actions Needed</strong>
                <p>Order is currently {order.status?.toLowerCase()}. No further status transitions available.</p>
              </div>
            )}

            {statusError && (
              <p className="form-message error" role="alert" style={{ marginTop: '0.6rem' }}>
                {statusError}
              </p>
            )}
          </section>
        </aside>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link className="supplier-back-link" to="/dashboard/supplier/orders">
          ← Back to Incoming Orders
        </Link>
      </div>
    </section>
  )
}
