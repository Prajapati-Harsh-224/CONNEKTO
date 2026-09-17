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
  if (error) {
    return (
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl font-bold text-slate-900">{t('incomingOrders')}</h1>
        <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">{t('gruhUdyogWorkspace')}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('incomingOrders')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('retailRequestsAssigned')}</p>
        </div>

        {/* Filter */}
        <div className="shrink-0">
          <select
            aria-label={t('filterByStatus')}
            className="w-full sm:w-auto px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-xs"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="All statuses">{t('allStatuses')}</option>
            {['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {visibleOrders.length ? (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-slate-900">{order.id}</strong>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-sm font-medium text-slate-600">{order.shopOwner}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {order.date} · <span className="text-slate-700 font-medium">{order.area}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-left md:text-right">
                  <strong className="block text-base font-bold text-slate-900">
                    Rs {Number(order.amount).toLocaleString('en-IN')}
                  </strong>
                  <div className="mt-0.5">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {transitions[order.status]?.length ? (
                  <div className="shrink-0">
                    <select
                      className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors cursor-pointer"
                      defaultValue=""
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                    >
                      <option value="">{t('chooseNextStatus')}</option>
                      {transitions[order.status].map((nextStatus) => (
                        <option key={nextStatus} value={nextStatus}>{nextStatus}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400 italic">
                    {t('orderReachedFinalStatus')}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={t('noRetailOrdersAssigned')} message={t('incomingOrdersWillAppear')} />
      )}
    </section>
  )
}
