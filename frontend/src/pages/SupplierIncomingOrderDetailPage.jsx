import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrder, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const transitions = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
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
    getSupplierOrder(orderId).then((response) => setOrder(response.data.order)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) return <LoadingState message={t('loadingIncomingOrders')} />
  if (error) return <section className="order-detail-page"><p className="form-message error" role="alert">{error}</p><Link className="button secondary" to="/dashboard/supplier/orders">{t('backToIncomingOrders')}</Link></section>
  if (!order) return <EmptyState title={t('orderNotFound')} message={t('orderUnavailable')} />

  const products = order.products || (order.items || []).map((item) => ({
    name: item.name || item.productNameSnapshot || t('product'),
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice ?? item.unitPriceSnapshot ?? 0),
  }))
  const amount = Number(order.amount ?? order.subtotal ?? 0)
  const customer = order.shopOwner || order.shopOwnerId || t('shopOwner')
  const area = order.area || order.serviceArea || '-'
  const date = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-')

  async function updateStatus(event) {
    const nextStatus = event.target.value
    if (!nextStatus) return
    setStatusError('')
    setIsUpdating(true)
    try {
      const response = await updateSupplierOrderStatus(order.id, nextStatus)
      setOrder(response.data.order)
    } catch (requestError) {
      setStatusError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return <section className="order-detail-page"><Link className="back-link" to="/dashboard/supplier/orders">← {t('backToIncomingOrders')}</Link><div className="eyebrow">{t('incomingOrder')}</div><div className="order-detail-heading"><div><h1>{order.id}</h1><p className="muted">{t('fromText')} {customer}</p></div><StatusBadge status={order.status} /></div><div className="order-detail-meta"><div><span>{t('orderDate')}</span><strong>{date}</strong></div><div><span>{t('total')}</span><strong>Rs {amount.toLocaleString('en-IN')}</strong></div><div><span>{t('deliveryArea')}</span><strong>{area}</strong></div><div><span>{t('productsLabel')}</span><strong>{products.length}</strong></div></div><section className="order-items-panel"><span className="section-kicker">{t('productsLabel')}</span><h2>{t('requestedItems')}</h2>{products.length ? products.map((product) => <div className="order-detail-item" key={product.name}><div><strong>{product.name}</strong><span>{product.quantity} × Rs {product.unitPrice.toLocaleString('en-IN')}</span></div><strong>Rs {(product.quantity * product.unitPrice).toLocaleString('en-IN')}</strong></div>) : <p className="prototype-note">{t('noProducts')}</p>}<div className="order-detail-total"><span>{t('orderTotal')}</span><strong>Rs {amount.toLocaleString('en-IN')}</strong></div></section><section className="status-management"><div><span className="section-kicker">{t('statusManagement')}</span><h2>{t('updateOrderStatus')}</h2></div>{(transitions[order.status] || []).length ? <select disabled={isUpdating} onChange={updateStatus} value=""><option value="">{isUpdating ? t('updatingStatus') : t('chooseNextStatus')}</option>{transitions[order.status].map((nextStatus) => <option key={nextStatus} value={nextStatus}>{nextStatus}</option>)}</select> : <p className="prototype-note">{t('orderReachedFinalStatus')}</p>}{statusError && <p className="form-message error" role="alert">{statusError}</p>}</section></section>
}
