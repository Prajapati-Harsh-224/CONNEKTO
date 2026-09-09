import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSupplierAnalyticsDemo } from '../data/supplierAnalyticsDemo.js'
import { getSupplierAnalytics } from '../services/supplierAnalyticsService.js'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const dateOptions = ['This Month (Sep 2026)', 'Last 3 months', 'This year']
const salesPeriodOptions = ['Last 6 months', 'Last 3 months', 'This year']
const revenueOptions = ['This Month']

function HeaderIcon({ type }) {
  const icons = {
    calendar: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    chevron: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    rupee: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 4H8.5A4.5 4.5 0 0 0 8.5 13H14a3 3 0 0 1 0 6H7M9 4h8M9 18h8M9 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    order: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10l3 3v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 9h6M9 13h6M9 17h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    customers: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4 18c.4-2.1 2.7-3.5 5-3.5S12.6 15.9 13 18M15 18c.5-2.2 2.5-3.6 4.8-3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    product: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 3v9m8-4.5L12 12 4 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18h16M6 15l4-4 3 3 5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    spark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }

  return <span className="analytics-icon" aria-hidden="true">{icons[type] || icons.chart}</span>
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
  const [dateFilter, setDateFilter] = useState('This Month (Sep 2026)')
  const [salesPeriod, setSalesPeriod] = useState('Last 6 months')
  const [revenuePeriod, setRevenuePeriod] = useState('This Month')

  useEffect(() => {
    let isMounted = true

    getSupplierAnalytics()
      .then((response) => {
        const payload = response?.data || response || listSupplierAnalyticsDemo()
        if (isMounted) setAnalytics(payload)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message)
          setAnalytics(listSupplierAnalyticsDemo())
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const pageData = useMemo(() => analytics || listSupplierAnalyticsDemo(), [analytics])

  const salesData = useMemo(() => {
    const salesTrend = pageData.salesTrend || listSupplierAnalyticsDemo().salesTrend
    return salesTrend[salesPeriod] || salesTrend['Last 6 months']
  }, [pageData, salesPeriod])

  const revenueSegments = useMemo(() => {
    const total = pageData.revenueBreakdown?.reduce((sum, segment) => sum + Number(segment.value || 0), 0) || 100
    let cursor = 0
    return (pageData.revenueBreakdown || listSupplierAnalyticsDemo().revenueBreakdown).map((segment) => {
      const start = cursor
      const end = cursor + (segment.value / total) * 100
      cursor = end
      return { ...segment, start, end }
    })
  }, [pageData])

  const donutStyle = useMemo(() => {
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
    { title: 'Total Sales', value: formatCurrency(pageData.metrics?.sales ?? 124580), delta: '↑ 12% from last month', icon: 'rupee', accent: 'green' },
    { title: 'Total Orders', value: pageData.metrics?.orders ?? 86, delta: '↑ 8% from last month', icon: 'order', accent: 'blue' },
    { title: 'Active Customers', value: pageData.metrics?.customers ?? 24, delta: '↑ 4% from last month', icon: 'customers', accent: 'amber' },
    { title: 'Products Sold', value: (pageData.metrics?.productsSold ?? 1542).toLocaleString('en-IN'), delta: '↑ 15% from last month', icon: 'product', accent: 'purple' },
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
