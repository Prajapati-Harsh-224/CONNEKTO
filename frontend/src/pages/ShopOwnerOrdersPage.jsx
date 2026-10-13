import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiXCircle, FiSearch } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import CancelOrderModal from '../components/CancelOrderModal.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'
import { getItemUnitLabel } from '../utils/cartStorage.js'
import { getOrderCancellationStatus, formatOrderDateTime, formatFullDateTime } from '../utils/orderCancellation.js'

const tabs = [
  { value: 'All', key: 'ordersAll' },
  { value: 'Pending', key: 'pending' },
  { value: 'In Progress', key: 'ordersInProgress' },
  { value: 'Delivered', key: 'delivered' },
  { value: 'Cancelled', key: 'cancelled' },
]

function priceValue(value) {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0
}

function formatPrice(value) {
  return `₹\u00A0${Number(value).toLocaleString('en-IN')}`
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function statusGroup(status) {
  const normalized = displayStatus(status)
  if (normalized === 'Pending' || normalized === 'Request Sent') return 'Pending'
  if (normalized === 'Accepted' || normalized === 'Preparing' || normalized === 'Out for Delivery') return 'In Progress'
  return normalized
}

function displayStatus(status = '') {
  if (status === 'REQUESTED') return 'Request Sent'
  return status.replaceAll('_', ' ')
}

function formatOrderId(orderId) {
  const value = String(orderId || '').trim()
  if (!value) return '#ORD-000000'
  if (value.startsWith('#')) return value
  const hexMatch = value.match(/[A-Fa-f0-9]{8}/)
  if (hexMatch) return `#${hexMatch[0].toUpperCase()}`
  const clean = value.replace(/^SUPPLIER[-_]?/i, '').replace(/[^A-Za-z0-9]/g, '')
  return `#${(clean.slice(0, 8) || value.slice(0, 8)).toUpperCase()}`
}

function displayOrderId(orderId, maxLength = 25) {
  const value = String(orderId || '')
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function displayPaymentMethod(paymentMethod, t) {
  const normalized = String(paymentMethod || '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
  if (t) {
    if (normalized === 'CASH_ON_DELIVERY') return t('cashOnDelivery')
    if (normalized === 'PAY_LATER') return t('payLater')
    if (normalized === 'REQUEST_ORDER') return t('requestOrder')
  }
  const labels = { CASH_ON_DELIVERY: 'Cash on Delivery', PAY_LATER: 'Pay Later', REQUEST_ORDER: 'Request Order' }
  return labels[normalized] || paymentMethod || '—'
}

function formatOrderDate(value) {
  return formatOrderDateTime(value)
}

function getSupplierDetails(order) {
  return {
    category: '',
    location: order.serviceArea || '—',
  }
}

function productName(item) {
  return item.productNameSnapshot || item.name || item.productName || 'Product'
}

export default function ShopOwnerOrdersPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers')
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [currentTime, setCurrentTime] = useState(Date.now)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getOrders()
      .then((response) => setOrders(response?.data?.orders || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  function handleOrderCancelled(updatedOrder) {
    setOrders((prev) => prev.map((ord) => (ord.id === updatedOrder.id ? { ...ord, ...updatedOrder } : ord)))
  }

  const suppliers = useMemo(() => ['All Suppliers', ...new Set(orders.map((order) => order.supplierName).filter(Boolean))], [orders])
  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((order) => statusGroup(order.status) === 'Pending').length,
    progress: orders.filter((order) => statusGroup(order.status) === 'In Progress').length,
    delivered: orders.filter((order) => statusGroup(order.status) === 'Delivered').length,
    cancelled: orders.filter((order) => statusGroup(order.status) === 'Cancelled').length,
  }), [orders])

  const visibleOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const searchable = `${order.id} ${order.supplierName} ${displayStatus(order.status)} ${(order.items || []).map(productName).join(' ')}`.toLowerCase()
      const createdAt = new Date(order.createdAt).getTime()
      const matchesTab = activeTab === 'All' || statusGroup(order.status) === activeTab
      const matchesQuery = searchable.includes(query.trim().toLowerCase())
      const matchesSupplier = supplierFilter === 'All Suppliers' || order.supplierName === supplierFilter
      const matchesTime = timeFilter === 'All Time' || (timeFilter === 'Last 30 days' && currentTime - createdAt <= 30 * 24 * 60 * 60 * 1000) || (timeFilter === 'Last 90 days' && currentTime - createdAt <= 90 * 24 * 60 * 60 * 1000)
      return matchesTab && matchesQuery && matchesSupplier && matchesTime
    })
    return filtered.sort((first, second) => sortBy === 'oldest' ? new Date(first.createdAt) - new Date(second.createdAt) : new Date(second.createdAt) - new Date(first.createdAt))
  }, [activeTab, currentTime, orders, query, sortBy, supplierFilter, timeFilter])

  const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) || visibleOrders[0]
  const selectedSupplier = selectedOrder ? getSupplierDetails(selectedOrder) : null
  const selectedItems = selectedOrder?.items || []
  const selectedCancelStatus = selectedOrder ? getOrderCancellationStatus(selectedOrder, currentTime) : null
  const stats = [
    { key: 'total', label: t('ordersTotalOrders'), value: counts.all, description: t('ordersAllTime'), icon: FiPackage, tabValue: 'All' },
    { key: 'pending', label: t('pending'), value: counts.pending, description: t('ordersAwaitingConfirmation'), icon: FiClock, tabValue: 'Pending' },
    { key: 'progress', label: t('ordersInProgress') || 'In Progress', value: counts.progress, description: 'Active fulfillment', icon: FiTruck, tabValue: 'In Progress' },
    { key: 'delivered', label: t('delivered'), value: counts.delivered, description: t('ordersCompleted'), icon: FiCheckCircle, tabValue: 'Delivered' },
    { key: 'cancelled', label: t('cancelled'), value: counts.cancelled, description: t('ordersCancelled'), icon: FiXCircle, tabValue: 'Cancelled' },
  ]

  if (isLoading) return <LoadingState message={t('loadingOrders')} />
  if (error) {
    return (
      <section className="space-y-4 w-full min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('yourOrders')}</h1>
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
        <button 
          className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer" 
          onClick={() => window.location.reload()} 
          type="button"
        >
          {t('tryAgain')}
        </button>
      </section>
    )
  }

  const statTones = {
    total: 'bg-blue-50 text-blue-600 border-blue-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    progress: 'bg-purple-50 text-purple-600 border-purple-100',
    delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
  }

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0">
      <div className="pb-2 border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('yourOrders')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('ordersSubtitle')}</p>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const tone = statTones[stat.key] || statTones.total
          const isFilterActive = activeTab === stat.tabValue
          return (
            <article
              aria-pressed={isFilterActive}
              className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border shadow-xs transition-all cursor-pointer select-none ${
                isFilterActive
                  ? 'border-brand-orange ring-2 ring-brand-orange/20 shadow-sm'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
              key={stat.key}
              onClick={() => setActiveTab(stat.tabValue)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setActiveTab(stat.tabValue)
              }}
              role="button"
              tabIndex="0"
            >
              <span className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-base sm:text-lg shrink-0 ${tone}`} aria-hidden="true">
                <Icon />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{stat.label}</span>
                <strong className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">{stat.value}</strong>
                <small className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate hidden md:inline">{stat.description}</small>
              </div>
            </article>
          )
        })}
      </div>

      <div className="grid grid-cols-5 xl:inline-flex xl:w-auto gap-1 sm:gap-1.5 md:gap-2 pb-2 border-b border-slate-200/80 w-full" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              aria-selected={isActive}
              className={`flex items-center justify-center text-center px-1 sm:px-2 md:px-3 xl:px-4 py-2 rounded-xl text-[10.5px] sm:text-xs md:text-sm font-semibold transition-all cursor-pointer min-h-[38px] sm:min-h-[42px] xl:min-h-0 leading-tight select-none ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              role="tab"
              type="button"
            >
              <span>{t(tab.key)}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_250px] 2xl:grid-cols-[minmax(0,1fr)_280px] gap-3.5 lg:gap-4 items-start w-full min-w-0">
        <div className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-3.5 md:p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap w-full min-w-0">
            <label className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-0 w-full sm:w-auto focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
              <FiSearch className="w-4 h-4 text-slate-400 mr-2 shrink-0 pointer-events-none" />
              <input
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('ordersSearchPlaceholder')}
                type="search"
                value={query}
              />
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
                onChange={(event) => setSupplierFilter(event.target.value)}
                value={supplierFilter}
              >
                {suppliers.map((supplier) => (
                  <option key={supplier}>{supplier}</option>
                ))}
              </select>

              <select
                className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
                onChange={(event) => setTimeFilter(event.target.value)}
                value={timeFilter}
              >
                <option value="All Time">{t('allTime')}</option>
                <option value="Last 30 days">{t('last30Days')}</option>
                <option value="Last 90 days">{t('last90Days')}</option>
              </select>

              <select
                className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                <option value="newest">{t('sortNewest')}</option>
                <option value="oldest">{t('sortOldest')}</option>
              </select>
            </div>
          </div>

          {visibleOrders.length ? (
            <>
              {/* Mobile View: Clean Responsive Card List */}
              <div className="space-y-3 sm:hidden w-full min-w-0">
                {visibleOrders.map((order) => {
                  const items = order.items || []
                  const totalBoxes = items.reduce((sum, itm) => sum + Number(itm.boxes || (itm.quantity ? Math.floor(itm.quantity / (itm.unitsPerBoxSnapshot || itm.unitsPerBox || 1)) : 1)), 0)
                  const cancelStatus = getOrderCancellationStatus(order, currentTime)

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        navigate(`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`)
                      }}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {items[0] ? (
                            <ProductImage
                              key={items[0].productId}
                              alt=""
                              aria-hidden="true"
                              className="w-7 h-7 rounded-lg border border-slate-100 object-cover shrink-0"
                              fallbackText={productName(items[0]).slice(0, 1)}
                              src={items[0].imageUrl || items[0].imageLabel || ''}
                            />
                          ) : (
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-400">#</span>
                          )}
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">{formatOrderId(order.id)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={order.status} showRestocked={true} />
                          {order.status === 'Preparing' && cancelStatus.canCancel && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
                              ⏱️ {cancelStatus.formattedTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {order.status === 'Cancelled' && order.cancellationReason && (
                        <div className="text-[11px] bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100">
                          <span className="font-semibold">Reason:</span> {order.cancellationReason}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[160px]">{order.supplierName}</span>
                        <strong className="text-slate-900 font-extrabold tabular-nums">{formatPrice(order.subtotal)}</strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span>{totalBoxes} Boxes ({items.length} {items.length === 1 ? t('itemCount') : t('itemsCount')})</span>
                        <span>{formatOrderDate(order.createdAt)}</span>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <Link
                          to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 px-3 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-black text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>{t('ordersDetails') || 'Order Details'}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                        {cancelStatus.canCancel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCancellingOrder(order)
                            }}
                            className="py-2 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                          >
                            <span>✕ Cancel</span>
                            {order.status === 'Preparing' && (
                              <span className="font-mono text-[10px] text-amber-900 font-black">({cancelStatus.formattedTime})</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tablet & Desktop View: Table wrapped in scroll-safe container */}
              <div className="hidden sm:block w-full max-w-full overflow-x-auto rounded-xl">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[620px]">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 rounded-l-xl font-bold w-[16%]">{t('ordersColumnOrder')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[22%]">{t('ordersColumnSupplier')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[10%]">{t('ordersColumnItems')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[12%]">{t('ordersColumnAmount')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[18%]">{t('ordersColumnStatus')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[13%]">{t('ordersColumnDate')}</th>
                      <th className="py-2 px-1.5 sm:px-2 bg-slate-50 rounded-r-xl font-bold w-[9%] text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleOrders.map((order) => {
                      const items = order.items || []
                      const isSelected = selectedOrder?.id === order.id
                      const cancelStatus = getOrderCancellationStatus(order, currentTime)
                      return (
                        <tr
                          aria-selected={isSelected}
                          className={`transition-all cursor-pointer ${
                            isSelected ? 'bg-orange-50/90 font-semibold' : 'hover:bg-slate-50/70'
                          }`}
                          key={order.id}
                          onClick={() => {
                            setSelectedOrderId(order.id)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setSelectedOrderId(order.id)
                            }
                          }}
                          role="button"
                          tabIndex="0"
                        >
                          <td className={`py-2.5 px-1.5 sm:px-2 border-b border-slate-100 ${isSelected ? 'border-l-4 border-l-brand-orange rounded-l-md' : 'border-l-4 border-l-transparent'}`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="shrink-0">
                                {items[0] ? (
                                  <ProductImage
                                    key={items[0].productId}
                                    alt=""
                                    aria-hidden="true"
                                    className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-md border border-white object-cover shadow-2xs"
                                    fallbackText={productName(items[0]).slice(0, 1)}
                                    src={items[0].imageUrl || items[0].imageLabel || ''}
                                  />
                                ) : (
                                  <span className="flex items-center justify-center w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-md bg-slate-100 text-xs font-bold text-slate-400">#</span>
                                )}
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-900 whitespace-nowrap shrink-0" title={`#${order.id}`}>
                                {formatOrderId(order.id)}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
                                {getInitials(order.supplierName)}
                              </span>
                              <strong className="text-xs font-semibold text-slate-800 truncate block max-w-[105px] sm:max-w-[130px]" title={order.supplierName}>
                                {order.supplierName}
                              </strong>
                            </div>
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 text-xs text-slate-500 font-medium whitespace-nowrap border-b border-slate-100">
                            {items.reduce((sum, itm) => sum + Number(itm.boxes || (itm.quantity ? Math.floor(itm.quantity / (itm.unitsPerBoxSnapshot || itm.unitsPerBox || 1)) : 1)), 0)} Boxes ({items.length} {items.length === 1 ? t('itemCount') : t('itemsCount')})
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap border-b border-slate-100">
                            {formatPrice(order.subtotal)}
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 whitespace-nowrap border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={order.status} showRestocked={true} />
                              {order.status === 'Preparing' && cancelStatus.canCancel && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold" title="Time remaining to cancel">
                                  ⏱️ {cancelStatus.formattedTime}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                            {formatOrderDate(order.createdAt)}
                          </td>

                          <td className="py-2.5 px-1.5 sm:px-2 text-right whitespace-nowrap border-b border-slate-100">
                            {cancelStatus.canCancel ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCancellingOrder(order)
                                }}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title={order.status === 'Preparing' ? `Cancel order (${cancelStatus.formattedTime} left)` : 'Cancel order'}
                              >
                                <span>Cancel</span>
                                {order.status === 'Preparing' && (
                                  <span className="font-mono text-[10px] text-amber-900 font-black">({cancelStatus.formattedTime})</span>
                                )}
                              </button>
                            ) : order.status === 'Preparing' ? (
                              <span className="text-slate-400 text-[11px] font-medium" title="2-minute cancellation window expired">Window expired</span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState title={t('noOrders')} message={orders.length ? t('noOrdersFoundSearch') : t('noOrdersYet')} />
          )}
        </div>

        {/* Desktop View: Order Details Sidebar Card */}
        {selectedOrder && (
          <aside className="hidden xl:block w-full min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4 xl:sticky xl:top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{t('ordersDetails')}</h2>
            </div>

            <div className="flex items-center justify-between gap-2 min-w-0">
              <strong className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate" title={`#${selectedOrder.id}`}>
                {formatOrderId(selectedOrder.id)}
              </strong>
              <span className="shrink-0"><StatusBadge status={selectedOrder.status} showRestocked={true} /></span>
            </div>

            {selectedCancelStatus?.canCancel && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                {selectedOrder.status === 'Preparing' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Cancellation Window:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs shadow-2xs">
                      ⏱️ {selectedCancelStatus.formattedTime} left
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Order Cancellation:</span>
                    <span className="font-semibold text-emerald-600">Immediately eligible</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCancellingOrder(selectedOrder)}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>✕</span>
                  <span>Cancel Order</span>
                  {selectedOrder.status === 'Preparing' && (
                    <span className="font-mono text-[11px] font-black text-amber-900">({selectedCancelStatus.formattedTime})</span>
                  )}
                </button>
              </div>
            )}

            {selectedOrder.status === 'Preparing' && !selectedCancelStatus?.canCancel && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-1.5">
                <span>🔒</span>
                <span>Preparation started • 2-minute cancellation window expired</span>
              </div>
            )}

            {selectedOrder.status === 'Cancelled' && selectedOrder.cancellationReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-0.5">
                <span className="font-bold block">Cancellation Reason:</span>
                <p>{selectedOrder.cancellationReason}</p>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-xs font-bold text-brand-orange shrink-0">
                {getInitials(selectedOrder.supplierName)}
              </span>
              <div className="flex flex-col min-w-0">
                <strong className="text-sm font-semibold text-slate-900 truncate">{selectedOrder.supplierName}</strong>
                <small className="text-xs text-slate-400 truncate">{selectedSupplier.location}</small>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('ordersItems')} ({selectedItems.length})
              </h3>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedItems.map((item) => {
                  const upb = Math.max(1, Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1))
                  const boxes = Number(item.boxes) || Math.max(1, Math.floor(Number(item.quantity || upb) / upb))
                  const unitLabel = getItemUnitLabel(item, item.quantity)
                  return (
                    <div className="flex items-center justify-between gap-3 text-xs" key={item.productId}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProductImage
                          alt=""
                          aria-hidden="true"
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                          fallbackText={productName(item).slice(0, 1)}
                          src={item.imageUrl || item.imageLabel || ''}
                        />
                        <div className="flex flex-col min-w-0">
                          <strong className="text-slate-800 truncate font-semibold">{productName(item)}</strong>
                          <small className="text-slate-400">
                            {boxes} {boxes === 1 ? 'Box' : 'Boxes'} ({item.quantity} {unitLabel})
                          </small>
                        </div>
                      </div>
                      <strong className="font-bold text-slate-900 shrink-0">
                        {formatPrice(priceValue(item.lineTotal) || priceValue(item.unitPriceSnapshot) * Number(item.quantity))}
                      </strong>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>{t('ordersItemTotal')}</span>
                <span className="font-semibold text-slate-700">{formatPrice(priceValue(selectedOrder.subtotal))}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{t('ordersDeliveryFee')}</span>
                <span className="font-semibold text-slate-700">{formatPrice(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>{t('ordersTotalAmount')}</span>
                <span>{formatPrice(priceValue(selectedOrder.subtotal))}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>{t('ordersPlaced')}:</span>
                <span className="font-medium text-slate-700">{formatOrderDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('payment')}:</span>
                <span className="font-medium text-slate-700">{displayPaymentMethod(selectedOrder.paymentMethod, t)}</span>
              </div>
            </div>

            <Link
              className="block w-full text-center py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold text-xs transition-colors shadow-xs"
              to={`/dashboard/shop-owner/orders/${encodeURIComponent(selectedOrder.id)}`}
            >
              {t('ordersViewFullDetails')} →
            </Link>
          </aside>
        )}
      </div>

      <CancelOrderModal
        isOpen={Boolean(cancellingOrder)}
        order={cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onOrderCancelled={handleOrderCancelled}
        currentTime={currentTime}
      />
    </section>
  )
}
