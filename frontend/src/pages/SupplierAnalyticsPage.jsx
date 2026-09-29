import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiChevronDown, FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiBarChart2, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
import { getSupplierAnalytics } from '../services/supplierAnalyticsService.js'
import { useLocale } from '../context/LocaleContext.jsx'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const dateOptions = ['This Month', 'Last 3 months', 'This year']

const emptyAnalytics = {
  isDemoData: false,
  metrics: { sales: 0, orders: 0, customers: 0, productsSold: 0 },
  salesTrend: {
    'Last 6 months': { labels: [], values: [], months: [] },
    'Last 3 months': { labels: [], values: [], months: [] },
    'This year': { labels: [], values: [], months: [] }
  },
  revenueBreakdown: [],
  topProducts: [],
  topCustomers: []
}

function HeaderIcon({ type }) {
  const icons = {
    calendar: <FiCalendar />,
    chevron: <FiChevronDown />,
    rupee: <FiDollarSign />,
    order: <FiShoppingBag />,
    customers: <FiUsers />,
    product: <FiBox />,
    chart: <FiBarChart2 />,
    spark: <HiSparkles />,
    arrow: <FiArrowRight />,
  }

  return <span className="analytics-icon" aria-hidden="true">{icons[type] || <FiBarChart2 />}</span>
}



function SalesTrendChart({ labels, values }) {
  const width = 640
  const height = 240
  const padding = { top: 18, right: 14, bottom: 28, left: 20 }
  const maxValue = Math.max(...values, 60000)
  const minValue = 0
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = values.map((value, index) => {
    const x = padding.left + (chartWidth / Math.max(values.length - 1, 1)) * index
    const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight
    return { x, y, value, label: labels[index] }
  })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  return (
    <div className="sales-chart-wrap">
      <svg className="sales-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Sales trend over the last 6 months">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(79, 193, 132, 0.28)" />
            <stop offset="100%" stopColor="rgba(79, 193, 132, 0.04)" />
          </linearGradient>
        </defs>

        {[0, 20000, 40000, 60000].map((tick) => {
          const y = padding.top + chartHeight - ((tick - minValue) / (maxValue - minValue || 1)) * chartHeight
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(108,125,133,0.18)" strokeWidth="1" />
              <text x={4} y={y + 4} fill="#7c8c96" fontSize="11" fontWeight="600">{tick >= 1000 ? `${(tick / 1000).toFixed(0)}K` : tick}</text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#salesFill)" />
        <path d={linePath} fill="none" stroke="#27b66d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#27b66d" strokeWidth="3" />
          </g>
        ))}

        {points.map((point) => (
          <text key={`${point.label}-text`} x={point.x} y={height - 8} textAnchor="middle" fill="#7c8c96" fontSize="12" fontWeight="600">{point.label}</text>
        ))}
      </svg>
    </div>
  )
}

