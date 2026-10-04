import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiBarChart2,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'
import { getSupplierAnalytics } from '../services/supplierAnalyticsService.js'
import { useLocale } from '../context/LocaleContext.jsx'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function formatYTick(val) {
  if (val === 0) return '₹0'
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`
  return `₹${val}`
}

const DATE_OPTIONS = [
  { value: 'Today', key: 'today', fallback: 'Today' },
  { value: 'This Week', key: 'thisWeek', fallback: 'This Week' },
  { value: 'This Month', key: 'thisMonth', fallback: 'This Month' },
  { value: 'Last Month', key: 'lastMonth', fallback: 'Last Month' },
  { value: 'Last 3 Months', key: 'last3Months', fallback: 'Last 3 Months' },
  { value: 'Last 6 Months', key: 'last6Months', fallback: 'Last 6 Months' },
  { value: 'This Year', key: 'thisYear', fallback: 'This Year' },
  { value: 'Custom Range', key: 'customRange', fallback: 'Custom Range' },
]

const emptyAnalytics = {
  isDemoData: false,
  ordersReceived: 0,
  orderValue: 0,
  metrics: { sales: 0, orders: 0, customers: 0, productsSold: 0 },
  orderStatus: { pending: 0, completed: 0 },
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
    clock: <FiClock />,
    completed: <FiCheckCircle />,
    alert: <FiAlertCircle />,
    refresh: <FiRefreshCw />
  }

  return <span className="inline-flex items-center justify-center" aria-hidden="true">{icons[type] || <FiBarChart2 />}</span>
}

// ---------------------------------------------------------
// 1. SKELETON LOADER
// ---------------------------------------------------------
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse w-full max-w-full">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 rounded-md" />
        </div>
        <div className="h-8 sm:h-10 w-28 sm:w-40 bg-slate-200 rounded-xl self-start sm:self-auto" />
      </div>

      {/* KPI Cards skeleton - 3 cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 sm:h-32 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-2.5 sm:p-5 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-200" />
              <div className="hidden sm:block w-6 h-6 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
              <div className="h-2.5 sm:h-3 w-10 sm:w-20 bg-slate-200 rounded-md" />
              <div className="h-4 sm:h-7 w-8 sm:w-28 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 sm:h-80 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-4">
          <div className="h-5 sm:h-6 w-36 bg-slate-200 rounded-md" />
          <div className="h-44 sm:h-56 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-64 sm:h-80 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-4">
          <div className="h-5 sm:h-6 w-40 bg-slate-200 rounded-md" />
          <div className="h-44 sm:h-56 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Tables skeleton - 2 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3">
            <div className="h-6 w-36 bg-slate-200 rounded-md" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((r) => (
                <div key={r} className="h-10 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// 2. STAT CARD
// ---------------------------------------------------------
function AnalyticsStatCard({ title, value, delta, icon, accent = 'blue', to = null }) {
  const accentThemes = {
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'text-emerald-700'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'text-blue-700'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'text-amber-700'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badge: 'text-purple-700'
    }
  }

  const theme = accentThemes[accent] || accentThemes.blue

  const cardContent = (
    <div className="flex flex-col justify-between h-full min-h-[82px] sm:min-h-[96px] md:min-h-[110px] lg:min-h-[128px]">
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl border text-sm sm:text-base md:text-lg lg:text-xl font-bold shrink-0 transition-transform ${theme.iconBg}`}>
          <HeaderIcon type={icon} />
        </div>
        {to ? (
          <span
            className="hidden sm:flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-slate-300 group-hover:text-brand-orange group-hover:bg-brand-orange-light transition-all"
            aria-hidden="true"
          >
            <HeaderIcon type="arrow" />
          </span>
        ) : null}
      </div>

      <div className="flex flex-col min-w-0 mt-2 sm:mt-3 md:mt-4">
        <span className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <strong className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight tabular-nums mt-0.5">
          {value}
        </strong>
        {delta ? (
          <small className="hidden sm:block text-xs text-slate-400 font-medium truncate mt-1">
            {delta}
          </small>
        ) : null}
      </div>
    </div>
  )

  const cardClasses =
    'group relative flex flex-col justify-between p-2.5 sm:p-3 md:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200'

  if (to) {
    return (
      <Link to={to} className={cardClasses} aria-label={`${title}: ${value}`}>
        {cardContent}
      </Link>
    )
  }

  return (
    <article className={cardClasses}>
      {cardContent}
    </article>
  )
}

