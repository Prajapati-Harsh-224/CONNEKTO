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

  const firstName = user?.name?.split(' ')[0] || dashboard?.businessName?.split(' ')[0] || 'there'

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    const label = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    return `${label}, ${firstName}`
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
        Supplier dashboard unavailable.
      </div>
    </section>
  )

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-bold text-brand-orange uppercase tracking-wider">{getDynamicGreeting()}</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-0.5">{dashboard.businessName}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your orders, products and customers from one place.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            accent={metric.accent}
            actionTo={metric.actionTo}
            detail={metric.detail}
            icon={metric.icon || getMetricIcon(metric.label)}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest incoming orders requiring attention</p>
          </div>
          <button 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-orange-dark transition-colors cursor-pointer" 
            onClick={() => navigate('/dashboard/supplier/orders')} 
            type="button"
          >
            View All Orders <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6" role="table" aria-label="Recent supplier orders">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.2fr_2fr_1fr_1.2fr_1.2fr_1.6fr_auto] gap-4 py-3 px-4 bg-slate-50/80 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-wider mt-4" role="row">
              <span role="columnheader">Order ID</span>
              <span role="columnheader">Customer (Shop)</span>
              <span role="columnheader">Items</span>
              <span role="columnheader">Amount</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Date &amp; Time</span>
              <span aria-hidden="true" />
            </div>

            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div 
                  className="grid grid-cols-[1.2fr_2fr_1fr_1.2fr_1.2fr_1.6fr_auto] gap-4 items-center py-3.5 px-4 hover:bg-slate-50/60 transition-colors" 
                  key={order.id} 
                  role="row"
                >
                  <span className="text-xs font-mono font-bold text-slate-800" role="cell">{order.orderIdDisplay}</span>
                  <span className="flex flex-col min-w-0" role="cell">
                    <span className="text-sm font-semibold text-slate-900 truncate">{order.shopOwner}</span>
                    <small className="text-xs text-slate-400 truncate">{order.location}</small>
                  </span>
                  <span className="text-xs text-slate-600 font-medium" role="cell">{order.items} items</span>
                  <span className="text-xs font-bold text-slate-900" role="cell">{order.amountLabel}</span>
                  <span role="cell"><StatusBadge status={order.status} /></span>
                  <span className="text-xs text-slate-500 whitespace-nowrap" role="cell">{order.dateLabel}</span>
                  <button 
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange text-xs font-semibold text-slate-700 transition-all cursor-pointer whitespace-nowrap" 
                    onClick={() => navigate(`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`)} 
                    type="button"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
