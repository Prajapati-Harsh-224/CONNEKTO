import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import IncomingOrderCard from '../components/IncomingOrderCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrders } from '../services/supplierOrderService.js'

const statuses = ['All statuses', 'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

export default function SupplierIncomingOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('All statuses')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSupplierOrders().then((response) => setOrders(response.data.orders)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.id} ${order.shopOwner} ${order.area} ${order.status}`.toLowerCase()
    return (status === 'All statuses' || order.status === status) && searchable.includes(query.toLowerCase())
  }), [orders, query, status])

  if (isLoading) return <LoadingState message={t('loadingIncomingOrders')} />
  if (error) return <section className="orders-page"><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{t('incomingOrders')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>

  return <section className="orders-page supplier-orders-page"><Link className="back-link" to="/dashboard/supplier">← {t('backToDashboard')}</Link><div className="orders-heading"><div><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{t('incomingOrders')}</h1><p className="muted">{t('retailRequestsAssigned')}</p></div><span className="summary-period">{orders.length} {t('totalCount')}</span></div><div className="orders-tools"><label className="product-search"><span className="sr-only">{t('searchIncomingOrders')}</span><input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchByOrderShopArea')} type="search" value={query} /></label><label className="category-filter"><span className="sr-only">{t('filterByStatus')}</span><select onChange={(event) => setStatus(event.target.value)} value={status}>{statuses.map((item) => <option key={item}>{item === 'All statuses' ? t('allStatuses') : item}</option>)}</select></label></div>{visibleOrders.length ? <div className="orders-list">{visibleOrders.map((order) => <IncomingOrderCard key={order.id} linkTo={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`} order={order} />)}</div> : <EmptyState title={t('noIncomingOrders')} message={orders.length ? t('noOrdersFoundSearch') : t('noIncomingOrders')} />}</section>
}