// ---------------------------------------------------------
// 3. SALES TREND CHART
// ---------------------------------------------------------
function SalesTrendChart({ labels = [], values = [], periodLabel = 'the past 6 months' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const width = 640
  const height = 240
  const padding = { top: 28, right: 24, bottom: 36, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxVal = Math.max(...values, 0)
  const isAllZero = values.length === 0 || maxVal === 0

  // Calculate nice Y ticks dynamically based on actual data
  const { ticks, niceMax } = useMemo(() => {
    if (isAllZero) return { ticks: [0, 2000, 4000, 6000], niceMax: 6000 }

    const targetTicks = 4
    const rawMax = maxVal * 1.18 // 18% headroom so points don't clip at top
    const roughStep = rawMax / targetTicks
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)))
    const normalized = roughStep / magnitude

    let niceStep = magnitude
    if (normalized < 1.5) niceStep = 1 * magnitude
    else if (normalized < 3) niceStep = 2 * magnitude
    else if (normalized < 7) niceStep = 5 * magnitude
    else niceStep = 10 * magnitude

    let computedMax = Math.ceil(maxVal / niceStep) * niceStep
    if (computedMax < maxVal * 1.08) computedMax += niceStep

    const resultTicks = []
    const stepCount = Math.max(Math.round(computedMax / niceStep), 1)
    for (let i = 0; i <= stepCount; i++) {
      resultTicks.push(i * niceStep)
    }

    return { ticks: resultTicks, niceMax: computedMax }
  }, [maxVal, isAllZero])

  // Points mapping
  const points = useMemo(() => {
    if (!values.length) return []
    const count = values.length
    const colWidth = count > 1 ? chartWidth / (count - 1) : chartWidth / 2

    return values.map((val, idx) => {
      const x = count === 1 ? padding.left + chartWidth / 2 : padding.left + colWidth * idx
      const y = padding.top + chartHeight - (val / (niceMax || 1)) * chartHeight
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        value: val,
        label: labels[idx] || `P${idx + 1}`
      }
    })
  }, [values, labels, chartWidth, chartHeight, padding.left, padding.top, niceMax])

  // Curved line path using cubic Bézier spline
  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    if (points.length === 1) {
      return `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    }

    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const midX = p0.x + (p1.x - p0.x) / 2
      path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
    }
    return path
  }, [points])

  // Gradient area path
  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const baselineY = padding.top + chartHeight
    if (points.length === 1) {
      return `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y} L ${points[0].x + 20} ${baselineY} L ${points[0].x - 20} ${baselineY} Z`
    }
    return `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
  }, [linePath, points, padding.top, chartHeight])

  if (isAllZero) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <FiBarChart2 size={22} />
        </div>
        <strong className="text-sm font-bold text-slate-800">No sales recorded for this period</strong>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Sales trend will automatically visualize here once customer orders are placed and confirmed.
        </p>
      </div>
    )
  }

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null
  const colWidth = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        className="w-full h-auto max-h-64 sm:max-h-72"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Sales trend over ${periodLabel}`}
      >
        <defs>
          <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27b66d" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#27b66d" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y-axis labels */}
        {ticks.map((tick) => {
          const y = padding.top + chartHeight - (tick / (niceMax || 1)) * chartHeight
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
                className="tabular-nums"
              >
                {formatYTick(tick)}
              </text>
            </g>
          )
        })}

        {/* Hover vertical guide line */}
        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padding.top}
            y2={padding.top + chartHeight}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Area fill */}
        <path d={areaPath} fill="url(#salesTrendGradient)" />

        {/* Smooth line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="#27b66d"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx
          return (
            <g key={`${pt.label}-${idx}`}>
              {isHovered && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill="rgba(39, 182, 109, 0.2)"
                  stroke="#27b66d"
                  strokeWidth="1.5"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? '5' : '4'}
                fill="#ffffff"
                stroke="#27b66d"
                strokeWidth={isHovered ? '3' : '2.5'}
                className="transition-all duration-150"
              />
            </g>
          )
        })}

        {/* X-axis labels */}
        {points.map((pt, idx) => (
          <text
            key={`${pt.label}-label`}
            x={pt.x}
            y={height - 12}
            textAnchor="middle"
            fill={hoveredIdx === idx ? '#0f172a' : '#64748b'}
            fontSize="12"
            fontWeight={hoveredIdx === idx ? '700' : '600'}
            className="transition-colors duration-150"
          >
            {pt.label}
          </text>
        ))}

        {/* Invisible hit columns for easy mouse/touch interaction */}
        {points.map((pt, idx) => (
          <rect
            key={`hit-${idx}`}
            x={pt.x - colWidth / 2}
            y={padding.top}
            width={colWidth}
            height={chartHeight}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            tabIndex={0}
            onFocus={() => setHoveredIdx(idx)}
            onBlur={() => setHoveredIdx(null)}
            role="button"
            aria-label={`${pt.label}: ${formatCurrency(pt.value)}`}
          />
        ))}
      </svg>

      {/* Floating Tooltip */}
      {activePoint && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs z-30 transition-all duration-150 whitespace-nowrap"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`
          }}
        >
          <div className="text-[11px] font-semibold text-slate-400">{activePoint.label}</div>
          <div className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
            {formatCurrency(activePoint.value)}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Sales Revenue</div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------
