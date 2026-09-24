import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiXCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'
import { getItemUnitLabel } from '../utils/cartStorage.js'

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
  return `Rs\u00A0${Number(value).toLocaleString('en-IN')}`
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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
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
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [query, setQuery] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers')
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [currentTime] = useState(Date.now)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrders()
      .then((response) => setOrders(response?.data?.orders || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

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
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{t('orders')}</span>
        </div>
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
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>{t('shopOwner')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('orders')}</span>
      </div>

      <div className="pb-2 border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('yourOrders')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('ordersSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
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

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              aria-selected={isActive}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              role="tab"
              type="button"
            >
              {t(tab.key)}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_250px] 2xl:grid-cols-[minmax(0,1fr)_280px] gap-3.5 lg:gap-4 items-start w-full min-w-0">
        <div className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-3.5 md:p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-wrap">
            <label className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[220px] w-full sm:w-auto focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
              <span className="text-slate-400 mr-2 text-sm" aria-hidden="true">⌕</span>
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
            <div className="overflow-hidden">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 rounded-l-xl font-bold w-[17%]">{t('ordersColumnOrder')}</th>
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[23%]">{t('ordersColumnSupplier')}</th>
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[10%]">{t('ordersColumnItems')}</th>
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[12%]">{t('ordersColumnAmount')}</th>
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 font-bold w-[19%]">{t('ordersColumnStatus')}</th>
                    <th className="py-2 px-1.5 sm:px-2 bg-slate-50 rounded-r-xl font-bold w-[19%]">{t('ordersColumnDate')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleOrders.map((order) => {
                    const items = order.items || []
                    const isSelected = selectedOrder?.id === order.id
                    return (
                      <tr
                        aria-selected={isSelected}
                        className={`transition-all cursor-pointer ${
                          isSelected ? 'bg-orange-50/90 font-semibold' : 'hover:bg-slate-50/70'
                        }`}
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setSelectedOrderId(order.id)
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
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="py-2.5 px-1.5 sm:px-2 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                          {formatOrderDate(order.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={t('noOrders')} message={orders.length ? t('noOrdersFoundSearch') : t('noOrdersYet')} />
          )}
        </div>

        {selectedOrder && (
          <aside className="w-full min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4 xl:sticky xl:top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{t('ordersDetails')}</h2>
            </div>

            <div className="flex items-center justify-between gap-2 min-w-0">
              <strong className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate" title={`#${selectedOrder.id}`}>
                {formatOrderId(selectedOrder.id)}
              </strong>
              <span className="shrink-0"><StatusBadge status={selectedOrder.status} /></span>
            </div>

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
    </section>
  )
}
