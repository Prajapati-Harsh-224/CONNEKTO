import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiClock, FiCreditCard, FiTruck, FiList, FiChevronRight, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'

import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'

const cardIcons = {
  'Total orders': <FiPackage size={20} />,
  'Pending orders': <FiClock size={20} />,
  'Monthly spending': <FiCreditCard size={20} />,
}

function formatDashboardOrderId(orderId = '') {
  const value = String(orderId || '').trim()
  if (!value) return '—'

  const compactMatch = value.match(/(?:^|[-_])([A-Fa-f0-9]{8})(?:[-_].*)?$/)
  const compactId = compactMatch ? compactMatch[1].toUpperCase() : value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()

  return compactId ? `ORD-${compactId}` : value
}

export default function ShopOwnerDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getOrders()
      .then((res) => {
        if (isMounted) {
          setOrders(res.data?.orders || [])
        }
      })
      .catch(() => {
        if (isMounted) setOrders([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    const label = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
    return String(label || '').replace(/,\s*$/, '').trim()
  }

  const totalOrdersCount = orders.length
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Preparing').length
  const totalSpending = orders.reduce((sum, o) => sum + Number(o.subtotal || o.amount || 0), 0)

  const summaryCards = [
    { label: t('totalOrders'), value: String(totalOrdersCount), detail: t('acrossAllSuppliers'), icon: cardIcons['Total orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('pendingOrders'), value: String(pendingOrdersCount), detail: t('needYourAttention'), icon: cardIcons['Pending orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('monthlySpending'), value: `₹${totalSpending.toLocaleString('en-IN')}`, detail: t('totalPlacedOrderValue'), icon: cardIcons['Monthly spending'], actionTo: '/dashboard/shop-owner/analytics' },
  ]

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    supplier: o.supplierName || 'Supplier',
    amount: `₹${Number(o.subtotal || o.amount || 0).toLocaleString('en-IN')}`,
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }))

  const deliveries = orders
    .filter((o) => o.status === 'Preparing' || o.status === 'Out for Delivery')
    .slice(0, 5)
    .map((o) => ({
      orderId: o.id,
      supplier: o.supplierName || 'Supplier',
      time: new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: o.status
    }))

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0">
      <header className="pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {getDynamicGreeting()}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('hereIsLatestView')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            accent={card.accent}
            detail={card.detail}
            icon={card.icon}
            label={card.label}
            actionTo={card.actionTo}
            value={card.value}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)] gap-6 items-start w-full min-w-0">
        <section className="min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg shrink-0">
                <FiList />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{t('recentOrders')}</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors shrink-0" to="/dashboard/shop-owner/orders">
              {t('viewAll')} <FiArrowRight />
            </Link>
          </div>

          {recentOrders.length ? (
            <>
              {/* Mobile View: Clean Shadcn Card List */}
              <div className="space-y-3 sm:hidden">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{order.supplier}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-extrabold text-slate-900 tabular-nums">{order.amount}</span>
                      <span>{order.date}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">{formatDashboardOrderId(order.id)}</span>
                      <Link
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors"
                        to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}
                      >
                        {t('view') || 'View'} <FiChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop View: Scroll-safe Table */}
              <div className="hidden sm:block w-full max-w-full overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 bg-slate-50 rounded-l-xl font-bold w-[38%]">{t('supplier')}</th>
                      <th className="py-2.5 px-3 bg-slate-50 font-bold w-[14%]">{t('amount')}</th>
                      <th className="py-2.5 px-3 bg-slate-50 font-bold w-[24%]">{t('status')}</th>
                      <th className="py-2.5 px-4 bg-slate-50 font-bold w-[18%]">{t('date')}</th>
                      <th className="py-2.5 px-3 bg-slate-50 rounded-r-xl text-right font-bold w-[6%]">
                        <span className="sr-only">{t('action') || 'Action'}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 border-b border-slate-100">
                          <span className="text-sm font-semibold text-slate-900 whitespace-nowrap" title={order.supplier}>
                            {order.supplier}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap border-b border-slate-100">
                          {order.amount}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap border-b border-slate-100">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                          {order.date}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap border-b border-slate-100">
                          <Link 
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-brand-orange-light hover:text-brand-orange text-slate-500 transition-colors" 
                            to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`} 
                            aria-label={`View ${order.id}`}
                          >
                            <FiChevronRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState title={t('noRecentOrders')} message={t('noRecentOrdersMessage')} />
          )}
        </section>

        <section className="min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg shrink-0">
                <FiTruck />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{t('todaysDeliveries')}</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors shrink-0" to="/dashboard/shop-owner/orders">
              {t('viewAll')} <FiArrowRight />
            </Link>
          </div>

          {deliveries.length ? (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all" key={`${delivery.orderId}-${delivery.supplier}`}>
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange shrink-0" aria-hidden="true">
                    <FiTruck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-semibold text-slate-900 whitespace-nowrap truncate" title={delivery.supplier}>{delivery.supplier}</strong>
                      <span className="shrink-0"><StatusBadge status={delivery.status} /></span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-1 font-mono">
                      <span className="truncate" title={delivery.orderId}>{formatDashboardOrderId(delivery.orderId)}</span>
                      <span className="shrink-0">{delivery.time}</span>
                    </div>
                  </div>
                  <Link 
                    className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-brand-orange-light hover:text-brand-orange text-slate-500 transition-colors shrink-0" 
                    to={`/dashboard/shop-owner/orders/${encodeURIComponent(delivery.orderId)}`} 
                    aria-label={`View ${delivery.orderId}`}
                  >
                    <FiChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noDeliveriesToday')} message={t('noDeliveriesTodayMessage')} />
          )}
        </section>
      </div>

      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 shadow-xs w-full min-w-0 max-w-full">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-orange text-white text-xl shrink-0 shadow-xs" aria-hidden="true">
            <HiSparkles />
          </span>
          <div className="min-w-0">
            <strong className="text-sm sm:text-base font-extrabold text-slate-900 block">{t('keepBusinessStocked')}</strong>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">{t('spendingInsight')}</p>
          </div>
        </div>
        <Link 
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-orange/30 text-xs font-bold text-brand-orange hover:bg-brand-orange-light transition-all shadow-xs shrink-0 self-start sm:self-auto" 
          to="/dashboard/shop-owner/analytics"
        >
          {t('viewInsights')} <FiArrowRight />
        </Link>
      </section>
    </section>
  )
}


