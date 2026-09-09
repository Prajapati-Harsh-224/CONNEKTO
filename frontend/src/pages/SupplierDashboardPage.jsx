import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { supplierDashboardDemoData } from '../utils/supplierDashboardDemoData.js'

export default function SupplierDashboardPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const dashboard = supplierDashboardDemoData
  const recentOrders = useMemo(() => dashboard.recentOrders.map((order) => ({
    ...order,
    amountLabel: `₹${Number(order.amount).toLocaleString('en-IN')}`,
  })), [dashboard])

  return (
    <section className="supplier-dashboard-page">
      <header className="supplier-dashboard-header">
        <div>
          <p className="supplier-dashboard-greeting">{t('goodMorning')}</p>
          <h1>{dashboard.businessName}</h1>
          <p className="supplier-dashboard-subtitle">Manage your orders, products and customers from one place.</p>
        </div>
        <span className="demo-label">{t('demoData')}</span>
      </header>

      <div className="supplier-summary-grid">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            accent={metric.accent}
            actionTo={metric.actionTo}
            detail={metric.detail}
            icon={metric.icon}
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
