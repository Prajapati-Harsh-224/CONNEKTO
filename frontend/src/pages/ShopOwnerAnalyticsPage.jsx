import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsList from '../components/AnalyticsList.jsx'
import BarChart from '../components/BarChart.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getShopAnalytics } from '../services/shopAnalyticsService.js'

const formatPrice = (value) => `Rs ${Number(value).toLocaleString('en-IN')}`

export default function ShopOwnerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getShopAnalytics().then((response) => setAnalytics(response.data)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message="Loading your analytics..." />
  if (error) return <section className="analytics-page"><div className="eyebrow">Shop Owner workspace</div><h1>Analytics unavailable.</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">Try again</button></section>
  if (!analytics) return <EmptyState title="No analytics available" message="Order activity will appear here once data is available." />

  return <section className="analytics-page"><Link className="back-link" to="/dashboard/shop-owner">← Back to dashboard</Link><div className="analytics-heading"><div><div className="eyebrow">Shop Owner workspace</div><h1>Know your buying rhythm.</h1><p className="muted">Simple order activity from your Connecto workspace.</p></div>{analytics.isDemoData && <span className="demo-label">Prototype data</span>}</div><section className="analytics-total"><span className="section-kicker">Total order value</span><strong>{formatPrice(analytics.totalOrderValue)}</strong><span>{analytics.isDemoData ? 'Illustrative demo period' : 'Based on your available orders'}</span></section><div className="analytics-grid"><section className="analytics-panel chart-panel"><div className="section-heading"><div><span className="section-kicker">Orders over time</span><h2>Monthly order count</h2></div></div>{analytics.ordersOverTime.length ? <BarChart items={analytics.ordersOverTime} /> : <EmptyState title="No order trend yet" message="Order activity will be charted here." />}</section><section className="analytics-panel"><div className="section-heading"><div><span className="section-kicker">Supplier-wise spending</span><h2>Where you order</h2></div></div>{analytics.supplierSpending.length ? <AnalyticsList items={analytics.supplierSpending} labelKey="name" valueFormatter={formatPrice} valueKey="value" /> : <EmptyState title="No supplier spending" message="Supplier totals will appear here." />}</section><section className="analytics-panel"><div className="section-heading"><div><span className="section-kicker">Top products</span><h2>Most ordered</h2></div></div>{analytics.topProducts.length ? <AnalyticsList items={analytics.topProducts.map((item) => ({ ...item, label: `${item.name} · ${item.quantity} units` }))} labelKey="label" valueFormatter={(value) => `${value} units`} valueKey="quantity" /> : <EmptyState title="No top products" message="Product patterns will appear here." />}</section><section className="analytics-panel"><div className="section-heading"><div><span className="section-kicker">Order status distribution</span><h2>Current statuses</h2></div></div>{analytics.statusDistribution.length ? <div className="status-analytics-list">{analytics.statusDistribution.map((item) => <div className="status-analytics-row" key={item.status}><StatusBadge status={item.status} /><strong>{item.count}</strong><span>{item.count === 1 ? 'order' : 'orders'}</span></div>)}</div> : <EmptyState title="No status data" message="Order statuses will appear here." />}</section></div></section>
}