export default function SupplierAnalyticsPage() {
  const { t } = useLocale()
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('This Month')
  const salesPeriod = 'Last 6 months'

  useEffect(() => {
    let isMounted = true

    getSupplierAnalytics()
      .then((response) => {
        const payload = response?.data || response
        if (isMounted) setAnalytics(payload)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message)
          setAnalytics(emptyAnalytics)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const pageData = useMemo(() => {
    return analytics || emptyAnalytics
  }, [analytics])

  const salesData = useMemo(() => {
    const salesTrend = pageData.salesTrend || emptyAnalytics.salesTrend
    return salesTrend[dateFilter] || salesTrend[salesPeriod] || salesTrend['Last 6 months'] || { labels: [], values: [] }
  }, [pageData, dateFilter, salesPeriod])

  const revenueSegments = useMemo(() => {
    const breakdown = pageData.revenueBreakdown || []
    const total = breakdown.reduce((sum, segment) => sum + Number(segment.value || 0), 0) || 1
    let cursor = 0
    return breakdown.map((segment) => {
      const start = cursor
      const end = cursor + (segment.value / total) * 100
      cursor = end
      return { ...segment, start, end }
    })
  }, [pageData])

  const donutStyle = useMemo(() => {
    if (!revenueSegments.length) return { background: '#e2e8f0' }
    const segments = revenueSegments
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(', ')
    return { background: `conic-gradient(${segments})` }
  }, [revenueSegments])

  if (isLoading) {
    return (
      <section className="supplier-analytics-page loading-page-shell">
        <div className="loading-state"><span className="loading-spinner" aria-hidden="true" /><strong>{t('loadingSupplierAnalytics')}</strong></div>
      </section>
    )
  }

  const metrics = [
    { title: t('totalSales'), value: formatCurrency(pageData.orderValue ?? pageData.metrics?.sales ?? 0), delta: t('currentMonthTotal'), icon: 'rupee', accent: 'green' },
    { title: t('totalOrders'), value: pageData.ordersReceived ?? pageData.metrics?.orders ?? 0, delta: t('totalReceived'), icon: 'order', accent: 'blue' },
    { title: t('pendingOrders'), value: pageData.orderStatus?.pending ?? 0, delta: t('awaitingFulfillment'), icon: 'customers', accent: 'amber' },
    { title: t('completedOrders'), value: pageData.orderStatus?.completed ?? 0, delta: t('successfullyDelivered'), icon: 'product', accent: 'purple' },
  ]


  const metricAccents = {
    green: { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-600' },
    blue: { icon: 'bg-blue-50 text-blue-600 border-blue-100', text: 'text-blue-600' },
    amber: { icon: 'bg-amber-50 text-amber-600 border-amber-100', text: 'text-amber-600' },
    purple: { icon: 'bg-purple-50 text-purple-600 border-purple-100', text: 'text-purple-600' },
  }

  const periodLabelMap = {
    'This Month': 'thisMonth',
    'Last 3 months': 'last3Months',
    'Last 6 months': 'last6Months',
    'This year': 'thisYear',
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>{t('supplier')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('analytics')}</span>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('analytics')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{t('businessPerformance')}</p>
        </div>

        <label className="relative inline-flex items-center shrink-0 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange">
          <span className="text-slate-400 mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"><HeaderIcon type="calendar" /></span>
          <select 
            aria-label={t('selectAnalyticsPeriod')} 
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden cursor-pointer" 
            onChange={(event) => setDateFilter(event.target.value)} 
            value={dateFilter}
          >
            {dateOptions.map((option) => (
              <option key={option} value={option}>{periodLabelMap[option] ? t(periodLabelMap[option]) : option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {metrics.map((metric) => {
          const accent = metricAccents[metric.accent] || metricAccents.blue
          return (
            <article 
              className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all" 
              key={metric.title}
            >
              <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border text-sm sm:text-xl font-bold shrink-0 ${accent.icon}`}>
                  <HeaderIcon type={metric.icon} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{metric.title}</span>
                  <strong className="text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{metric.value}</strong>
                  <small className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{metric.delta}</small>
                </div>
              </div>
              <span className="text-slate-300 shrink-0 hidden sm:inline" aria-hidden="true"><HeaderIcon type="arrow" /></span>
            </article>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 text-lg">
                <HeaderIcon type="chart" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('salesTrend')}</h2>
                <p className="text-xs text-slate-400">{t('salesTrendDescription')}</p>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <SalesTrendChart labels={salesData.months || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} values={salesData.values || [0, 0, 0, 0, 0, 0]} />
          </div>
        </article>

        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600 text-lg">
                <HeaderIcon type="spark" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('revenueBreakdown')}</h2>
                <p className="text-xs text-slate-400">{t('revenueBreakdownDescription')}</p>
              </div>
            </div>
          </div>

          {revenueSegments.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
              <div className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-xs shrink-0" style={donutStyle}>
                <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner text-center px-2">
                  <strong className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate max-w-full">
                    {formatCurrency(pageData.orderValue ?? pageData.metrics?.sales ?? 0)}
                  </strong>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{t('totalSales')}</span>
                </div>
              </div>

              <div className="w-full sm:w-auto space-y-2.5 flex-1 max-w-xs">
                {revenueSegments.map((segment) => (
                  <div className="flex items-center justify-between gap-3 text-xs sm:text-sm" key={segment.name}>
                    <span className="flex items-center gap-2 font-medium text-slate-700 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: segment.color }} />
                      <span className="truncate">{segment.name}</span>
                    </span>
                    <strong className="font-bold text-slate-900">{segment.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs sm:text-sm font-semibold">{t('noRevenueData') || 'No revenue breakdown available yet'}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{t('revenueBreakdownEmpty') || 'Category distribution will appear once orders are placed.'}</p>
            </div>
          )}
        </article>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg">
                <HeaderIcon type="product" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('topSellingProducts')}</h2>
                <p className="text-xs text-slate-400">{t('highestSalesThisMonth')}</p>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/supplier/products">
              {t('viewAll')} <HeaderIcon type="arrow" />
            </Link>
          </div>

          {pageData.topProducts && pageData.topProducts.length > 0 ? (
            <>
              {/* Mobile & Tablet 3-Product Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 lg:hidden">
                {pageData.topProducts.map((product) => (
                  <article
                    key={product.name}
                    className="p-2 sm:p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 text-[10px] sm:text-xs font-bold text-brand-orange shrink-0">
                        {product.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-400">#{product.rank}</span>
                    </div>
                    <div className="min-w-0">
                      <strong className="text-[11px] sm:text-xs font-bold text-slate-900 block truncate" title={product.name}>
                        {product.name}
                      </strong>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                        <span className="text-[10px] sm:text-xs text-brand-orange font-bold truncate">
                          {product.units} {t('unitsSold') || 'sold'}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-slate-900 truncate">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-2">#</th>
                      <th className="pb-3 px-2">{t('product')}</th>
                      <th className="pb-3 px-2">{t('unitsSold')}</th>
                      <th className="pb-3 pl-2 text-right">{t('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pageData.topProducts.map((product) => (
                      <tr className="hover:bg-slate-50/60 transition-colors" key={product.name}>
                        <td className="py-3 pr-2 font-bold text-slate-400">{product.rank}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-[10px] font-bold text-brand-orange shrink-0">
                              {product.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-600 font-medium">{product.units}</td>
                        <td className="py-3 pl-2 text-right font-bold text-slate-900">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <p className="text-xs sm:text-sm font-semibold">{t('noProductData') || 'No product sales recorded yet'}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{t('requestedProductsWillAppear') || 'Sales data will appear here once orders are placed.'}</p>
            </div>
          )}
        </article>

        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 text-lg">
                <HeaderIcon type="customers" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('topCustomers')}</h2>
                <p className="text-xs text-slate-400">{t('customersWithMostOrders')}</p>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/supplier/customers">
              {t('viewAll')} <HeaderIcon type="arrow" />
            </Link>
          </div>

          {pageData.topCustomers && pageData.topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-2">#</th>
                    <th className="pb-3 px-2">{t('customerShop')}</th>
                    <th className="pb-3 px-2">{t('orders')}</th>
                    <th className="pb-3 pl-2 text-right">{t('totalSpent')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.topCustomers.map((customer) => (
                    <tr className="hover:bg-slate-50/60 transition-colors" key={customer.name}>
                      <td className="py-3 pr-2 font-bold text-slate-400">{customer.rank}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 shrink-0">
                            {customer.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-medium">{customer.orders}</td>
                      <td className="py-3 pl-2 text-right font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <p className="text-xs sm:text-sm font-semibold">{t('noCustomers') || 'No customer orders recorded yet'}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{t('customerTotalsAppear') || 'Customer activity will appear here once orders are fulfilled.'}</p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
