import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogDashboard } from '../services/gruhUdyogService.js'

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
  if (error) return <section className="dashboard-page"><div className="eyebrow">{t('gruhUdyogWorkspace')}</div><h1>{t('dashboardUnavailable')}</h1><p className="form-message error" role="alert">{error}</p></section>
  if (!dashboard) return null

  return (
    <section className="dashboard-page supplier-dashboard">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">{t('gruhUdyogWorkspace')}</div>
          <h1>{dashboard.businessName}.</h1>
          <p className="muted">{t('gruhUdyogDashboardMessage')}</p>
        </div>
        <span className="demo-label">{t('demoData')}</span>
      </div>

      <div className="metric-grid">
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} label={t(metric.label.toLowerCase().replace(/\s+/g, '')) || metric.label} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">{t('recentRetailRequests')}</span>
              <h2>{t('recentOrders')}</h2>
            </div>
            <span className="section-count">{dashboard.orders.length}</span>
          </div>
          <div className="order-list">
            {dashboard.orders.slice(0, 3).map((order) => (
              <article className="order-card" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <span>{order.shopOwner}</span>
                </div>
                <div className="order-card-meta">
                  <strong>Rs {Number(order.amount).toLocaleString('en-IN')}</strong>
                  <span className={`status-badge status-${String(order.status).toLowerCase().replaceAll(' ', '-')}`}>{t(order.status.toLowerCase().replace(/\s+/g, '')) || order.status}</span>
                </div>
                <small>{order.date}</small>
              </article>
            ))}
          </div>
          <Link className="text-link" to="/dashboard/gruh-udyog/orders">{t('viewIncomingOrders')}</Link>
        </section>
      </div>
    </section>
  )
}
