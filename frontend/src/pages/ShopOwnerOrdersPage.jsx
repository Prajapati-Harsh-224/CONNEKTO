import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiPackage, FiXCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'

const tabs = [
  { value: 'All', key: 'ordersAll' },
  { value: 'Pending', key: 'pending' },
  { value: 'In Progress', key: 'ordersInProgress' },
  { value: 'Delivered', key: 'delivered' },
  { value: 'Cancelled', key: 'cancelled' },
]

function priceValue(value) {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0
}

function formatPrice(value) {
  return `Rs ${Number(value).toLocaleString('en-IN')}`
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function statusGroup(status) {
  const normalized = displayStatus(status)
  if (normalized === 'Pending' || normalized === 'Request Sent') return 'Pending'
  if (normalized === 'Accepted' || normalized === 'Preparing' || normalized === 'Out for Delivery') return 'In Progress'
  return normalized
}

function displayStatus(status = '') {
  if (status === 'REQUESTED') return 'Request Sent'
  return status.replaceAll('_', ' ')
}

function displayOrderId(orderId, maxLength = 25) {
  const value = String(orderId || '')
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function displayPaymentMethod(paymentMethod) {
  const labels = { CASH_ON_DELIVERY: 'Cash on Delivery', PAY_LATER: 'Pay Later', REQUEST_ORDER: 'Request Order' }
  const normalized = String(paymentMethod || '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
  return labels[normalized] || paymentMethod || '—'
}

function formatOrderDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-').replaceAll('_', '-')
}

function OrderStatus({ status }) {
  const label = displayStatus(status)
  return <span className={`orders-status orders-status--${statusClass(label)}`}><span aria-hidden="true" />{label}</span>
}

function getSupplierDetails(order) {
  return {
    category: '',
    location: order.serviceArea || '—',
  }
}

function productName(item) {
  return item.productNameSnapshot || item.name || item.productName || 'Product'
}

export default function ShopOwnerOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers')
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [currentTime] = useState(Date.now)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrders().then((response) => setOrders(response.data.orders || [])).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  const suppliers = useMemo(() => ['All Suppliers', ...new Set(orders.map((order) => order.supplierName).filter(Boolean))], [orders])
  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((order) => statusGroup(order.status) === 'Pending').length,
    progress: orders.filter((order) => statusGroup(order.status) === 'In Progress').length,
    delivered: orders.filter((order) => statusGroup(order.status) === 'Delivered').length,
    cancelled: orders.filter((order) => statusGroup(order.status) === 'Cancelled').length,
  }), [orders])

  const visibleOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const searchable = `${order.id} ${order.supplierName} ${displayStatus(order.status)} ${(order.items || []).map(productName).join(' ')}`.toLowerCase()
      const createdAt = new Date(order.createdAt).getTime()
      const matchesTab = activeTab === 'All' || statusGroup(order.status) === activeTab
      const matchesQuery = searchable.includes(query.trim().toLowerCase())
      const matchesSupplier = supplierFilter === 'All Suppliers' || order.supplierName === supplierFilter
      const matchesTime = timeFilter === 'All Time' || (timeFilter === 'Last 30 days' && currentTime - createdAt <= 30 * 24 * 60 * 60 * 1000) || (timeFilter === 'Last 90 days' && currentTime - createdAt <= 90 * 24 * 60 * 60 * 1000)
      return matchesTab && matchesQuery && matchesSupplier && matchesTime
    })
    return filtered.sort((first, second) => sortBy === 'oldest' ? new Date(first.createdAt) - new Date(second.createdAt) : new Date(second.createdAt) - new Date(first.createdAt))
  }, [activeTab, currentTime, orders, query, sortBy, supplierFilter, timeFilter])

  const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) || visibleOrders[0]
  const selectedSupplier = selectedOrder ? getSupplierDetails(selectedOrder) : null
  const selectedItems = selectedOrder?.items || []
  const stats = [
    { key: 'total', label: t('ordersTotalOrders'), value: counts.all, description: t('ordersAllTime'), icon: FiPackage },
    { key: 'pending', label: t('pending'), value: counts.pending, description: t('ordersAwaitingConfirmation'), icon: FiClock },
    { key: 'delivered', label: t('delivered'), value: counts.delivered, description: t('ordersCompleted'), icon: FiCheckCircle },
    { key: 'cancelled', label: t('cancelled'), value: counts.cancelled, description: t('ordersCancelled'), icon: FiXCircle },
  ]

  if (isLoading) return <LoadingState message={t('loadingOrders')} />
  if (error) return <section className="orders-page orders-error"><div className="orders-breadcrumb">{t('shopOwner')} <span>›</span> {t('orders')}</div><h1>{t('yourOrders')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>

  return (
    <section className="orders-page">
      <div className="orders-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{t('orders')}</span></div>
      <div className="orders-heading"><div><h1>{t('yourOrders')}</h1><p>{t('ordersSubtitle')}</p></div></div>
      <div className="orders-stat-grid">{stats.map((stat) => {
        const Icon = stat.icon
        return (
          <article className={`orders-stat-card orders-stat-card--${stat.key}`} key={stat.key}>
            <span className="orders-stat-icon" aria-hidden="true"><Icon /></span>
            <div>
              <strong>{stat.label}</strong>
              <b>{stat.value}</b>
              <small>{stat.description}</small>
            </div>
          </article>
        )
      })}</div>
      <div className="orders-tabs" role="tablist">{tabs.map((tab) => { const count = tab.value === 'All' ? counts.all : tab.value === 'Pending' ? counts.pending : tab.value === 'In Progress' ? counts.progress : tab.value === 'Delivered' ? counts.delivered : counts.cancelled; return <button className={activeTab === tab.value ? 'active' : ''} key={tab.value} onClick={() => setActiveTab(tab.value)} role="tab" type="button">{t(tab.key)}{tab.value !== 'All' && <span>({count})</span>}</button> })}</div>
      <div className="orders-content-layout">
        <div className="orders-list-panel">
          <div className="orders-toolbar"><label className="orders-search"><span aria-hidden="true">⌕</span><span className="sr-only">{t('ordersSearchPlaceholder')}</span><input onChange={(event) => setQuery(event.target.value)} placeholder={t('ordersSearchPlaceholder')} type="search" value={query} /></label><label className="orders-select"><span className="sr-only">{t('ordersSupplierFilter')}</span><select onChange={(event) => setSupplierFilter(event.target.value)} value={supplierFilter}>{suppliers.map((supplier) => <option key={supplier}>{supplier}</option>)}</select><span>⌄</span></label><label className="orders-select"><span className="sr-only">{t('ordersTimeFilter')}</span><select onChange={(event) => setTimeFilter(event.target.value)} value={timeFilter}><option>All Time</option><option>Last 30 days</option><option>Last 90 days</option></select><span>⌄</span></label><label className="orders-select"><span className="sr-only">{t('ordersSort')}</span><select onChange={(event) => setSortBy(event.target.value)} value={sortBy}><option value="newest">Sort by: Newest</option><option value="oldest">Sort by: Oldest</option></select><span>⌄</span></label></div>
          {visibleOrders.length ? <div className="orders-table"><div className="orders-table-head"><span>{t('ordersColumnOrder')}</span><span>{t('ordersColumnSupplier')}</span><span>{t('ordersColumnItems')}</span><span>{t('ordersColumnAmount')}</span><span>{t('ordersColumnStatus')}</span><span>{t('ordersColumnDate')}</span></div>{visibleOrders.map((order) => { const items = order.items || []; return <article className={`orders-row${selectedOrder?.id === order.id ? ' selected' : ''}`} key={order.id} onClick={() => setSelectedOrderId(order.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedOrderId(order.id) }} role="button" tabIndex="0"><div className="orders-row-order"><strong title={`#${order.id}`}>#{displayOrderId(order.id)}</strong><div className="orders-thumbnails">{items.slice(0, 3).map((item) => <ProductImage key={item.productId} alt="" aria-hidden="true" className="orders-thumb" fallbackText={productName(item).slice(0, 1)} src={item.imageUrl || item.imageLabel || ''} />)}</div></div><div className="orders-row-supplier"><span>{getInitials(order.supplierName)}</span><strong>{order.supplierName}</strong></div><span>{items.length} {items.length === 1 ? t('itemCount') : t('itemsCount')}</span><strong>{formatPrice(order.subtotal)}</strong><OrderStatus status={order.status} /><span className="orders-row-date">{formatOrderDate(order.createdAt)}</span></article> })}</div> : <EmptyState title={t('noOrders')} message={orders.length ? t('noOrdersFoundSearch') : t('noOrdersYet')} />}
        </div>
        {selectedOrder && <aside className="orders-details-panel"><div className="orders-details-heading"><h2>{t('ordersDetails')}</h2><Link to="/dashboard/shop-owner/orders">{t('ordersViewAll')} →</Link></div><div className="orders-detail-id"><strong>#{selectedOrder.id}</strong><OrderStatus status={selectedOrder.status} /></div><div className="orders-detail-supplier"><span>{getInitials(selectedOrder.supplierName)}</span><div><strong>{selectedOrder.supplierName}</strong><small>{selectedSupplier.location} <b>|</b> {selectedSupplier.category}</small></div></div><div className="orders-detail-items"><h3>{t('ordersItems')} ({selectedItems.length})</h3>{selectedItems.map((item) => {
  const upb = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1)
  const isBox = upb > 1
  const boxes = item.boxes || (isBox ? Math.floor(item.quantity / upb) : item.quantity)
  return (
    <div className="orders-detail-item" key={item.productId}>
      <ProductImage alt="" aria-hidden="true" className="orders-detail-thumb" fallbackText={productName(item).slice(0, 1)} src={item.imageUrl || item.imageLabel || ''} />
      <div>
        <strong>{productName(item)}</strong>
        <small>{isBox ? `${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} (${item.quantity} packets)` : `${t('quantity')}: ${item.quantity} units`}</small>
      </div>
      <strong>{formatPrice(priceValue(item.lineTotal) || priceValue(item.unitPriceSnapshot) * Number(item.quantity))}</strong>
    </div>
  )
})}</div><div className="orders-detail-total"><span>{t('ordersItemTotal')}</span><strong>{formatPrice(priceValue(selectedOrder.subtotal))}</strong><span>{t('ordersDeliveryFee')}</span><strong>{formatPrice(0)}</strong><b>{t('ordersTotalAmount')}</b><b>{formatPrice(priceValue(selectedOrder.subtotal))}</b></div><div className="orders-detail-date"><span>{t('ordersPlaced')}</span><strong>{formatOrderDate(selectedOrder.createdAt)}</strong></div><div className="orders-detail-date orders-detail-payment"><span>Payment Method</span><strong>{displayPaymentMethod(selectedOrder.paymentMethod)}</strong></div><Link className="orders-full-details" to={`/dashboard/shop-owner/orders/${encodeURIComponent(selectedOrder.id)}`}>{t('ordersViewFullDetails')} →</Link></aside>}
      </div>
    </section>
  )
}
