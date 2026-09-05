import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsList from '../components/AnalyticsList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getSupplierAnalytics } from '../services/supplierAnalyticsService.js'

const formatPrice = (value) => `Rs ${Number(value).toLocaleString('en-IN')}`

export default function SupplierAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSupplierAnalytics().then((response) => setAnalytics(response.data)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message="Loading supplier analytics..." />
  if (error) return <section className="analytics-page"><div className="eyebrow">Supplier workspace</div><h1>Analytics unavailable.</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">Try again</button></section>
  if (!analytics) return <EmptyState title="No analytics available" message="Incoming order activity will appear here once data is available." />

  const metrics = [
    { label: 'Orders received', value: analytics.ordersReceived, detail: 'Orders assigned to you', accent: 'metric-primary' },
    { label: 'Order value', value: formatPrice(analytics.orderValue), detail: 'Estimated incoming value', accent: 'metric-success' },
  ]
  const customerItems = analytics.topCustomers.map((customer) => ({ ...customer, label: `${customer.name} · ${customer.orders} orders` }))

  return <section className="analytics-page supplier-analytics-page"><Link className="back-link" to="/dashboard/supplier">← Back to dashboard</Link><div className="analytics-heading"><div><div className="eyebrow">Supplier workspace</div><h1>See what moves.</h1><p className="muted">A simple view of retailer demand across your incoming orders.</p></div>{analytics.isDemoData && <span className="demo-label">Prototype data</span>}</div><div className="metric-grid supplier-analytics-metrics">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div><div className="analytics-grid"><section className="analytics-panel"><div className="section-heading"><div><span className="section-kicker">Top products</span><h2>Most requested</h2></div></div>{analytics.topProducts.length ? <AnalyticsList items={analytics.topProducts.map((item) => ({ ...item, label: `${item.name} · ${item.quantity} units` }))} labelKey="label" valueFormatter={(value) => `${value} units`} valueKey="quantity" /> : <EmptyState title="No product data" message="Requested products will appear here." />}</section><section className="analytics-panel"><div className="section-heading"><div><span className="section-kicker">Top customers</span><h2>Retailer demand</h2></div></div>{analytics.topCustomers.length ? <AnalyticsList items={customerItems} labelKey="label" valueFormatter={formatPrice} valueKey="value" /> : <EmptyState title="No customer data" message="Retailer order patterns will appear here." />}</section><section className="analytics-panel status-distribution-panel"><div className="section-heading"><div><span className="section-kicker">Pending vs completed</span><h2>Order progress</h2></div></div><div className="supplier-status-summary"><div><StatusBadge status="Pending" /><strong>{analytics.orderStatus.pending}</strong><span>in progress</span></div><div><StatusBadge status="Delivered" /><strong>{analytics.orderStatus.completed}</strong><span>completed</span></div></div><div className="progress-track"><span style={{ width: `${(analytics.orderStatus.completed / Math.max(analytics.ordersReceived, 1)) * 100}%` }} /></div></section></div></section>
}
