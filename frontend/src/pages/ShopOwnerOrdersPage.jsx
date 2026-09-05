import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import OrderCard from '../components/OrderCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'

const baseStatuses = ['All statuses', 'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

export default function ShopOwnerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('All statuses')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { t } = useLocale()

  useEffect(() => {
    getOrders().then((response) => setOrders(response.data.orders)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.id} ${order.supplierName} ${order.status}`.toLowerCase()
    return (status === 'All statuses' || order.status === status) && searchable.includes(query.toLowerCase())
  }), [orders, query, status])

  const statuses = baseStatuses.map((item) => ({
    value: item,
    label: item === 'All statuses' ? t('allStatuses') : item === 'Pending' ? t('pending') : item === 'Accepted' ? t('accepted') : item === 'Preparing' ? t('preparing') : item === 'Out for Delivery' ? t('outForDelivery') : item === 'Delivered' ? t('delivered') : item === 'Cancelled' ? t('cancelled') : item,
  }))

  if (isLoading) return <LoadingState message={t('loadingOrders')} />
  if (error) return <section className="orders-page"><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('orders')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>

  return <section className="orders-page"><div className="orders-heading"><div><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('yourOrders')}</h1><p className="muted">{t('trackOrders')}</p></div><span className="summary-period">{orders.length} {t('totalCount')}</span></div><div className="orders-tools"><label className="product-search"><span className="sr-only">{t('searchOrders')}</span><input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchByOrderSupplier')} type="search" value={query} /></label><label className="category-filter"><span className="sr-only">{t('filterByStatus')}</span><select onChange={(event) => setStatus(event.target.value)} value={status}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>{visibleOrders.length ? <div className="orders-list">{visibleOrders.map((order) => <Link className="order-link" key={order.id} to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}><OrderCard order={{ ...order, amount: `Rs ${Number(order.subtotal).toLocaleString('en-IN')}`, date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), supplier: order.supplierName }} /></Link>)}</div> : <EmptyState title={t('noOrders')} message={orders.length ? t('noOrdersFoundSearch') : t('noOrdersYet')} />}</section>
}
