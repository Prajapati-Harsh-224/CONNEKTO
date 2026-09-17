import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiChevronDown, FiTrendingUp, FiTruck, FiBox, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
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
  const points = items.map((item, index) => `${(index / Math.max(items.length - 1, 1)) * 100},${90 - (item.value / maximum) * 70}`).join(' ')
  const areaPoints = `0,90 ${points} 100,90`

  return (
    <div className="space-y-4 pt-2">
      <div className="relative w-full h-44 sm:h-52">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Spending trend chart" role="img">
          <defs>
            <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#spendingGrad)" points={areaPoints} />
          <polyline fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
        </svg>

        {items.map((item, index) => (
          <span 
            key={`${item.label}-${index}`} 
            className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-orange shadow-xs -ml-1 -mb-1"
            style={{ 
              left: `${(index / Math.max(items.length - 1, 1)) * 100}%`, 
              bottom: `${10 + (item.value / maximum) * 70}%` 
            }} 
            title={`${item.label}: ${formatPrice(item.value)}`} 
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-slate-100 pt-2 px-1">
        {items.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  )
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
  if (error) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{t('analytics')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('analyticsUnavailable')}</h1>
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
        <button className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer" onClick={() => window.location.reload()} type="button">
          {t('tryAgain')}
        </button>
      </section>
    )
  }
  if (!analytics) return <EmptyState title={t('noAnalytics')} message={t('orderActivityAppears')} />

  const maxSupplierValue = Math.max(...data.supplierSpending.map((item) => item.value), 1)

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>{t('shopOwner')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('analytics')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('analytics')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('analyticsSubtitle')}</p>
        </div>
        <label className="relative inline-flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange">
          <span className="text-slate-400 mr-2 text-sm" aria-hidden="true"><FiCalendar /></span>
          <select 
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden pr-6 cursor-pointer" 
            value={period} 
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>This Month</option>
            <option>Last 3 months</option>
            <option>Last 6 months</option>
          </select>
          <span className="text-slate-400 ml-auto pointer-events-none text-xs"><FiChevronDown /></span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg">
                <FiTrendingUp />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('spendingTrend')}</h2>
                <p className="text-xs text-slate-400">{t('spendingTrendSubtitle')}</p>
              </div>
            </div>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600 font-semibold focus:outline-hidden"
              value={period} 
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>This Month</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>
          {data.ordersOverTime.length ? <TrendChart items={data.ordersOverTime} /> : <EmptyState title={t('noOrderTrendYet')} message={t('orderActivityCharted')} />}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 text-lg">
              <FiTruck />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('topSuppliers')}</h2>
              <p className="text-xs text-slate-400">{t('topSuppliersSubtitle')}</p>
            </div>
          </div>

          {data.supplierSpending.length ? (
            <div className="divide-y divide-slate-100">
              {data.supplierSpending.map((supplier, index) => {
                const totalSpending = data.supplierSpending.reduce((sum, item) => sum + item.value, 0)
                const percentage = Math.round((supplier.value / (totalSpending || 1)) * 100)
                return (
                  <div className="flex items-center justify-between gap-3 py-3" key={supplier.name}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <b className="text-xs font-bold text-slate-400 w-4">{index + 1}</b>
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 shrink-0">
                        {initials(supplier.name)}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1 pr-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <strong className="font-semibold text-slate-800 truncate">{supplier.name}</strong>
                          <span className="font-bold text-slate-900">{formatPrice(supplier.value)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-brand-orange rounded-full" style={{ width: `${(supplier.value / maxSupplierValue) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <small className="text-xs font-bold text-slate-400 shrink-0">{percentage}%</small>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title={t('noSupplierSpending')} message={t('supplierTotalsAppear')} />
          )}
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600 text-lg">
              <FiBox />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('mostPurchasedProducts')}</h2>
              <p className="text-xs text-slate-400">{t('mostPurchasedProductsSubtitle')}</p>
            </div>
          </div>
          <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner/suppliers">
            {t('viewAllProducts')} <FiArrowRight />
          </Link>
        </div>

        {data.topProducts.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {data.topProducts.map((product) => (
              <article className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-2" key={product.name}>
                <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                  <ProductImage className="w-full h-full object-cover" alt={`${product.name} product`} fallbackText={product.imageLabel || product.name.slice(0, 1)} src={product.imageUrl || product.imageLabel || ''} />
                </div>
                <div>
                  <strong className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={product.name}>{product.name}</strong>
                  <span className="text-[11px] text-slate-400 block truncate">{product.packSize || t('productPackNotAvailable')}</span>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                    <b className="text-xs font-black text-brand-orange">{product.quantity} {t('units')}</b>
                    <small className="text-[10px] uppercase font-bold text-slate-400 truncate">{product.category}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('noProductData')} message={t('requestedProductsWillAppear')} />
        )}
      </section>

      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-orange text-white text-xl shrink-0 shadow-xs">
            <HiSparkles />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">{t('insight')}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {data.totalOrderValue ? `${t('insightBasedOn')} ${formatPrice(data.totalOrderValue)}.` : t('insightNoData')}
            </p>
          </div>
        </div>
        <Link className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-orange-200 text-xs font-bold text-brand-orange hover:bg-orange-50 transition-all shadow-xs shrink-0 self-start sm:self-auto" to="/dashboard/shop-owner/suppliers">
          {t('keepStocking')} <FiArrowRight />
        </Link>
      </section>
    </section>
  )
}


