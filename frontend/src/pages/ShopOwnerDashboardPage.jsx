import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPackage,
  FiClock,
  FiCreditCard,
  FiTruck,
  FiList,
  FiChevronRight,
  FiArrowRight,
  FiRotateCw,
  FiShoppingBag,
  FiCheckCircle,
  FiEye,
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'

import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders, getOrder } from '../services/orderService.js'
import { addToCart } from '../utils/cartStorage.js'
import { formatOrderDateTime, formatTimeOnly } from '../utils/orderCancellation.js'

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
  const [reorderingOrderId, setReorderingOrderId] = useState(null)
  const [reorderFeedback, setReorderFeedback] = useState(null)

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

  // Auto-clear reorder toast after 6 seconds
  useEffect(() => {
    if (!reorderFeedback) return undefined
    const timer = setTimeout(() => {
      setReorderFeedback(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [reorderFeedback])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    const label = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
    return String(label || '').replace(/,\s*$/, '').trim()
  }

  const handleReorder = async (order) => {
    if (!order || reorderingOrderId) return
    setReorderingOrderId(order.id)
    try {
      let itemsToReorder = order.items
      let supplierName = order.supplier || order.supplierName || 'Supplier'
      let supplierId = order.supplierId

      if (!itemsToReorder || !itemsToReorder.length) {
        const res = await getOrder(order.id)
        const fullOrder = res.data?.order
        if (fullOrder) {
          itemsToReorder = fullOrder.items || []
          supplierName = fullOrder.supplierName || supplierName
          supplierId = fullOrder.supplierId || supplierId
        }
      }

      if (itemsToReorder && itemsToReorder.length > 0) {
        itemsToReorder.forEach((item) => {
          const itemBoxes = Number(item.boxes || (item.unitsPerBox ? Math.max(1, Math.floor(item.quantity / item.unitsPerBox)) : 1))
          addToCart({
            productId: item.productId,
            product: item.name || item.productNameSnapshot,
            name: item.name || item.productNameSnapshot,
            supplierId: supplierId || item.supplierId,
            supplierName: supplierName,
            unitPrice: item.unitPrice || item.unitPriceSnapshot,
            price: item.unitPrice || item.unitPriceSnapshot,
            unitsPerBox: item.unitsPerBox || item.unitsPerBoxSnapshot || 1,
            minimumQuantity: item.unitsPerBox || item.unitsPerBoxSnapshot || 1,
            boxQuantity: itemBoxes,
            boxes: itemBoxes,
            quantity: item.quantity,
            imageUrl: item.imageUrl || item.productImageUrlSnapshot || '',
          })
        })

        setReorderFeedback({
          supplier: supplierName,
          itemCount: itemsToReorder.length,
          orderId: order.id,
        })
      }
    } catch (err) {
      console.error('Failed to reorder items:', err)
    } finally {
      setReorderingOrderId(null)
    }
  }

  const totalOrdersCount = orders.length
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Preparing').length
  const totalSpending = orders.reduce((sum, o) => sum + Number(o.subtotal || o.amount || 0), 0)

  const summaryCards = [
    {
      label: t('totalOrders'),
      value: String(totalOrdersCount),
      detail: t('acrossAllSuppliers'),
      icon: cardIcons['Total orders'],
      accent: 'metric-primary',
      actionTo: '/dashboard/shop-owner/orders',
    },
    {
      label: t('pendingOrders'),
      value: String(pendingOrdersCount),
      detail: t('needYourAttention'),
      icon: cardIcons['Pending orders'],
      accent: 'metric-warning',
      actionTo: '/dashboard/shop-owner/orders',
    },
    {
      label: t('monthlySpending'),
      value: `₹${totalSpending.toLocaleString('en-IN')}`,
      detail: t('totalPlacedOrderValue'),
      icon: cardIcons['Monthly spending'],
      accent: 'metric-spending',
      actionTo: '/dashboard/shop-owner/analytics',
    },
  ]

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    supplier: o.supplierName || 'Supplier',
    supplierId: o.supplierId,
    items: o.items,
    amount: `₹${Number(o.subtotal || o.amount || 0).toLocaleString('en-IN')}`,
    status: o.status,
    date: formatOrderDateTime(o.createdAt),
  }))

  const deliveries = orders
    .filter((o) => o.status === 'Preparing' || o.status === 'Out for Delivery')
    .slice(0, 5)
    .map((o) => ({
      orderId: o.id,
      supplier: o.supplierName || 'Supplier',
      time: formatTimeOnly(o.createdAt),
      status: o.status,
    }))

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0">
      {/* ── HEADER ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {getDynamicGreeting()}, {firstName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('counterActive') || 'Counter Active'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('hereIsLatestView') || 'Your operational restocking hub and live delivery tracking.'}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/shop-owner/suppliers"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange-dark active:scale-[0.98] shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <FiShoppingBag size={16} />
            <span>{t('browseSuppliers') || 'Browse Suppliers & Restock'}</span>
          </Link>
        </div>
      </header>

      {/* ── 1-TAP REORDER FEEDBACK BANNER ── */}
      {reorderFeedback && (
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shrink-0">
              <FiCheckCircle size={16} />
            </span>
            <div className="text-xs sm:text-sm min-w-0">
              <strong className="font-bold block truncate">
                {reorderFeedback.itemCount} item(s) from {reorderFeedback.supplier} added to cart!
              </strong>
              <span className="text-emerald-700 text-[11px] sm:text-xs">
                Items grouped by supplier in your multi-supplier cart.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard/shop-owner/cart"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs active:scale-[0.95] shadow-xs transition-all"
            >
              <span>{t('viewCart') || 'View Cart'}</span>
              <FiArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() => setReorderFeedback(null)}
              className="p-1.5 text-emerald-600 hover:text-emerald-900 rounded-md hover:bg-emerald-100/50 transition-colors cursor-pointer text-xs font-bold"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── SUMMARY METRICS ROW ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-full min-w-0">
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

      {/* ── MAIN WORKSPACE GRID: RECENT ORDERS & TODAY'S DELIVERIES ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start w-full min-w-0">
        {/* LEFT: RECENT ORDERS WITH 1-TAP REORDER */}
        <section className="min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 lg:p-6 xl:p-5 2xl:p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg shrink-0">
                <FiList />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{t('recentOrders')}</h2>
                <span className="text-[11px] text-slate-400 block -mt-0.5">{t('oneTapReorderReady') || '1-tap quick reorder available'}</span>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors shrink-0" to="/dashboard/shop-owner/orders">
              {t('viewAll')} <FiArrowRight />
            </Link>
          </div>

          {recentOrders.length ? (
            <>
              {/* Mobile View: Clean Card List */}
              <div className="space-y-3 sm:hidden">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 break-words leading-snug">{order.supplier}</span>
                      <StatusBadge status={order.status} showRestocked={true} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-extrabold text-slate-900 tabular-nums">{order.amount}</span>
                      <span>{order.date}</span>
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{formatDashboardOrderId(order.id)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={reorderingOrderId === order.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-brand-orange text-xs font-bold active:scale-[0.95] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <FiRotateCw size={11} className={reorderingOrderId === order.id ? 'animate-spin' : ''} />
                          <span>{t('reorder') || 'Reorder'}</span>
                        </button>
                        <Link
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-brand-orange transition-colors px-1 py-1.5"
                          to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}
                        >
                          {t('view') || 'View'} <FiChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop View: Table */}
              <div className="hidden sm:block w-full max-w-full overflow-x-auto rounded-xl">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 pl-3.5 sm:pl-4 pr-2 bg-slate-50 rounded-l-xl font-bold whitespace-nowrap">{t('supplier')}</th>
                      <th className="py-2.5 px-2 bg-slate-50 font-bold whitespace-nowrap">{t('amount')}</th>
                      <th className="py-2.5 px-2 bg-slate-50 font-bold whitespace-nowrap">{t('status')}</th>
                      <th className="py-2.5 px-2 bg-slate-50 font-bold whitespace-nowrap">{t('date')}</th>
                      <th className="py-2.5 pl-2 pr-3.5 sm:pr-4 bg-slate-50 rounded-r-xl text-right font-bold whitespace-nowrap">
                        <span>{t('action') || 'Action'}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pl-3.5 sm:pl-4 pr-2 border-b border-slate-100">
                          <Link
                            to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}
                            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-brand-orange transition-colors truncate max-w-[120px] sm:max-w-[140px] xl:max-w-[150px] 2xl:max-w-[180px] block"
                            title={`View order details for ${order.id}`}
                          >
                            {order.supplier}
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap border-b border-slate-100">
                          {order.amount}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap border-b border-slate-100">
                          <StatusBadge status={order.status} showRestocked={true} />
                        </td>
                        <td className="py-2.5 px-2 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                          {order.date}
                        </td>
                        <td className="py-2.5 pl-2 pr-3.5 sm:pr-4 text-right whitespace-nowrap border-b border-slate-100">
                          <div className="inline-flex items-center justify-end gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleReorder(order)}
                              disabled={reorderingOrderId === order.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50/80 hover:bg-orange-100/90 text-brand-orange text-xs font-bold active:scale-[0.95] transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
                              title={`Add items from ${order.supplier} back to cart`}
                            >
                              <FiRotateCw size={11} className={reorderingOrderId === order.id ? 'animate-spin' : ''} />
                              <span>{t('reorder') || 'Reorder'}</span>
                            </button>
                            <Link 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold active:scale-[0.95] transition-all shadow-2xs cursor-pointer shrink-0" 
                              to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`} 
                              aria-label={`View ${order.id}`}
                              title="View order details"
                            >
                              <FiEye size={12} className="text-slate-400 group-hover:text-slate-600" />
                              <span>{t('view') || 'View'}</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange text-2xl shadow-xs mb-3.5">
                <FiPackage />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {t('welcomeToConnekto') || `Welcome to Connekto, ${firstName}!`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">
                {t('emptyDashboardGuide') || 'Your digital restocking hub is ready. Discover verified FMCG distributors and local suppliers in your area to start building your cart.'}
              </p>
              <Link
                to="/dashboard/shop-owner/suppliers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange-dark active:scale-[0.98] shadow-xs transition-all"
              >
                <FiShoppingBag size={16} />
                <span>{t('browseSuppliers') || 'Browse Local Suppliers'}</span>
              </Link>
            </div>
          )}
        </section>

        {/* RIGHT: TODAY'S DELIVERIES TRACKER */}
        <section className="min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 lg:p-6 xl:p-5 2xl:p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-brand-orange text-lg shrink-0">
                <FiTruck />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{t('todaysDeliveries')}</h2>
                <span className="text-[11px] text-slate-400 block -mt-0.5">{t('activeShipments') || 'Active shipments in transit'}</span>
              </div>
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
                      <span className="shrink-0"><StatusBadge status={delivery.status} showRestocked={true} /></span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-1 font-mono">
                      <span className="truncate" title={delivery.orderId}>{formatDashboardOrderId(delivery.orderId)}</span>
                      <span className="shrink-0">{delivery.time}</span>
                    </div>
                  </div>
                  <Link 
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shrink-0 shadow-2xs" 
                    to={`/dashboard/shop-owner/orders/${encodeURIComponent(delivery.orderId)}`} 
                    aria-label={`View delivery ${delivery.orderId}`}
                    title="View delivery details"
                  >
                    <span>{t('view') || 'View'}</span>
                    <FiChevronRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-400 text-xl mb-3">
                <FiTruck />
              </span>
              <strong className="text-sm font-bold text-slate-800">
                {t('noDeliveriesPendingToday') || 'No Shipments In Transit Today'}
              </strong>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {t('deliveriesNotice') || 'Orders marked Out for Delivery or Preparing will automatically appear here with arrival updates.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── CONTEXTUAL RESTOCK & INSIGHTS BANNER ── */}
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
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link 
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-orange/30 text-xs font-bold text-brand-orange hover:bg-brand-orange-light transition-all shadow-xs" 
            to="/dashboard/shop-owner/analytics"
          >
            <span>{t('viewInsights')}</span>
            <FiArrowRight />
          </Link>
        </div>
      </section>
    </section>
  )
}
