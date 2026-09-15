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


  return (
    <section className="supplier-analytics-page">
      <div className="orders-breadcrumb">
        <span>Supplier</span>
        <span>›</span>
        <span>Analytics</span>
      </div>

      <div className="supplier-analytics-header-row">
        <div>
          <h1>Analytics</h1>
          <p>A simple view of your business performance.</p>
        </div>

        <label className="analytics-date-picker">
          <span className="analytics-picker-icon"><HeaderIcon type="calendar" /></span>
          <select aria-label="Select analytics period" onChange={(event) => setDateFilter(event.target.value)} value={dateFilter}>
            {dateOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="analytics-picker-caret"><HeaderIcon type="chevron" /></span>
        </label>
      </div>

      <div className="customer-summary-grid analytics-kpi-grid">
        {metrics.map((metric) => (
          <article className={`metric-card customer-stat-card analytics-kpi-card analytics-kpi-${metric.accent}`} key={metric.title}>
            <div className="metric-card-icon analytics-metric-icon"><HeaderIcon type={metric.icon} /></div>
            <div className="metric-card-content">
              <span>{metric.title}</span>
              <strong>{metric.value}</strong>
              <small>{metric.delta}</small>
            </div>
            <span className="analytics-kpi-arrow" aria-hidden="true"><HeaderIcon type="arrow" /></span>
          </article>
        ))}
      </div>

      <div className="supplier-analytics-grid">
        <article className="analytics-main-card analytics-trend-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title-block">
              <span className="analytics-card-icon success-icon"><HeaderIcon type="chart" /></span>
              <div>
                <h2>Sales Trend</h2>
                <p>Your monthly sales over the last 6 months.</p>
              </div>
            </div>

            <label className="analytics-select-wrap minimal">
              <select aria-label="Select sales period" onChange={(event) => setSalesPeriod(event.target.value)} value={salesPeriod}>
                {salesPeriodOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="analytics-select-caret"><HeaderIcon type="chevron" /></span>
            </label>
          </div>

          <SalesTrendChart labels={salesData.months} values={salesData.values} />
        </article>

        <article className="analytics-main-card analytics-breakdown-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title-block">
              <span className="analytics-card-icon success-icon"><HeaderIcon type="spark" /></span>
              <div>
                <h2>Revenue Breakdown</h2>
                <p>Sales distribution by product category.</p>
              </div>
            </div>

            <label className="analytics-select-wrap minimal">
              <select aria-label="Select revenue period" onChange={(event) => setRevenuePeriod(event.target.value)} value={revenuePeriod}>
                {revenueOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="analytics-select-caret"><HeaderIcon type="chevron" /></span>
            </label>
          </div>

          <div className="revenue-breakdown-wrapper">
            <div className="revenue-donut" style={donutStyle}>
              <div className="revenue-donut-inner">
                <strong>₹1.24L</strong>
                <span>Total Sales</span>
              </div>
            </div>

            <div className="revenue-legend">
              {revenueSegments.map((segment) => (
                <div className="legend-row" key={segment.name}>
                  <span className="legend-label">
                    <i style={{ background: segment.color }} />
                    <span>{segment.name}</span>
                  </span>
                  <strong>{segment.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="supplier-analytics-grid lower-grid">
        <article className="analytics-main-card analytics-table-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title-block">
              <span className="analytics-card-icon success-icon"><HeaderIcon type="product" /></span>
              <div>
                <h2>Top Selling Products</h2>
                <p>Products with highest sales this month.</p>
              </div>
            </div>
            <Link className="analytics-view-all" to="/dashboard/supplier/products">View all products <HeaderIcon type="arrow" /></Link>
          </div>

          <table className="analytics-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {pageData.topProducts.map((product) => (
                <tr key={product.name}>
                  <td>{product.rank}</td>
                  <td className="product-name-cell">
                    <span className="product-mini-thumb" aria-hidden="true">{product.name.slice(0, 2).toUpperCase()}</span>
                    <span>{product.name}</span>
                  </td>
                  <td>{product.units}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="analytics-main-card analytics-table-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title-block">
              <span className="analytics-card-icon success-icon"><HeaderIcon type="customers" /></span>
              <div>
                <h2>Top Customers</h2>
                <p>Customers who ordered the most this month.</p>
              </div>
            </div>
            <Link className="analytics-view-all" to="/dashboard/supplier/customers">View all customers <HeaderIcon type="arrow" /></Link>
          </div>

          <table className="analytics-data-table customer-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer (Shop)</th>
                <th>Orders</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {pageData.topCustomers.map((customer) => (
                <tr key={customer.name}>
                  <td>{customer.rank}</td>
                  <td className="customer-name-cell">
                    <span className="customer-mini-avatar" aria-hidden="true">{customer.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span>
                    <span>{customer.name}</span>
                  </td>
                  <td>{customer.orders}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  )
}
