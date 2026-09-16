import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPackage, FiClock, FiCheckCircle } from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
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

export default function SupplierDashboardPage() {
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

  const recentOrders = useMemo(() => (dashboard?.recentOrders || []).map((order) => ({
    ...order,
    shopOwner: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    location: order.serviceArea || '—',
    items: (order.items || []).length,
    amountLabel: `₹${Number(order.amount || order.subtotal || 0).toLocaleString('en-IN')}`,
    date: order.createdAt,
  })), [dashboard])

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />
  if (error) return <section className="supplier-dashboard-page"><p className="form-message error" role="alert">{error}</p></section>
  if (!dashboard) return <section className="supplier-dashboard-page"><p className="form-message error" role="alert">Supplier dashboard unavailable.</p></section>

  return (
    <section className="supplier-dashboard-page">
      <header className="supplier-dashboard-header">
        <div>
          <p className="supplier-dashboard-greeting">{getDynamicGreeting()}</p>
          <h1>{dashboard.businessName}</h1>
          <p className="supplier-dashboard-subtitle">Manage your orders, products and customers from one place.</p>
        </div>
      </header>


      <div className="supplier-summary-grid">
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

      <div className="supplier-main-panel">
        <div className="supplier-orders-header">
          <div>
            <span className="supplier-section-kicker">Recent Orders</span>
            <h2>Recent Orders</h2>
          </div>
          <button className="supplier-view-all" onClick={() => navigate('/dashboard/supplier/orders')} type="button">
            View All Orders <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="supplier-orders-table" role="table" aria-label="Recent supplier orders">
          <div className="supplier-orders-head" role="row">
            <span role="columnheader">Order ID</span>
            <span role="columnheader">Customer (Shop)</span>
            <span role="columnheader">Items</span>
            <span role="columnheader">Amount</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Date &amp; Time</span>
            <span aria-hidden="true" />
          </div>

          {recentOrders.map((order) => (
            <div className="supplier-orders-row" key={order.id} role="row">
              <span role="cell"><strong>{order.id}</strong></span>
              <span role="cell">
                <span className="supplier-order-shop-name">{order.shopOwner}</span>
                <small>{order.location}</small>
              </span>
              <span role="cell">{order.items} items</span>
              <span role="cell">{order.amountLabel}</span>
              <span role="cell"><StatusBadge status={order.status} /></span>
              <span role="cell">{order.date}</span>
              <button className="supplier-row-action" onClick={() => navigate(`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`)} type="button">View</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