// 4. REVENUE BREAKDOWN (DONUT CHART)
// ---------------------------------------------------------
function RevenueBreakdown({ segments = [], totalSales = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const { t } = useLocale()

  const safeTotal = useMemo(() => {
    return totalSales || segments.reduce((sum, s) => sum + Number(s.amount || s.value || 0), 0)
  }, [totalSales, segments])

  const center = 100
  const radius = 70
  const circumference = 2 * Math.PI * radius // ~439.82

  // Calculate segment stroke offset, lengths, and label coordinates
  const calculatedSegments = useMemo(() => {
    const list = []
    let cumulativeOffset = 0
    for (const seg of segments) {
      const pct = Math.max(0, Number(seg.value || 0))
      const strokeLength = (pct / 100) * circumference
      const startAngle = -Math.PI / 2 + (cumulativeOffset / circumference) * 2 * Math.PI
      const arcAngle = (strokeLength / circumference) * 2 * Math.PI
      const midAngle = startAngle + arcAngle / 2
      const textX = Math.round((center + radius * Math.cos(midAngle)) * 10) / 10
      const textY = Math.round((center + radius * Math.sin(midAngle)) * 10) / 10

      list.push({
        ...seg,
        pct,
        strokeDash: `${strokeLength} ${circumference - strokeLength}`,
        strokeOffset: -cumulativeOffset,
        textX,
        textY
      })
      cumulativeOffset += strokeLength
    }
    return list
  }, [segments, circumference, center, radius])

  if (!segments || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <HiSparkles size={22} />
        </div>
        <strong className="text-sm font-bold text-slate-800">No revenue data available yet</strong>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Sales distribution by product category will appear here once orders are confirmed.
        </p>
      </div>
    )
  }

  const activeSegment = hoveredIdx !== null ? calculatedSegments[hoveredIdx] : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-8 pt-1 sm:pt-2 w-full min-w-0">
      {/* Donut Chart Container */}
      <div className="relative w-36 h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 shrink-0 flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 200 200"
          role="img"
          aria-label="Revenue distribution donut chart"
        >
          {/* Base background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="32"
          />

          {/* Slices rotated from 12 o'clock */}
          {calculatedSegments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx
            return (
              <circle
                key={seg.name}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? '38' : '32'}
                strokeDasharray={seg.strokeDash}
                strokeDashoffset={seg.strokeOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                tabIndex={0}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                role="button"
                aria-label={`${seg.name}: ${seg.value}%`}
              />
            )
          })}

          {/* Upright percentage text labels in donut chart */}
          {calculatedSegments.map((seg) => {
            if (seg.pct < 5) return null
            return (
              <text
                key={`pct-${seg.name}`}
                x={seg.textX}
                y={seg.textY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="12"
                fontWeight="800"
                className="pointer-events-none select-none tracking-tight"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.75))'
                }}
              >
                {seg.value}%
              </text>
            )
          })}
        </svg>

        {/* Center Display with dynamic details on interaction */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none select-none">
          {activeSegment ? (
            <>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {activeSegment.value}%
              </span>
              <span
                className="text-[10px] sm:text-xs font-bold text-slate-700 truncate max-w-[80px] sm:max-w-[120px] mt-0.5"
                title={activeSegment.name}
              >
                {activeSegment.name}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 tabular-nums">
                {formatCurrency(activeSegment.amount ?? ((safeTotal * activeSegment.value) / 100))}
              </span>
            </>
          ) : (
            <>
              <strong className="text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight tabular-nums truncate max-w-[80px] sm:max-w-[120px]">
                {formatCurrency(safeTotal)}
              </strong>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate max-w-[75px] sm:max-w-[110px]">
                {t('totalSales') || 'Total Sales'}
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium">
                100% total
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend showing full category names */}
      <div className="w-full sm:w-auto flex-1 max-w-sm grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:space-y-2 sm:gap-0 min-w-0">
        {calculatedSegments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx
          return (
            <div
              key={seg.name}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              className={`flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                isHovered ? 'bg-slate-100/90 shadow-2xs ring-1 ring-slate-200' : 'hover:bg-slate-50/70'
              }`}
              title={`${seg.name}: ${seg.value}%`}
            >
              <span
                className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shrink-0 transition-transform shadow-2xs"
                style={{
                  backgroundColor: seg.color,
                  transform: isHovered ? 'scale(1.25)' : 'scale(1)'
                }}
              />
              <span className="font-semibold text-slate-800 text-[11px] sm:text-xs md:text-sm leading-snug truncate">
                {seg.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// 5. TOP SELLING PRODUCTS
// ---------------------------------------------------------
function TopSellingProducts({ products = [] }) {
  const { t } = useLocale()

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p className="text-xs sm:text-sm font-semibold">{t('noTopProducts') || 'No product sales recorded yet'}</p>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
          {t('requestedProductsWillAppear') || 'Sales data will appear here once orders are placed.'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-left table-fixed">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="pb-3 w-8 text-center">#</th>
            <th className="pb-3 px-3 w-auto min-w-0">{t('product') || 'Product'}</th>
            <th className="pb-3 px-3 w-20 text-right">{t('unitsSold') || 'Sold'}</th>
            <th className="pb-3 pl-3 w-28 text-right">{t('revenue') || 'Revenue'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((product) => (
            <tr key={product.name} className="hover:bg-slate-50/70 transition-colors group">
              <td className="py-3 text-center text-xs font-bold text-slate-400">
                {product.rank}
              </td>
              <td className="py-3 px-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-[10px] font-bold text-brand-orange shrink-0">
                    {product.name
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'PR'}
                  </span>
                  <span
                    className="font-semibold text-slate-800 text-xs sm:text-sm truncate block"
                    title={product.name}
                  >
                    {product.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-right text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                {product.units}
              </td>
              <td className="py-3 pl-3 text-right text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                {formatCurrency(product.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------
// 6. TOP CUSTOMERS
// ---------------------------------------------------------
function TopCustomers({ customers = [] }) {
  const { t } = useLocale()

  if (!customers || customers.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p className="text-xs sm:text-sm font-semibold">{t('noCustomers') || 'No customer orders recorded yet'}</p>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
          {t('customerTotalsAppear') || 'Customer activity will appear here once orders are fulfilled.'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-left table-fixed">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="pb-3 w-8 text-center">#</th>
            <th className="pb-3 px-3 w-auto min-w-0">{t('customerShop') || 'Customer (Shop)'}</th>
            <th className="pb-3 px-3 w-20 text-right">{t('orders')}</th>
            <th className="pb-3 pl-3 w-28 text-right">{t('totalSpent')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {customers.map((customer) => (
            <tr key={customer.name} className="hover:bg-slate-50/70 transition-colors group">
              <td className="py-3 text-center text-xs font-bold text-slate-400">
                {customer.rank}
              </td>
              <td className="py-3 px-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 shrink-0">
                    {customer.name
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'CU'}
                  </span>
                  <span
                    className="font-semibold text-slate-800 text-xs sm:text-sm truncate block"
                    title={customer.name}
                  >
                    {customer.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-right text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                {customer.orders}
              </td>
              <td className="py-3 pl-3 text-right text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                {formatCurrency(customer.totalSpent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------
// 7. MAIN PAGE COMPONENT
// ---------------------------------------------------------
export default function SupplierAnalyticsPage() {
  const { t } = useLocale()
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' })

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    const params = { period: dateFilter }
    if (dateFilter === 'Custom Range') {
      if (customRange.startDate) params.startDate = customRange.startDate
      if (customRange.endDate) params.endDate = customRange.endDate
    }

    getSupplierAnalytics(params)
      .then((response) => {
        if (!isMounted) return
        const payload = response?.data || response
        setAnalytics(payload)
        setError('')
      })
      .catch((requestError) => {
        if (!isMounted) return
        setError(requestError?.message || 'Unable to load analytics data.')
        setAnalytics(emptyAnalytics)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [dateFilter, customRange, refreshKey])

  const pageData = useMemo(() => {
    return analytics || emptyAnalytics
  }, [analytics])

  // Derive sales trend data dynamically
  const { salesData, periodSubtitle } = useMemo(() => {
    const salesTrend = pageData.salesTrend || emptyAnalytics.salesTrend

    // Check direct matching keys
    if (dateFilter === 'Last 3 Months' && salesTrend['Last 3 months']) {
      return {
        salesData: salesTrend['Last 3 months'],
        periodSubtitle: 'Your monthly sales performance over the past 3 months.'
      }
    }

    if (dateFilter === 'Last 6 Months' && salesTrend['Last 6 months']) {
      return {
        salesData: salesTrend['Last 6 months'],
        periodSubtitle: 'Your monthly sales performance over the past 6 months.'
      }
    }

    if (dateFilter === 'This Year' && salesTrend['This year']) {
      return {
        salesData: salesTrend['This year'],
        periodSubtitle: 'Your sales performance for this current year.'
      }
    }

    if (salesTrend[dateFilter]) {
      return {
        salesData: salesTrend[dateFilter],
        periodSubtitle: `Your sales performance for ${dateFilter.toLowerCase()}.`
      }
    }

    // Default to the 6-month trend if available
    const fallbackTrend = salesTrend['Last 6 months'] || salesTrend['This year'] || { labels: [], values: [] }
    return {
      salesData: fallbackTrend,
      periodSubtitle: 'Your monthly sales performance over the past 6 months.'
    }
  }, [pageData, dateFilter])

  // KPI Metrics with exact design & routes
  const metrics = useMemo(() => {
    const ordersTotal = pageData.ordersReceived ?? pageData.metrics?.orders ?? 0
    const pendingTotal = pageData.orderStatus?.pending ?? 0
    const completedTotal = pageData.orderStatus?.completed ?? 0

    return [
      {
        title: t('totalOrders'),
        value: ordersTotal,
        delta: t('totalReceived'),
        icon: 'order',
        accent: 'blue',
        to: '/dashboard/supplier/orders'
      },
      {
        title: t('pendingOrders'),
        value: pendingTotal,
        delta: t('awaitingFulfillment'),
        icon: 'clock',
        accent: 'amber',
        to: '/dashboard/supplier/orders?status=Pending'
      },
      {
        title: t('completedOrders'),
        value: completedTotal,
        delta: t('successfullyDelivered'),
        icon: 'product',
        accent: 'purple',
        to: '/dashboard/supplier/orders?status=Delivered'
      }
    ]
  }, [pageData, t])

  const handlePeriodChange = (newPeriod) => {
    setIsLoading(true)
    setDateFilter(newPeriod)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setRefreshKey((k) => k + 1)
  }

  return (
    <section className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Page Header with responsive Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {t('analytics')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your sales, orders, and customer trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Start date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 shadow-xs focus:outline-none focus:border-brand-orange"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                aria-label="End date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 shadow-xs focus:outline-none focus:border-brand-orange"
              />
            </div>
          )}

          <label className="relative inline-flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all w-auto">
            <span className="text-slate-400 mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true">
              <HeaderIcon type="calendar" />
            </span>
            <select
              aria-label={t('selectAnalyticsPeriod') || 'Select analytics period'}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              onChange={(e) => handlePeriodChange(e.target.value)}
              value={dateFilter}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.key) || opt.fallback}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Error Banner if API fails */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <HeaderIcon type="alert" />
            <span>Unable to load latest analytics data. Displaying cached or default values.</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
          >
            <HeaderIcon type="refresh" /> Retry
          </button>
        </div>
      )}

      {/* Content or Skeleton Loader */}
      {isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* KPI Summary Cards - 3 cards in single row on mobile and tablet */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-3.5 lg:gap-5">
            {metrics.map((metric) => (
              <AnalyticsStatCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                delta={metric.delta}
                icon={metric.icon}
                accent={metric.accent}
                to={metric.to}
              />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sales Trend */}
            <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-6 space-y-3 sm:space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 text-base sm:text-lg shrink-0">
                    <HeaderIcon type="chart" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight">
                      {t('salesTrend')}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                      {periodSubtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-hidden flex-1 flex flex-col justify-center">
                <SalesTrendChart
                  labels={salesData.months || salesData.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']}
                  values={salesData.values || [0, 0, 0, 0, 0, 0]}
                  periodLabel={dateFilter}
                />
              </div>
            </article>

            {/* Revenue Breakdown */}
            <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-6 space-y-3 sm:space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 text-base sm:text-lg shrink-0">
                    <HeaderIcon type="spark" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight">
                      {t('revenueBreakdown')}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                      {t('revenueBreakdownDescription') || 'Sales distribution by product category.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <RevenueBreakdown
                  segments={pageData.revenueBreakdown || []}
                  totalSales={pageData.orderValue ?? pageData.metrics?.sales ?? 0}
                />
              </div>
            </article>
          </div>

          {/* Bottom Tables: Top Selling Products & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-brand-orange text-lg shrink-0">
                    <HeaderIcon type="product" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {t('topSellingProducts') || 'Top Selling Products'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('highestSalesThisMonth') || 'Products with the highest sales volume this month.'}
                    </p>
                  </div>
                </div>
              </div>

              <TopSellingProducts products={pageData.topProducts || []} />
            </article>

            {/* Top Customers */}
            <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 text-lg shrink-0">
                    <HeaderIcon type="customers" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {t('topCustomers') || 'Top Customers'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('customersWithMostOrders') || 'Customers with the highest orders this month.'}
                    </p>
                  </div>
                </div>
              </div>

              <TopCustomers customers={pageData.topCustomers || []} />
            </article>
          </div>
        </>
      )}
    </section>
  )
}
