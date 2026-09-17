import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiChevronDown, FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiBarChart2, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
import { getSupplierAnalytics } from '../services/supplierAnalyticsService.js'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const dateOptions = ['This Month', 'Last 3 months', 'This year']
const salesPeriodOptions = ['Last 6 months', 'Last 3 months', 'This year']
const revenueOptions = ['This Month']

const emptyAnalytics = {
  isDemoData: false,
  metrics: { sales: 0, orders: 0, customers: 0, productsSold: 0 },
  salesTrend: {
    'Last 6 months': { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], values: [0, 0, 0, 0, 0, 0] },
    'Last 3 months': { labels: ['Jul', 'Aug', 'Sep'], values: [0, 0, 0] },
    'This year': { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], values: [0, 0, 0, 0, 0, 0, 0, 0, 0] }
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
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('This Month')
  const [salesPeriod, setSalesPeriod] = useState('Last 6 months')
  const [revenuePeriod, setRevenuePeriod] = useState('This Month')

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

  const pageData = useMemo(() => analytics || emptyAnalytics, [analytics])

  const salesData = useMemo(() => {
    const salesTrend = pageData.salesTrend || emptyAnalytics.salesTrend
    return salesTrend[salesPeriod] || salesTrend['Last 6 months'] || { labels: [], values: [] }
  }, [pageData, salesPeriod])

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
        <div className="loading-state"><span className="loading-spinner" aria-hidden="true" /><strong>Loading supplier analytics...</strong></div>
      </section>
    )
  }

  const metrics = [
    { title: 'Total Sales', value: formatCurrency(pageData.orderValue ?? pageData.metrics?.sales ?? 0), delta: 'Current month total', icon: 'rupee', accent: 'green' },
    { title: 'Total Orders', value: pageData.ordersReceived ?? pageData.metrics?.orders ?? 0, delta: 'Total received', icon: 'order', accent: 'blue' },
    { title: 'Pending Orders', value: pageData.orderStatus?.pending ?? 0, delta: 'Awaiting fulfillment', icon: 'customers', accent: 'amber' },
    { title: 'Completed Orders', value: pageData.orderStatus?.completed ?? 0, delta: 'Successfully delivered', icon: 'product', accent: 'purple' },
  ]


  const metricAccents = {
    green: { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-600' },
    blue: { icon: 'bg-blue-50 text-blue-600 border-blue-100', text: 'text-blue-600' },
    amber: { icon: 'bg-amber-50 text-amber-600 border-amber-100', text: 'text-amber-600' },
    purple: { icon: 'bg-purple-50 text-purple-600 border-purple-100', text: 'text-purple-600' },
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Supplier</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">Analytics</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">A simple view of your business performance.</p>
        </div>

        <label className="relative inline-flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange">
          <span className="text-slate-400 mr-2 text-sm" aria-hidden="true"><HeaderIcon type="calendar" /></span>
          <select 
            aria-label="Select analytics period" 
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden pr-6 cursor-pointer" 
            onChange={(event) => setDateFilter(event.target.value)} 
            value={dateFilter}
          >
            {dateOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-slate-400 ml-auto pointer-events-none text-xs"><HeaderIcon type="chevron" /></span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {metrics.map((metric) => {
          const accent = metricAccents[metric.accent] || metricAccents.blue
          return (
            <article 
              className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all" 
              key={metric.title}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl border text-xl font-bold shrink-0 ${accent.icon}`}>
                  <HeaderIcon type={metric.icon} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{metric.title}</span>
                  <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{metric.value}</strong>
                  <small className="text-xs text-slate-400 font-medium truncate">{metric.delta}</small>
                </div>
              </div>
              <span className="text-slate-300 shrink-0" aria-hidden="true"><HeaderIcon type="arrow" /></span>
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Sales Trend</h2>
                <p className="text-xs text-slate-400">Your monthly sales over the last 6 months.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 cursor-pointer">
              <select 
                aria-label="Select sales period" 
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden pr-4 cursor-pointer"
                onChange={(event) => setSalesPeriod(event.target.value)} 
                value={salesPeriod}
              >
                {salesPeriodOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="text-slate-400 pointer-events-none text-xs"><HeaderIcon type="chevron" /></span>
            </label>
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Revenue Breakdown</h2>
                <p className="text-xs text-slate-400">Sales distribution by product category.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 cursor-pointer">
              <select 
                aria-label="Select revenue period" 
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden pr-4 cursor-pointer"
                onChange={(event) => setRevenuePeriod(event.target.value)} 
                value={revenuePeriod}
              >
                {revenueOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="text-slate-400 pointer-events-none text-xs"><HeaderIcon type="chevron" /></span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            <div className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-xs shrink-0" style={donutStyle}>
              <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                <strong className="text-lg font-black text-slate-900 leading-tight">₹1.24L</strong>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Sales</span>
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Top Selling Products</h2>
                <p className="text-xs text-slate-400">Products with highest sales this month.</p>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/supplier/products">
              View all <HeaderIcon type="arrow" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-2">#</th>
                  <th className="pb-3 px-2">Product</th>
                  <th className="pb-3 px-2">Units Sold</th>
                  <th className="pb-3 pl-2 text-right">Revenue</th>
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
        </article>

        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 text-lg">
                <HeaderIcon type="customers" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Top Customers</h2>
                <p className="text-xs text-slate-400">Customers who ordered the most this month.</p>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/supplier/customers">
              View all <HeaderIcon type="arrow" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-2">#</th>
                  <th className="pb-3 px-2">Customer (Shop)</th>
                  <th className="pb-3 px-2">Orders</th>
                  <th className="pb-3 pl-2 text-right">Total Spent</th>
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
        </article>
      </div>
    </section>
  )
}
