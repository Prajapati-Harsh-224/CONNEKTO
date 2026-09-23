import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FiPackage, 
  FiClock, 
  FiCheck, 
  FiHome, 
  FiFileText, 
  FiBell, 
  FiChevronRight, 
  FiArrowRight 
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogDashboard } from '../services/gruhUdyogService.js'

function formatDashboardOrderId(orderId = '') {
  const value = String(orderId || '').trim()
  if (!value) return '—'
  if (value.startsWith('ORD-')) return value
  const hexMatch = value.match(/[A-Fa-f0-9]{4,8}/)
  if (hexMatch) return `ORD-${hexMatch[0].toUpperCase()}`
  const sanitized = value.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase()
  return sanitized ? `ORD-${sanitized}` : value
}

function StatusPill({ status, locale }) {
  const { t } = useLocale()
  const activeLocale = locale || t
  const normalized = String(status || '').toLowerCase()
  const text = (key, fallback) => (activeLocale ? activeLocale(key) || fallback : fallback)

  if (normalized === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]">
        {text('pending', 'Pending')}
      </span>
    )
  }
  if (normalized === 'preparing') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#edf5fd] text-[#2563eb] border border-[#d2e5fa]">
        {text('preparing', 'Preparing')}
      </span>
    )
  }
  if (normalized === 'confirmed' || normalized === 'accepted') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        {text('confirmed', text('accepted', 'Confirmed'))}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      {text('delivered', 'Delivered')}
    </span>
  )
}

