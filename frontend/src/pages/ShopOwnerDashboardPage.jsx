import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { shopOwnerDemoData } from '../utils/shopOwnerDemoData.js'

const cardIcons = {
  'Total orders': '▱',
  'Pending orders': '◷',
  'Monthly spending': '▣',
}

export default function ShopOwnerDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const { metrics, revenue, recentOrders } = shopOwnerDemoData
  const firstName = user?.name?.split(' ')[0] || 'there'

  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  const summaryCards = [
    { label: t('totalOrders'), value: metrics.find((metric) => metric.label === 'Total orders')?.value || '0', detail: t('acrossAllSuppliers'), icon: cardIcons['Total orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('pendingOrders'), value: metrics.find((metric) => metric.label === 'Pending orders')?.value || '0', detail: t('needYourAttention'), icon: cardIcons['Pending orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('monthlySpending'), value: revenue.value, detail: t('acrossTwoSuppliers'), icon: cardIcons['Monthly spending'], actionTo: '/dashboard/shop-owner/analytics' },
  ]

  const deliveries = [
    { supplier: 'Narmada Wholesale', orderId: '#CO-1042', time: 'Today, 4:30 PM', status: 'On the way' },
    { supplier: 'Kesar Supply Co.', orderId: '#CO-1041', time: 'Today, 6:00 PM', status: 'Preparing' },
    { supplier: 'Shree Traders', orderId: '#CO-1038', time: 'Today, 8:15 PM', status: 'On the way' },
  ]

  return (
    <section className="shop-owner-dashboard">
      <header className="shop-owner-dashboard-header">
        <div>
          <h1>{t('goodMorning')} {firstName} 👋</h1>
          <p>{t('hereIsLatestView')}</p>
        </div>
        <div className="shop-owner-date-pill">{todayLabel}</div>
      </header>

      <div className="summary-card-grid">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            accent={card.accent}
            detail={card.detail}
            icon={card.icon}
            label={card.label}
            actionTo={card.actionTo}
            value={card.value}
          />
        ))}
      </div>

      <div className="shop-owner-lower-grid">
        <section className="data-panel recent-orders-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon accent-orange" aria-hidden="true">▤</span>
              <h2>{t('recentOrders')}</h2>
            </div>
            <Link className="panel-link" to="/dashboard/shop-owner/orders">{t('viewAll')} →</Link>
          </div>
          <div className="recent-orders-table" role="table" aria-label={t('recentOrders')}>
            <div className="recent-orders-head" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">{t('supplier')}</span>
              <span role="columnheader">{t('amount')}</span>
              <span role="columnheader">{t('status')}</span>
              <span role="columnheader">{t('date')}</span>
              <span aria-hidden="true" />
            </div>

            {recentOrders.map((order) => (
              <div className="recent-orders-row" key={order.id} role="row">
                <span role="cell">{order.id}</span>
                <span data-label={t('supplier')} role="cell">{order.supplier}</span>
                <span data-label={t('amount')} role="cell">{order.amount}</span>
                <span data-label={t('status')} role="cell"><StatusBadge status={order.status} /></span>
                <span data-label={t('date')} role="cell">{order.date}</span>
                <Link className="row-arrow" to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`} aria-label={`View ${order.id}`}>
                  <span aria-hidden="true">›</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="data-panel deliveries-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon accent-orange" aria-hidden="true">▱</span>
              <h2>{t('todaysDeliveries')}</h2>
            </div>
            <Link className="panel-link" to="/dashboard/shop-owner/orders">{t('viewAll')} →</Link>
          </div>

          {deliveries.length ? <div className="deliveries-list">
            {deliveries.map((delivery) => (
              <div className="delivery-item" key={`${delivery.orderId}-${delivery.supplier}`}>
                <div className="delivery-icon" aria-hidden="true">◇</div>
                <div className="delivery-meta">
                  <div className="delivery-row-top">
                    <strong>{delivery.supplier}</strong>
                    <StatusBadge status={delivery.status} />
                  </div>
                  <div className="delivery-row-bottom">
                    <span>{delivery.orderId}</span>
                    <span>{delivery.time}</span>
                  </div>
                </div>
                <Link className="row-arrow" to={`/dashboard/shop-owner/orders/${encodeURIComponent(delivery.orderId)}`} aria-label={`View ${delivery.orderId}`}>
                  <span aria-hidden="true">›</span>
                </Link>
              </div>
            ))}
          </div> : <EmptyState title={t('noDeliveriesToday')} message={t('noDeliveriesTodayMessage')} />}
        </section>
      </div>

      <section className="dashboard-insight">
        <span className="dashboard-insight-icon" aria-hidden="true">✦</span>
        <div>
          <strong>{t('keepBusinessStocked')}</strong>
          <p>{t('spendingInsight')}</p>
        </div>
        <Link className="panel-link" to="/dashboard/shop-owner/analytics">{t('viewInsights')} →</Link>
      </section>
    </section>
  )
}
