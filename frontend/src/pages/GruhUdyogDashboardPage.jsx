import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiClock, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogDashboard } from '../services/gruhUdyogService.js'

const metricIcons = {
  'New orders': <FiPackage className="w-5 h-5" />,
  'Pending orders': <FiClock className="w-5 h-5" />,
  'Completed orders': <FiCheckCircle className="w-5 h-5" />,
}

function getMetricIcon(label = '') {
  if (metricIcons[label]) return metricIcons[label]
  const normalized = label.toLowerCase().trim()
  if (normalized.includes('new') || normalized.includes('received')) return <FiPackage className="w-5 h-5" />
  if (normalized.includes('pending') || normalized.includes('awaiting')) return <FiClock className="w-5 h-5" />
  if (normalized.includes('complete') || normalized.includes('delivered')) return <FiCheckCircle className="w-5 h-5" />
  return <FiPackage className="w-5 h-5" />
}

export default function GruhUdyogDashboardPage() {
  const { t } = useLocale()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGruhUdyogDashboard()
      .then((response) => setDashboard(response.data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />
  if (error) {
    return (
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboardUnavailable')}</h1>
        <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p>
      </section>
    )
  }
  if (!dashboard) return null

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{dashboard.businessName}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('gruhUdyogDashboardMessage')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            icon={metric.icon || getMetricIcon(metric.label)}
            label={t(metric.label.toLowerCase().replace(/\s+/g, '')) || metric.label}
          />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider block">{t('recentRetailRequests')}</span>
              <h2 className="text-lg font-bold text-slate-900">{t('recentOrders')}</h2>
            </div>
            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 rounded-full border border-purple-200">
              {dashboard.orders.length}
            </span>
          </div>

          <div className="space-y-3">
            {dashboard.orders.slice(0, 3).map((order) => (
              <article
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <strong className="block text-sm font-semibold text-slate-900">{order.id}</strong>
                  <span className="text-xs text-slate-500">{order.shopOwner}</span>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="text-sm font-bold text-slate-900">Rs {Number(order.amount).toLocaleString('en-IN')}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <small className="text-xs text-slate-400">{order.date}</small>
              </article>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to="/dashboard/gruh-udyog/orders"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors"
            >
              <span>{t('viewIncomingOrders')}</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </section>
  )
}