export default function GruhUdyogDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGruhUdyogDashboard()
      .then((response) => setDashboard(response?.data || null))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Process live authenticated backend data
  const { orders, attentionOrders, metrics } = useMemo(() => {
    const rawOrders = dashboard?.orders || dashboard?.recentOrders || []

    const formattedOrders = rawOrders.map((order) => {
      const rawDate = order.createdAt ? new Date(order.createdAt) : null
      const dateLabel = rawDate && !Number.isNaN(rawDate.getTime())
        ? new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(rawDate)
        : '—'
      return {
        id: formatDashboardOrderId(order.id),
        rawId: order.id,
        customer: order.customer || order.shopName || order.shopOwner || order.shopOwnerName || 'Retail Shop',
        items: (order.items || []).length || 1,
        amount: Number(order.amount || order.subtotal || 0),
        status: order.status || 'Pending',
        date: dateLabel,
      }
    })

    const rawAttention = dashboard?.needsAttentionOrders || []
    const formattedAttention = (rawAttention.length > 0
      ? rawAttention
      : formattedOrders.filter((o) => ['Pending', 'Preparing', 'Accepted', 'Out for Delivery'].includes(o.status))
    ).map((order) => ({
      id: formatDashboardOrderId(order.id),
      rawId: order.id,
      customer: order.customer || order.shopName || order.shopOwner || order.shopOwnerName || 'Retail Shop',
      status: order.status || 'Pending',
    })).slice(0, 5)

    const totalCount = dashboard?.metrics?.totalOrders ?? formattedOrders.length
    const pendingCount = dashboard?.metrics?.pendingOrders ?? formattedOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length
    const completedCount = dashboard?.metrics?.completedOrders ?? formattedOrders.filter((o) => o.status === 'Delivered').length
    const totalSalesAmount = dashboard?.metrics?.totalSales ?? formattedOrders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.amount || 0), 0)

    const totalSalesFormatted = dashboard?.metrics?.totalSalesFormatted || `₹${Number(totalSalesAmount).toLocaleString('en-IN')}`

    return {
      orders: formattedOrders.slice(0, 5),
      attentionOrders: formattedAttention,
      metrics: {
        totalOrders: totalCount,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        totalSales: totalSalesFormatted,
      },
    }
  }, [dashboard])

  const firstName = user?.name?.split(' ')[0] || dashboard?.businessName?.split(' ')[0] || 'there'

  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours()
    const prefix = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
    const cleanPrefix = String(prefix || '').replace(/,\s*$/, '').trim()
    return `${cleanPrefix}, ${firstName}`
  }, [firstName, t])

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />
  if (error) {
    return (
      <section className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 sm:space-y-7 pb-10">
      {/* Top Header: Greeting on Left & Empowering Local Makers banner on Right */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{dynamicGreeting}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('manageProductsOrdersCustomers') || 'Manage your products, orders and customers from one place.'}
          </p>
        </div>

        {/* Empowering Local Makers Banner Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100/90 bg-[#f4f9f5] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 shadow-xs max-w-sm shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-[#1b6442] flex items-center justify-center shrink-0 z-10">
            <FiHome className="w-5 h-5" />
          </div>
          <div className="z-10">
            <h2 className="text-xs sm:text-sm font-bold text-[#1b6442] tracking-tight leading-tight">
              {t('empoweringLocalMakers') || 'Empowering Local Makers'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {t('turnSkillsIntoOpportunities') || 'Turn your skills into opportunities with Connekto.'}
            </p>
          </div>
          {/* Subtle Decorative Leaf Watermark */}
          <div className="absolute -right-2 -bottom-2 text-emerald-600/10 pointer-events-none" aria-hidden="true">
            <svg className="w-20 h-20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
        </div>
      </header>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 hover:border-slate-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <FiPackage className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{t('totalOrdersLabel') || t('totalOrders')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {metrics.totalOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('allOrdersReceived') || 'All orders received'}</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 hover:border-slate-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <FiClock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{t('pendingOrdersLabel') || t('pendingOrders')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {metrics.pendingOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('needYourAction') || 'Need your action'}</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 hover:border-slate-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <FiCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{t('completedOrdersLabel') || t('completedOrders')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {metrics.completedOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('successfullyDelivered') || 'Successfully delivered'}</p>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 hover:border-slate-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 text-xl font-bold">
            ₹
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{t('totalSalesLabel') || t('totalSales')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {metrics.totalSales}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('fromAllOrders') || 'From all orders'}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Orders (Left) and Needs Attention (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Recent Orders Table Card */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('recentOrders')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('latestOrdersFromCustomers') || 'Latest orders from your customers'}</p>
              </div>
            </div>
            <Link
              to="/dashboard/gruh-udyog/orders"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#1b6442] hover:text-[#144d32] transition-colors"
            >
              <span>{t('viewAll')}</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full min-w-[620px] text-left border-collapse mt-2">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-3">{t('orderId') || 'Order ID'}</th>
                  <th className="py-3 px-3">{t('customer') || 'Customer'}</th>
                  <th className="py-3 px-3">{t('itemsCount') || 'Items'}</th>
                  <th className="py-3 px-3">{t('amount')}</th>
                  <th className="py-3 px-3">{t('status')}</th>
                  <th className="py-3 px-3">{t('date')}</th>
                  <th className="py-3 px-3 text-right">{t('action') || 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.rawId || order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-xs font-semibold text-slate-800">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-3 text-xs font-medium text-slate-900">
                        {order.customer}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500">
                        {order.items} {order.items === 1 ? t('itemCount') : t('itemsCount')}
                      </td>
                      <td className="py-3.5 px-3 text-xs font-bold text-slate-900">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard/gruh-udyog/orders')}
                          className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-[#1b6442] hover:text-[#1b6442] hover:bg-emerald-50/30 transition-colors cursor-pointer"
                        >
                          {t('view') || 'View'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-medium">
                      {t('noOrdersReceivedYet') || 'No orders received yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Needs Attention Card */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-[#fef4ea] text-[#d95d2c] flex items-center justify-center shrink-0">
                <FiBell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('needsAttention') || 'Needs Attention'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('ordersRequireAction') || 'Orders that require your action'}</p>
              </div>
            </div>

            {/* Orange Highlight Callout Box */}
            <Link
              to="/dashboard/gruh-udyog/orders"
              className="mt-4 rounded-2xl bg-[#fef6f0] border border-[#fbd8c0] p-4 flex items-center justify-between hover:bg-[#fdeee4] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl sm:text-4xl font-black text-[#d95d2c] leading-none">
                  {metrics.pendingOrders}
                </span>
                <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-snug">
                  {metrics.pendingOrders === 1 ? t('orderWaiting') : t('ordersWaiting')}<br />{t('forYourAction')}
                </p>
              </div>
              <FiChevronRight className="w-5 h-5 text-[#d95d2c] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            {/* List of Orders Needing Attention */}
            <div className="mt-3 divide-y divide-slate-100">
              {attentionOrders.length > 0 ? (
                attentionOrders.map((item) => (
                  <div
                    key={item.rawId || item.id}
                    className="py-3 flex items-center justify-between gap-2 hover:bg-slate-50/50 px-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-900 shrink-0">{item.id}</span>
                      <span className="text-xs text-slate-600 truncate">{item.customer}</span>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  {t('noOrdersCurrentlyRequireAttention') || 'No orders currently require attention.'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA Button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/gruh-udyog/orders')}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#1b6442] hover:bg-[#144d32] active:scale-[0.99] shadow-sm shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{t('viewAllOrders') || 'View All Orders'}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </section>
  )
}
