import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPackage, FiClock, FiCheckCircle } from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierDashboard } from '../services/supplierDashboardService.js'

const metricIcons = {
  'New orders': <FiPackage size={20} />,
  'Pending orders': <FiClock size={20} />,
  'Completed orders': <FiCheckCircle size={20} />,
}

function getMetricIcon(label = '') {
  if (metricIcons[label]) return metricIcons[label]
  const normalized = label.toLowerCase().trim()
  if (normalized.includes('new') || normalized.includes('received')) return <FiPackage size={20} />
  if (normalized.includes('pending') || normalized.includes('awaiting')) return <FiClock size={20} />
  if (normalized.includes('complete') || normalized.includes('delivered')) return <FiCheckCircle size={20} />
  return <FiPackage size={20} />
}

function formatDashboardOrderId(orderId = '') {
  const value = String(orderId || '').trim()
  if (!value) return '—'

  const compactMatch = value.match(/(?:^|[-_])([A-Fa-f0-9]{8})(?:[-_].*)?$/)
  const compactId = compactMatch ? compactMatch[1].toUpperCase() : value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()

  return compactId ? `ORD-${compactId}` : '—'
}

export default function SupplierDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSupplierDashboard()
      .then((response) => setDashboard(response?.data || null))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const recentOrders = useMemo(() => (dashboard?.recentOrders || []).map((order) => {
    const rawDate = order.createdAt ? new Date(order.createdAt) : null
    const dateLabel = rawDate && !Number.isNaN(rawDate.getTime())
      ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(rawDate)
      : '—'

    return {
      ...order,
      shopOwner: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
      location: order.serviceArea || '—',
      items: (order.items || []).length,
      amountLabel: `₹${Number(order.amount || order.subtotal || 0).toLocaleString('en-IN')}`,
      dateLabel,
      orderIdDisplay: formatDashboardOrderId(order.id),
    }
  }), [dashboard])

  const displayOrders = recentOrders

  const metricActionMap = {
    'New orders': '/dashboard/supplier/orders',
    'Pending orders': '/dashboard/supplier/orders',
    'Completed orders': '/dashboard/supplier/orders',
    "Today's Revenue": '/dashboard/supplier/analytics',
  }

  const firstName = user?.name?.split(' ')[0] || dashboard?.businessName?.split(' ')[0] || 'there'

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    const label = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
    const cleanLabel = String(label || '').replace(/,\s*$/, '').trim()
    return `${cleanLabel}, ${firstName}`
  }

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />
  if (error) return (
    <section className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">
        {error}
      </div>
    </section>
  )
  if (!dashboard) return (
    <section className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">
        {t('supplierDashboardMessage')}
      </div>
    </section>
  )

  return (
    <section className="space-y-4 sm:space-y-8 w-full min-w-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-100">
        <div>
          <p className="text-xs sm:text-sm font-bold text-brand-orange uppercase tracking-wider">{getDynamicGreeting()}</p>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-0.5">{dashboard.businessName}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{t('manageOrdersProductsCustomers')}</p>
        </div>
      </header>

      {/* 2-Column Metrics on Mobile, 4-Column on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5 w-full min-w-0">
        {dashboard.metrics.map((metric) => {
          const metricLabelKeyMap = {
            'New orders': 'newOrders',
            'Pending orders': 'pendingOrders',
            'Completed orders': 'completedOrders',
            "Today's Revenue": 'todayRevenue',
            "Today's revenue": 'todayRevenue',
          }
          const metricDetailKeyMap = {
            'Received this week': 'receivedThisWeek',
            'Awaiting fulfilment': 'awaitingFulfilment',
            'Awaiting fulfillment': 'awaitingFulfilment',
            'Delivered successfully': 'deliveredSuccessfully',
            'Revenue received today': 'revenueReceivedToday',
          }
          const labelKey = metricLabelKeyMap[metric.label]
          const translatedLabel = labelKey ? t(labelKey) : null
          const label = translatedLabel && translatedLabel !== labelKey ? translatedLabel : (metric.label || '')

          const detailKey = metricDetailKeyMap[metric.detail]
          const translatedDetail = detailKey ? t(detailKey) : null
          const detail = translatedDetail && translatedDetail !== detailKey ? translatedDetail : (metric.detail || '')

          return (
            <MetricCard
              key={metric.label}
              accent={metric.accent}
              actionTo={metric.actionTo || metricActionMap[metric.label] || '/dashboard/supplier/orders'}
              detail={detail}
              icon={metric.icon || getMetricIcon(metric.label)}
              label={label}
              value={metric.value}
            />
          )
        })}
      </div>


      {/* Recent Orders Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-6 w-full min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 sm:pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('recentOrders')}</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{t('latestIncomingOrdersAttention')}</p>
          </div>
          <button 
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-orange-dark transition-colors cursor-pointer shrink-0" 
            onClick={() => navigate('/dashboard/supplier/orders')} 
            type="button"
          >
            <span>{t('viewAllOrders')}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Mobile & Tablet View: Clean Card List (No Horizontal Scroll) */}
        <div className="space-y-2.5 sm:space-y-3 lg:hidden mt-3">
          {displayOrders.length ? (
            displayOrders.map((order) => (
              <div 
                key={order.id} 
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 space-y-2 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      {order.orderIdDisplay}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 truncate mt-0.5" title={order.shopOwner}>
                      {order.shopOwner}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {order.location}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">{t('amount')}</span>
                    <strong className="text-sm font-black text-slate-900 tabular-nums">
                      {order.amountLabel}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">{t('itemsCount')}</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {order.items} {order.items === 1 ? (t('itemCount') || 'item') : (t('itemsCount') || 'items')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {order.dateLabel}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-orange text-xs font-bold transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`)}
                    type="button"
                  >
                    <span>{t('view') || 'View'}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              {t('noRecentOrders') || 'No recent orders'}
            </div>
          )}
        </div>

        {/* Desktop View: Table (lg: and above) */}
        <div className="hidden lg:block overflow-x-auto mt-4">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 bg-slate-50/80 rounded-l-xl font-bold w-[15%]">{t('orderId')}</th>
                <th className="py-3 px-4 bg-slate-50/80 font-bold w-[25%]">{t('customerShop')}</th>
                <th className="py-3 px-4 bg-slate-50/80 font-bold w-[10%]">{t('itemsCount')}</th>
                <th className="py-3 px-4 bg-slate-50/80 font-bold w-[12%]">{t('amount')}</th>
                <th className="py-3 px-4 bg-slate-50/80 font-bold w-[14%]">{t('status')}</th>
                <th className="py-3 px-4 bg-slate-50/80 font-bold w-[16%]">{t('dateTime')}</th>
                <th className="py-3 px-4 bg-slate-50/80 rounded-r-xl text-right font-bold w-[8%]">
                  <span className="sr-only">{t('action') || 'Action'}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.length ? (
                displayOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-800 whitespace-nowrap border-b border-slate-100">
                      {order.orderIdDisplay}
                    </td>
                    <td className="py-3.5 px-4 border-b border-slate-100">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">{order.shopOwner}</span>
                        <small className="text-xs text-slate-400 truncate">{order.location}</small>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium whitespace-nowrap border-b border-slate-100">
                      {order.items} {order.items === 1 ? (t('itemCount') || 'item') : (t('itemsCount') || 'items')}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap border-b border-slate-100">
                      {order.amountLabel}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap border-b border-slate-100">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                      {order.dateLabel}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap border-b border-slate-100">
                      <button 
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange text-xs font-semibold text-slate-700 transition-all cursor-pointer whitespace-nowrap" 
                        onClick={() => navigate(`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`)} 
                        type="button"
                      >
                        {t('view') || 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-medium border-b border-slate-100">
                    {t('noRecentOrders') || 'No recent orders'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
