import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiTrendingUp, FiTruck, FiBox, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getShopAnalytics } from '../services/shopAnalyticsService.js'
import { getOrders } from '../services/orderService.js'

const formatPrice = (value) => `Rs\u00A0${Number(value || 0).toLocaleString('en-IN')}`
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
      ; (order.items || []).forEach((item) => {
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
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const totalValue = items.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const averageValue = items.length > 0 ? totalValue / items.length : 0

  const width = 520
  const height = 185
  const padding = { top: 32, right: 28, bottom: 26, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const baselineY = padding.top + chartHeight

  const rawMax = Math.max(...items.map((item) => Number(item.value || 0)), 0)
  const niceMax = rawMax <= 0 ? 500 : Math.ceil((rawMax * 1.25) / 100) * 100
  const ticks = [niceMax, Math.round(niceMax / 2), 0]

  const colWidth = items.length > 1 ? chartWidth / (items.length - 1) : chartWidth
  const points = items.map((item, index) => {
    const x = items.length === 1 ? padding.left + chartWidth / 2 : padding.left + colWidth * index
    const y = baselineY - (Number(item.value || 0) / niceMax) * chartHeight
    return { ...item, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  })

  const maxPointIndex = useMemo(() => {
    let bestIdx = points.length - 1
    let bestVal = -1
    points.forEach((pt, idx) => {
      if (pt.value > bestVal) {
        bestVal = pt.value
        bestIdx = idx
      }
    })
    return bestVal > 0 ? bestIdx : -1
  }, [points])

  const activeIndex = hoveredIndex !== null ? hoveredIndex : maxPointIndex
  const activePoint = activeIndex >= 0 ? points[activeIndex] : null

  const linePath = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const areaPath = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y} L ${points[0].x + 20} ${baselineY} L ${points[0].x - 20} ${baselineY} Z`
    : `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`

  return (
    <div className="space-y-3 pt-1">
      {/* Metric summary header */}
      <div className="flex items-baseline justify-between px-1">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {hoveredIndex !== null ? `${items[hoveredIndex].label} Spending` : 'Total Spent'}
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{Number(hoveredIndex !== null ? items[hoveredIndex].value : totalValue).toLocaleString('en-IN')}
          </div>
        </div>
        {items.length > 1 && (
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400">Monthly Avg</span>
            <div className="text-xs font-bold text-slate-600">
              ₹{Math.round(averageValue).toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full max-w-full overflow-hidden">
        <svg
          className="w-full h-auto overflow-hidden select-none"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Spending trend chart"
        >
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f06535" stopOpacity="0.14" />
              <stop offset="90%" stopColor="#f06535" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines & Y-axis labels */}
          {ticks.map((tick) => {
            const y = baselineY - (tick / niceMax) * chartHeight
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke={tick === 0 ? '#e2e8f0' : '#f1f5f9'}
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                >
                  ₹{tick >= 1000 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : tick}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#spendingGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#ea580c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active vertical guideline */}
          {activePoint && (
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top - 8}
              y2={baselineY}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Data points */}
          {points.map((point, index) => {
            const isHovered = activeIndex === index
            const isZero = point.value === 0

            return (
              <g key={`point-${point.label}-${index}`}>
                {isHovered && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="#f06535"
                    fillOpacity="0.15"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 4.5 : isZero ? 2.5 : 3.5}
                  fill={isZero && !isHovered ? '#cbd5e1' : '#ffffff'}
                  stroke={isZero && !isHovered ? '#cbd5e1' : '#ea580c'}
                  strokeWidth={isZero && !isHovered ? 1 : 2}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          {/* Tooltip badge on active point */}
          {activePoint && (
            <g
              key="tooltip-bubble"
              className="pointer-events-none transition-all duration-150"
            >
              <rect
                x={Math.max(padding.left, Math.min(width - padding.right - 64, activePoint.x - 32))}
                y={Math.max(6, activePoint.y - 24)}
                width="64"
                height="18"
                rx="5"
                fill="#0f172a"
                className="shadow-sm"
              />
              <text
                x={Math.max(padding.left + 32, Math.min(width - padding.right - 32, activePoint.x))}
                y={Math.max(18, activePoint.y - 12)}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
              >
                ₹{Number(activePoint.value).toLocaleString('en-IN')}
              </text>
            </g>
          )}

          {/* X-axis Month Labels */}
          {points.map((point, index) => {
            const isHovered = activeIndex === index
            return (
              <text
                key={`label-${point.label}-${index}`}
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fill={isHovered ? '#ea580c' : '#64748b'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                className="transition-colors duration-150"
              >
                {point.label}
              </text>
            )
          })}

          {/* Interactive touch/hover column zones */}
          {points.map((point, index) => {
            const step = items.length > 1 ? chartWidth / (items.length - 1) : chartWidth
            const xZone = items.length === 1 ? padding.left : point.x - step / 2
            const wZone = items.length === 1 ? chartWidth : step

            return (
              <rect
                key={`hit-${point.label}-${index}`}
                x={xZone}
                y={padding.top - 12}
                width={wZone}
                height={chartHeight + 36}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            )
          })}
        </svg>
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

  const loadData = () => {
    setIsLoading(true)
    setError('')
    Promise.allSettled([getShopAnalytics(), getOrders()])
      .then(([analyticsResult, ordersResult]) => {
        if (analyticsResult.status === 'fulfilled') {
          setAnalytics(analyticsResult.value.data)
        }
        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.data?.orders || [])
        }
        if (analyticsResult.status === 'rejected' && ordersResult.status === 'rejected') {
          setError(analyticsResult.reason?.message || t('networkError'))
        } else if (analyticsResult.status === 'rejected') {
          // If orders succeeded but analytics endpoint had an error, fallback to derived analytics
          setAnalytics({ isDemoData: false, ordersOverTime: [], supplierSpending: [], topProducts: [], totalOrderValue: 0 })
        }
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const data = useMemo(() => {
    const derived = deriveAnalytics(orders, period)
    const hasOrderData = orders.length > 0
    return {
      ...derived,
      ordersOverTime: !hasOrderData && analytics?.ordersOverTime?.length ? analytics.ordersOverTime : derived.ordersOverTime,
      supplierSpending: !hasOrderData && analytics?.supplierSpending?.length ? analytics.supplierSpending : derived.supplierSpending,
      topProducts: !hasOrderData && analytics?.topProducts?.length ? analytics.topProducts : derived.topProducts,
      totalOrderValue: analytics?.totalOrderValue ?? derived.totalOrderValue,
    }
  }, [analytics, orders, period])

  if (isLoading) return <LoadingState message={t('loadingAnalytics')} />
  if (error) {
    return (
      <section className="space-y-4 w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{t('analytics')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('analyticsUnavailable')}</h1>
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
        <button className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer" onClick={loadData} type="button">
          {t('tryAgain')}
        </button>
      </section>
    )
  }
  if (!analytics) return <EmptyState title={t('noAnalytics')} message={t('orderActivityAppears')} />

  const maxSupplierValue = Math.max(...data.supplierSpending.map((item) => item.value), 1)

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0">
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
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>This Month</option>
            <option>Last 3 months</option>
            <option>Last 6 months</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0 max-w-full">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4 w-full min-w-0 max-w-full">
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
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {data.topProducts.map((product) => (
              <article className="p-2 sm:p-3 md:p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-1.5 sm:space-y-2" key={product.name}>
                <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                  <ProductImage className="w-full h-full object-cover" alt={`${product.name} product`} fallbackText={product.imageLabel || product.name.slice(0, 1)} src={product.imageUrl || product.imageLabel || ''} />
                </div>
                <div>
                  <strong className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 block truncate" title={product.name}>{product.name}</strong>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400 block truncate">{product.packSize || t('productPackNotAvailable')}</span>
                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 border-t border-slate-100">
                    <b className="text-[10px] sm:text-xs font-black text-brand-orange truncate">{product.quantity} {t('units')}</b>
                    <small className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate ml-1">{product.category}</small>
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


