import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogOrders, updateGruhUdyogOrderStatus } from '../services/gruhUdyogService.js'

const transitions = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export default function GruhUdyogOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGruhUdyogOrders()
      .then((response) => setOrders(response.data.orders))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const visibleOrders = useMemo(() => orders.filter((order) => statusFilter === 'All statuses' || order.status === statusFilter), [orders, statusFilter])

  async function updateStatus(orderId, nextStatus) {
    if (!nextStatus) return
    try {
      const response = await updateGruhUdyogOrderStatus(orderId, nextStatus)
      setOrders((current) => current.map((order) => order.id === orderId ? response.data.order : order))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingOrders')} />
  if (error) return <section className="orders-page"><div className="eyebrow">{t('gruhUdyogWorkspace')}</div><h1>{t('incomingOrders')}</h1><p className="form-message error" role="alert">{error}</p></section>

  return (
    <section className="orders-page">
      <div className="orders-heading">
        <div>
          <div className="eyebrow">{t('gruhUdyogWorkspace')}</div>
          <h1>{t('incomingOrders')}</h1>
          <p className="muted">{t('retailRequestsAssigned')}</p>
        </div>
      </div>
      <div className="orders-tools">
        <label className="category-filter">
          <span className="sr-only">{t('filterByStatus')}</span>
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="All statuses">{t('allStatuses')}</option>
            {['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {visibleOrders.length ? (
        <div className="orders-list">
          {visibleOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{order.shopOwner}</span>
              </div>
              <div className="order-card-meta">
                <strong>Rs {Number(order.amount).toLocaleString('en-IN')}</strong>
                <StatusBadge status={order.status} />
              </div>
              <small>{order.date} · {order.area}</small>
              {transitions[order.status]?.length ? (
                <select defaultValue="" onChange={(event) => updateStatus(order.id, event.target.value)}>
                  <option value="">{t('chooseNextStatus')}</option>
                  {transitions[order.status].map((nextStatus) => <option key={nextStatus} value={nextStatus}>{nextStatus}</option>)}
                </select>
              ) : <p className="prototype-note">{t('orderReachedFinalStatus')}</p>}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={t('noRetailOrdersAssigned')} message={t('incomingOrdersWillAppear')} />
      )}
    </section>
  )
}
