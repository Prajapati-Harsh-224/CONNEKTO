import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import IncomingOrderCard from '../components/IncomingOrderCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierDashboard } from '../services/supplierDashboardService.js'

export default function SupplierDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { t } = useLocale()

  useEffect(() => {
    getSupplierDashboard().then((response) => setDashboard(response.data)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message={t('loadingSupplierDashboard')} />
  if (error) return <section className="dashboard-page"><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{t('dashboardUnavailable')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>
  if (!dashboard) return <EmptyState title={t('dashboardUnavailable')} message={t('supplierDashboardMessage')} />

  return <section className="dashboard-page supplier-dashboard"><div className="dashboard-heading"><div><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{dashboard.businessName}.</h1><p className="muted">{t('keepEyeOnDemand')}</p></div>{dashboard.isDemoData && <span className="demo-label">{t('demoData')}</span>}</div><div className="metric-grid">{dashboard.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div><div className="dashboard-grid"><section className="dashboard-section revenue-panel"><div className="section-heading"><div><span className="section-kicker">{t('orderSummary')}</span><h2>{t('incomingOrders')}</h2></div><span className="summary-period">{t('summaryPeriodAugust')}</span></div><strong className="revenue-value">{dashboard.valueSummary.value}</strong><p className="muted">{dashboard.valueSummary.detail}</p><Link className="text-link" to="/dashboard/supplier/orders">{t('viewIncomingOrders')}</Link></section><section className="dashboard-section"><div className="section-heading"><div><span className="section-kicker">{t('retailerDemand')}</span><h2>{t('recentIncomingOrders')}</h2></div><span className="section-count">{t('shownCounter', { count: dashboard.recentOrders.length })}</span></div>{dashboard.recentOrders.length ? <div className="order-list">{dashboard.recentOrders.map((order) => <IncomingOrderCard key={order.id} linkTo={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`} order={order} />)}</div> : <EmptyState title={t('noPendingOrders')} message={t('incomingOrdersWillAppear')} />}</section></div></section>
}
