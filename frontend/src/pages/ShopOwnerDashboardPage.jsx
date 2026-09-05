import EmptyState from '../components/EmptyState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import OrderCard from '../components/OrderCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { shopOwnerDemoData } from '../utils/shopOwnerDemoData.js'

export default function ShopOwnerDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const { metrics, recentOrders, revenue } = shopOwnerDemoData
  const firstName = user?.name?.split(' ')[0] || 'there'

  return <section className="dashboard-page">
    <div className="dashboard-heading"><div><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('goodMorning')} {firstName}.</h1><p className="muted">{t('hereIsLatestView')}</p></div><span className="demo-label">{t('demoData')}</span></div>
    <div className="metric-grid">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>
    <div className="dashboard-grid">
      <section className="dashboard-section revenue-panel"><div className="section-heading"><div><span className="section-kicker">{t('orderSummary')}</span><h2>{t('monthlyValue')}</h2></div><span className="summary-period">{t('summaryPeriodAugust')}</span></div><strong className="revenue-value">{revenue.value}</strong><p className="muted">{revenue.detail}</p><div className="summary-line"><span>{t('averageOrderValue')}</span><strong>Rs 2,011</strong></div><div className="summary-line"><span>{t('suppliersUsed')}</span><strong>2</strong></div></section>
      <section className="dashboard-section"><div className="section-heading"><div><span className="section-kicker">{t('activityLabel')}</span><h2>{t('recentOrders')}</h2></div><span className="section-count">{t('shownCounter', { count: recentOrders.length })}</span></div>{recentOrders.length ? <div className="order-list">{recentOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div> : <EmptyState title={t('noOrdersYetTitle')} message={t('recentSupplierOrdersAppear')} />}</section>
    </div>
  </section>
}
