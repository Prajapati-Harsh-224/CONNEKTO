import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getShopAnalytics } from '../services/shopAnalyticsService.js'
import { getOrders } from '../services/orderService.js'

const formatPrice = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`
const monthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' })

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function productName(item) {
  return item.productNameSnapshot || item.name || item.productName || 'Product'
}

function deriveAnalytics(orders, period) {
  const now = new Date()
  const monthCount = period === 'Last 3 months' ? 3 : period === 'This Month' ? 1 : 6
  const start = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1)
  const inRange = orders.filter((order) => new Date(order.createdAt) >= start)
  const monthBuckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthCount + index + 1, 1)
    return { label: monthLabel(date), value: 0 }
  })
  inRange.forEach((order) => {
    const date = new Date(order.createdAt)
    const index = (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth()
    if (monthBuckets[index]) monthBuckets[index].value += Number(order.subtotal || 0)
  })
  const supplierMap = new Map()
  const productMap = new Map()
  inRange.forEach((order) => {
    supplierMap.set(order.supplierName, (supplierMap.get(order.supplierName) || 0) + Number(order.subtotal || 0))
    ;(order.items || []).forEach((item) => {
      const name = productName(item)
      const existing = productMap.get(name) || { name, quantity: 0, packSize: item.packSize || item.packSizeSnapshot || '', category: item.category || 'Products', imageUrl: item.imageUrl || item.productImageUrlSnapshot || '', imageLabel: name.slice(0, 1) }
      existing.quantity += Number(item.quantity || 0)
      productMap.set(name, existing)
    })
  })
  const supplierSpending = [...supplierMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  return { ordersOverTime: monthBuckets, supplierSpending, topProducts: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5), totalOrderValue: inRange.reduce((sum, order) => sum + Number(order.subtotal || 0), 0), isDemoData: !orders.length }
}

function TrendChart({ items }) {
  const maximum = Math.max(...items.map((item) => item.value), 1)
  const points = items.map((item, index) => `${(index / Math.max(items.length - 1, 1)) * 100},${92 - (item.value / maximum) * 72}`).join(' ')
  const areaPoints = `0,92 ${points} 100,92`
  return <div className="analytics-trend-chart"><div className="analytics-y-axis"><span>{formatPrice(maximum)}</span><span>{formatPrice(maximum * .66)}</span><span>{formatPrice(maximum * .33)}</span><span>Rs 0</span></div><div className="analytics-chart-area"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Spending trend chart" role="img"><polygon className="analytics-area-fill" points={areaPoints} /><polyline className="analytics-line" points={points} /></svg><div className="analytics-points">{items.map((item, index) => <span key={`${item.label}-${index}`} style={{ left: `${(index / Math.max(items.length - 1, 1)) * 100}%`, bottom: `${8 + (item.value / maximum) * 72}%` }} title={`${item.label}: ${formatPrice(item.value)}`} />)}</div><div className="analytics-x-axis">{items.map((item) => <span key={item.label}>{item.label}</span>)}</div></div></div>
}

export default function ShopOwnerAnalyticsPage() {
  const { t } = useLocale()
  const [analytics, setAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const [period, setPeriod] = useState('Last 6 months')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getShopAnalytics(), getOrders()]).then(([analyticsResponse, ordersResponse]) => {
      setAnalytics(analyticsResponse.data)
      setOrders(ordersResponse.data.orders || [])
    }).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  const data = useMemo(() => {
    const derived = deriveAnalytics(orders, period)
    const hasOrderData = orders.length > 0
    return {
      ...derived,
      ordersOverTime: !hasOrderData && analytics?.ordersOverTime?.length ? analytics.ordersOverTime : derived.ordersOverTime,
      supplierSpending: !hasOrderData && analytics?.supplierSpending?.length ? analytics.supplierSpending : derived.supplierSpending,
      topProducts: !hasOrderData && analytics?.topProducts?.length ? analytics.topProducts : derived.topProducts,
      totalOrderValue: analytics?.totalOrderValue || derived.totalOrderValue,
    }
  }, [analytics, orders, period])

  if (isLoading) return <LoadingState message={t('loadingAnalytics')} />
  if (error) return <section className="analytics-page analytics-error"><div className="analytics-breadcrumb">{t('shopOwner')} <span>›</span> {t('analytics')}</div><h1>{t('analyticsUnavailable')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>
  if (!analytics) return <EmptyState title={t('noAnalytics')} message={t('orderActivityAppears')} />

  const maxSupplierValue = Math.max(...data.supplierSpending.map((item) => item.value), 1)
  return <section className="analytics-page analytics-redesign">
    <div className="analytics-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{t('analytics')}</span></div>
    <div className="analytics-heading"><div><h1>{t('analytics')}</h1><p>{t('analyticsSubtitle')}</p></div><label className="analytics-period"><span aria-hidden="true">▣</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This Month</option><option>Last 3 months</option><option>Last 6 months</option></select><span>⌄</span></label></div>
    <div className="analytics-top-grid"><section className="analytics-modern-card analytics-spending-card"><div className="analytics-card-heading"><div><span className="analytics-card-icon">▥</span><div><h2>{t('spendingTrend')}</h2><p>{t('spendingTrendSubtitle')}</p></div></div><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This Month</option><option>Last 3 months</option><option>Last 6 months</option></select></div>{data.ordersOverTime.length ? <TrendChart items={data.ordersOverTime} /> : <EmptyState title={t('noOrderTrendYet')} message={t('orderActivityCharted')} />}</section><section className="analytics-modern-card analytics-suppliers-card"><div className="analytics-card-heading"><div><span className="analytics-card-icon">▣</span><div><h2>{t('topSuppliers')}</h2><p>{t('topSuppliersSubtitle')}</p></div></div></div>{data.supplierSpending.length ? <div className="analytics-supplier-list">{data.supplierSpending.map((supplier, index) => <div className="analytics-supplier-row" key={supplier.name}><b>{index + 1}</b><span>{initials(supplier.name)}</span><strong>{supplier.name}</strong><em>{formatPrice(supplier.value)}</em><div className="analytics-supplier-bar"><i style={{ width: `${(supplier.value / maxSupplierValue) * 100}%` }} /></div><small>{Math.round((supplier.value / data.supplierSpending.reduce((sum, item) => sum + item.value, 0)) * 100)}%</small></div>)}</div> : <EmptyState title={t('noSupplierSpending')} message={t('supplierTotalsAppear')} />}</section></div>
    <section className="analytics-modern-card analytics-products-card"><div className="analytics-card-heading"><div><span className="analytics-card-icon">◇</span><div><h2>{t('mostPurchasedProducts')}</h2><p>{t('mostPurchasedProductsSubtitle')}</p></div></div><Link to="/dashboard/shop-owner/suppliers">{t('viewAllProducts')} →</Link></div>{data.topProducts.length ? <div className="analytics-product-list">{data.topProducts.map((product) => <article className="analytics-product-card" key={product.name}><ProductImage className="analytics-product-image" alt={`${product.name} product`} fallbackText={product.imageLabel || product.name.slice(0, 1)} src={product.imageUrl || product.imageLabel || ''} /><div><strong>{product.name}</strong><span>{product.packSize || t('productPackNotAvailable')}</span><b>{product.quantity} {t('units')}</b><small>{product.category}</small></div></article>)}</div> : <EmptyState title={t('noProductData')} message={t('requestedProductsWillAppear')} />}</section>
    <section className="analytics-insight-card"><span className="analytics-insight-icon">♧</span><div><h2>{t('insight')}</h2><p>{data.totalOrderValue ? `${t('insightBasedOn')} ${formatPrice(data.totalOrderValue)}.` : t('insightNoData')}</p></div><Link to="/dashboard/shop-owner/suppliers">{t('keepStocking')} →</Link></section>
  </section>
}
