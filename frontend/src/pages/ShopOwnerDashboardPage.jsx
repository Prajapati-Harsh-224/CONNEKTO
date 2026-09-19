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
      .catch((err) => {
        console.error('Failed to load shop owner orders:', err)
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
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {getDynamicGreeting()}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('hereIsLatestView')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-6 items-start">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg">
                <FiList />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('recentOrders')}</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner/orders">
              {t('viewAll')} <FiArrowRight />
            </Link>
          </div>

          {recentOrders.length ? (
            <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <div className="min-w-[540px]">
                <div className="grid grid-cols-[1fr_1.8fr_1.2fr_1.2fr_1.2fr_auto] gap-3 py-2.5 px-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>#</span>
                  <span>{t('supplier')}</span>
                  <span>{t('amount')}</span>
                  <span>{t('status')}</span>
                  <span>{t('date')}</span>
                  <span />
                </div>

                <div className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div className="grid grid-cols-[1fr_1.8fr_1.2fr_1.2fr_1.2fr_auto] gap-3 items-center py-3 px-3 hover:bg-slate-50/60 transition-colors" key={order.id}>
                      <span className="text-xs font-mono font-bold text-slate-700 truncate">{order.id}</span>
                      <span className="text-sm font-semibold text-slate-900 truncate">{order.supplier}</span>
                      <span className="text-xs font-bold text-slate-900">{order.amount}</span>
                      <span><StatusBadge status={order.status} /></span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{order.date}</span>
                      <Link 
                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange text-slate-400 transition-colors" 
                        to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`} 
                        aria-label={`View ${order.id}`}
                      >
                        <FiChevronRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title={t('noRecentOrders')} message={t('noRecentOrdersMessage')} />
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg">
                <FiTruck />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('todaysDeliveries')}</h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner/orders">
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
                      <strong className="text-sm font-semibold text-slate-900 truncate">{delivery.supplier}</strong>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
                      <span>{delivery.orderId}</span>
                      <span>{delivery.time}</span>
                    </div>
                  </div>
                  <Link 
                    className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange text-slate-400 transition-colors shrink-0" 
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

      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-orange text-white text-xl shrink-0 shadow-xs" aria-hidden="true">
            <HiSparkles />
          </span>
          <div>
            <strong className="text-sm sm:text-base font-extrabold text-slate-900">{t('keepBusinessStocked')}</strong>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{t('spendingInsight')}</p>
          </div>
        </div>
        <Link 
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-orange-200 text-xs font-bold text-brand-orange hover:bg-orange-50 transition-all shadow-xs shrink-0 self-start sm:self-auto" 
          to="/dashboard/shop-owner/analytics"
        >
          {t('viewInsights')} <FiArrowRight />
        </Link>
      </section>
    </section>
  )
}


