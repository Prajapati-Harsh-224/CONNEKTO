import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrders, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const pageSize = 8

function normalizeOrder(order) {
  return {
    ...order,
    customer: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    area: order.serviceArea || '',
    date: order.createdAt,
    amount: order.subtotal,
    items: (order.items || []).map((item) => ({ ...item, name: item.name || item.productNameSnapshot || 'Product' })),
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function formatOrderId(orderId) {
  const value = String(orderId || '').trim()
  if (!value) return 'ORD-00000000'

  const match = value.match(/[A-Fa-f0-9]{8}/)
  const shortCode = match ? match[0].toUpperCase() : value.replace(/[^A-Fa-f0-9]/g, '').slice(0, 8).toUpperCase() || '00000000'

  return `ORD-${shortCode}`
}

export default function SupplierIncomingOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('All Orders')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [customerFilter, setCustomerFilter] = useState('All Customers')
  const [dateFilter, setDateFilter] = useState('Select Date Range')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const tabs = [
    { key: 'All Orders', label: t('ordersAll') || 'All Orders' },
    { key: 'Pending', label: t('pending') || 'Pending' },
    { key: 'Accepted', label: t('accepted') || 'Accepted' },
    { key: 'Preparing', label: t('preparing') || 'Preparing' },
    { key: 'Out for Delivery', label: t('outForDelivery') || 'Out for Delivery' },
    { key: 'Delivered', label: t('delivered') || 'Delivered' },
    { key: 'Cancelled', label: t('cancelled') || 'Cancelled' },
  ]
  const statusOptions = [
    { label: t('allStatuses'), value: 'All Statuses' },
    { label: t('pending'), value: 'Pending' },
    { label: t('accepted'), value: 'Accepted' },
    { label: t('preparing'), value: 'Preparing' },
    { label: t('outForDelivery'), value: 'Out for Delivery' },
    { label: t('delivered'), value: 'Delivered' },
    { label: t('cancelled'), value: 'Cancelled' },
  ]
  const customerOptions = useMemo(() => ['All Customers', ...new Set(orders.map((order) => order.customer).filter(Boolean))], [orders])
  const translatedCustomerOptions = useMemo(() => [{ label: t('allCustomers'), value: 'All Customers' }, ...customerOptions.slice(1).map((customer) => ({ label: customer, value: customer }))], [customerOptions, t])
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)

const fallbackSupplierOrders = [
  {
    id: 'ord-8a9b2c1d',
    shopOwner: 'Krishna Kirana Store',
    customer: 'Krishna Kirana Store',
    area: 'Satellite, Ahmedabad',
    date: new Date().toISOString(),
    amount: 4850,
    status: 'Pending',
    items: [
      { name: 'Tata Tea Gold', quantity: 20, boxes: 2, unitsPerBox: 10 },
      { name: 'Fortune Sunflower Oil 1L', quantity: 24, boxes: 2, unitsPerBox: 12 },
    ]
  },
  {
    id: 'ord-3e4f5a6b',
    shopOwner: 'Shree Ganesh Supermarket',
    customer: 'Shree Ganesh Supermarket',
    area: 'Vastrapur, Ahmedabad',
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    amount: 12400,
    status: 'Preparing',
    items: [
      { name: 'Aashirvaad Atta 10kg', quantity: 10, boxes: 5, unitsPerBox: 2 },
      { name: 'Maggi Noodles 70g', quantity: 96, boxes: 4, unitsPerBox: 24 },
    ]
  },
  {
    id: 'ord-7c8d9e0f',
    shopOwner: 'A-One Provision Store',
    customer: 'A-One Provision Store',
    area: 'Navrangpura, Ahmedabad',
    date: new Date(Date.now() - 86400000).toISOString(),
    amount: 2350,
    status: 'Out for Delivery',
    items: [
      { name: 'Parle-G Gold Biscuits', quantity: 48, boxes: 2, unitsPerBox: 24 },
    ]
  },
  {
    id: 'ord-1a2b3c4d',
    shopOwner: 'Radhe Mart',
    customer: 'Radhe Mart',
    area: 'Bodakdev, Ahmedabad',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    amount: 18900,
    status: 'Delivered',
    items: [
      { name: 'Basmati Rice 25kg', quantity: 10, boxes: 10, unitsPerBox: 1 },
      { name: 'Everest Turmeric Powder', quantity: 40, boxes: 2, unitsPerBox: 20 },
    ]
  },
  {
    id: 'ord-5e6f7a8b',
    shopOwner: 'Jai Hind Kirana Stores',
    customer: 'Jai Hind Kirana Stores',
    area: 'Maninagar, Ahmedabad',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    amount: 6750,
    status: 'Accepted',
    items: [
      { name: 'Amul Pure Ghee 1L', quantity: 12, boxes: 1, unitsPerBox: 12 },
    ]
  },
  {
    id: 'ord-9c0d1e2f',
    shopOwner: 'Shreeji General Store',
    customer: 'Shreeji General Store',
    area: 'Ellis Bridge, Ahmedabad',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    amount: 3200,
    status: 'Cancelled',
    items: [
      { name: 'Colgate MaxFresh 150g', quantity: 24, boxes: 1, unitsPerBox: 24 },
    ]
  }
]

  useEffect(() => {
    let isMounted = true
    getSupplierOrders()
      .then((response) => {
        if (isMounted) {
          const rawOrders = response?.data?.orders || []
          setOrders(rawOrders.length > 0 ? rawOrders.map(normalizeOrder) : fallbackSupplierOrders)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setOrders(fallbackSupplierOrders)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [activeTab, search, statusFilter, customerFilter, dateFilter])

  const counts = useMemo(() => ({
    'All Orders': orders.length,
    Pending: orders.filter((order) => order.status === 'Pending').length,
    Accepted: orders.filter((order) => order.status === 'Accepted').length,
    Preparing: orders.filter((order) => order.status === 'Preparing').length,
    'Out for Delivery': orders.filter((order) => order.status === 'Out for Delivery').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
    Cancelled: orders.filter((order) => order.status === 'Cancelled').length,
  }), [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab = activeTab === 'All Orders' || order.status === activeTab
      const matchesStatus = statusFilter === 'All Statuses' || order.status === statusFilter
      const matchesCustomer = customerFilter === 'All Customers' || order.customer === customerFilter

      const searchText = `${order.id} ${order.customer}`.toLowerCase()
      const matchesSearch = !search || searchText.includes(search.toLowerCase())

      let matchesDate = true
      if (dateFilter === 'Today') {
        matchesDate = new Date(order.date).toDateString() === new Date().toDateString()
      } else if (dateFilter === 'Last 7 days') {
        const diffMs = new Date() - new Date(order.date)
        matchesDate = diffMs <= 7 * 24 * 60 * 60 * 1000
      } else if (dateFilter === 'Last 30 days') {
        const diffMs = new Date() - new Date(order.date)
        matchesDate = diffMs <= 30 * 24 * 60 * 60 * 1000
      }

      return matchesTab && matchesStatus && matchesCustomer && matchesSearch && matchesDate
    })
  }, [activeTab, customerFilter, dateFilter, orders, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)
  const displayedOrders = isMobile ? filteredOrders : visibleOrders
  const targetOrders = isMobile ? filteredOrders : visibleOrders
  const allVisibleSelected = targetOrders.length > 0 && targetOrders.every((order) => selectedIds.includes(order.id))

  function handleSelectAll(checked) {
    const target = isMobile ? filteredOrders : visibleOrders
    setSelectedIds(checked ? target.map((order) => order.id) : [])
  }

  function toggleSelection(orderId) {
    setSelectedIds((current) => current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId])
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('All Statuses')
    setCustomerFilter('All Customers')
    setDateFilter('Select Date Range')
    setActiveTab('All Orders')
  }

  async function applyBulkStatus(nextStatus) {
    if (!selectedIds.length) return
    setIsUpdating(true)
    try {
      const selectedOrders = orders.filter((order) => selectedIds.includes(order.id))
      const responses = await Promise.all(selectedOrders.map((order) => updateSupplierOrderStatus(order.id, nextStatus)))
      const updatedStatuses = new Map(responses.map((response) => [response.data.order.id, response.data.order.status]))
      setOrders((current) => current.map((order) => updatedStatuses.has(order.id) ? { ...order, status: updatedStatuses.get(order.id) } : order))
      setSelectedIds([])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  function exportOrders() {
    const rowsToExport = selectedIds.length ? filteredOrders.filter((order) => selectedIds.includes(order.id)) : filteredOrders
    const rows = [
      ['Order ID', 'Customer', 'Area', 'Status', 'Amount', 'Date'].join(','),
      ...rowsToExport.map((order) => [order.id, order.customer, order.area, order.status, order.amount, formatDateTime(order.date)].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'supplier-orders.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingState message={t('loadingIncomingOrders')} />
  if (error && !orders.length) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>{t('supplier')}</span>
          <span aria-hidden="true">›</span>
          <span className="font-semibold text-slate-800">{t('orders')}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t('incomingOrders')}</h1>
        <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p>
        <button
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          onClick={() => window.location.reload()}
          type="button"
        >
          {t('tryAgain')}
        </button>
      </section>
    )
  }

  return (
    <section className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>{t('supplier')}</span>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-slate-800">{t('orders')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-serif text-brand-navy">{t('orders')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{t('manageOrdersProductsCustomers')}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer text-center"
            onClick={exportOrders}
            type="button"
          >
            {t('export')}
          </button>
          <div className="flex-1 sm:flex-initial">
            <select
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              defaultValue=""
              disabled={!selectedIds.length || isUpdating}
              onChange={(event) => {
                const value = event.target.value
                if (value) applyBulkStatus(value)
                event.target.value = ''
              }}
            >
              <option value="">{t('bulkActions')}</option>
              <option value="Accepted">{t('markAccepted')}</option>
              <option value="Preparing">{t('markPreparing')}</option>
              <option value="Out for Delivery">{t('markOutForDelivery')}</option>
              <option value="Delivered">{t('markDelivered')}</option>
              <option value="Cancelled">{t('cancelOrder')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 pb-2 border-b border-slate-200 w-full" role="tablist">
        {tabs.map((tab) => (
          <button
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            type="button"
          >
            <span>{tab.label}</span>
            {tab.key !== 'All Orders' && <small className="opacity-80">({counts[tab.key] || 0})</small>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm" aria-hidden="true">⌕</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchOrdersByIdOrCustomer')}
              type="search"
              value={search}
              className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <select
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer truncate"
            >
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <select
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer truncate"
            >
              {translatedCustomerOptions.map((customer) => <option key={customer.value} value={customer.value}>{customer.label}</option>)}
            </select>
            <select
              onChange={(event) => setDateFilter(event.target.value)}
              value={dateFilter}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer truncate"
            >
              <option value="Select Date Range">{t('selectDateRange')}</option>
              <option value="Today">{t('today')}</option>
              <option value="Last 7 days">{t('last7Days')}</option>
              <option value="Last 30 days">{t('last30Days')}</option>
            </select>
            <button
              onClick={clearFilters}
              type="button"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-center"
            >
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bulk Selection Banner */}
      {selectedIds.length > 0 && (
        <div className="sm:hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-2xs">
          <span>{selectedIds.length} order{selectedIds.length > 1 ? 's' : ''} selected</span>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-emerald-700 font-bold underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Mobile Selection & Count Toolbar */}
      <div className="sm:hidden flex items-center justify-between px-1 text-xs text-slate-500">
        <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
          <input
            checked={allVisibleSelected}
            onChange={(event) => handleSelectAll(event.target.checked)}
            type="checkbox"
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Select all ({displayedOrders.length})</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Total: {filteredOrders.length}
        </span>
      </div>

      {/* Mobile View: Clean Card List */}
      <div className="space-y-3 sm:hidden w-full min-w-0">
        {displayedOrders.length ? (
          displayedOrders.map((order) => {
            const orderItems = Array.isArray(order.items) ? order.items : []
            const orderBoxes = orderItems.reduce((sum, item) => {
              const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || item.minimumQuantity || item.minimum_quantity || 1)
              const boxes = Number(item.boxes) || (unitsPerBox > 1 ? Math.floor(Number(item.quantity) / unitsPerBox) : Number(item.quantity)) || 1
              return sum + boxes
            }, 0)
            const isChecked = selectedIds.includes(order.id)

            return (
              <div
                key={order.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isChecked
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <label className="flex items-center cursor-pointer pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        checked={isChecked}
                        onChange={() => toggleSelection(order.id)}
                        type="checkbox"
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-mono font-bold text-slate-900 block truncate">
                        {formatOrderId(order.id)}
                      </span>
                      <strong className="text-xs font-bold text-slate-900 truncate block mt-0.5" title={order.customer}>
                        {order.customer}
                      </strong>
                      {order.area && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {order.area}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t('amount')}</span>
                    <strong className="text-sm font-black text-slate-900 tabular-nums">
                      {formatCurrency(order.amount)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t('itemsCount')}</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {orderBoxes} {orderBoxes === 1 ? (t('boxSingular') || 'Box') : (t('boxPlural') || 'Boxes')}
                      <span className="text-[10px] text-slate-400 ml-1">({orderItems.length} {orderItems.length === 1 ? (t('productSingular') || 'item') : (t('productPlural') || 'items')})</span>
                    </span>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Products</span>
                    <div className="flex flex-wrap gap-1.5">
                      {orderItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-slate-700 text-[11px] font-medium"
                        >
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.quantity ? (
                            <span className="text-slate-400 text-[10px]">×{item.quantity}</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatDateTime(order.date)}</span>
                  <Link
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
                    to={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`}
                  >
                    <span>{t('view')}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-6 bg-white rounded-xl border border-slate-100">
            <EmptyState title={t('noOrdersFound')} message={t('noOrdersFoundMessage')} />
          </div>
        )}
      </div>

      {/* Tablet & Desktop View: Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5 w-12">
                  <label className="flex items-center cursor-pointer">
                    <input checked={allVisibleSelected} onChange={(event) => handleSelectAll(event.target.checked)} type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                  </label>
                </th>
                <th className="py-3 px-4 font-bold w-[14%]">{t('orderId')}</th>
                <th className="py-3 px-4 font-bold w-[24%]">{t('customerShop')}</th>
                <th className="py-3 px-4 font-bold w-[10%]">{t('itemsCount')}</th>
                <th className="py-3 px-4 font-bold w-[11%]">{t('amount')}</th>
                <th className="py-3 px-4 font-bold w-[14%]">{t('status')}</th>
                <th className="py-3 px-4 font-bold w-[17%]">{t('dateTime')}</th>
                <th className="py-3 px-5 text-right font-bold w-[10%]">{t('action')}</th>
              </tr>
            </thead>

            {visibleOrders.length ? (
              <tbody className="divide-y divide-slate-100">
                {visibleOrders.map((order) => {
                  const orderItems = Array.isArray(order.items) ? order.items : []
                  const orderBoxes = orderItems.reduce((sum, item) => {
                    const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || item.minimumQuantity || item.minimum_quantity || 1)
                    const boxes = Number(item.boxes) || (unitsPerBox > 1 ? Math.floor(Number(item.quantity) / unitsPerBox) : Number(item.quantity)) || 1
                    return sum + boxes
                  }, 0)

                  return (
                    <tr className="hover:bg-slate-50/70 transition-colors text-xs" key={order.id}>
                      <td className="py-3.5 px-5">
                        <label className="flex items-center cursor-pointer">
                          <input checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                        </label>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-[11px] whitespace-nowrap">
                        {formatOrderId(order.id)}
                      </td>
                      <td className="py-3.5 px-4 min-w-0">
                        <strong className="font-semibold text-slate-800 block truncate">{order.customer}</strong>
                        <small className="text-slate-400 text-[11px] truncate">{order.area}</small>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">{orderBoxes} {orderBoxes === 1 ? (t('boxSingular') || 'Box') : (t('boxPlural') || 'Boxes')}</span>
                        <span className="text-[11px] text-slate-400 block">({orderItems.length} {orderItems.length === 1 ? (t('productSingular') || 'Product') : (t('productPlural') || 'Products')})</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateTime(order.date)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Link
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-block text-center"
                          to={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`}
                        >
                          {t('view')}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState title={t('noOrdersFound')} message={t('noOrdersFoundMessage')} />
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Pagination Controls (Hidden in mobile view, shown on tablet/desktop) */}
      {!isMobile && visibleOrders.length > 0 && (
        <div className="hidden sm:flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-5 py-3 bg-white rounded-xl border border-slate-100 shadow-2xs text-xs text-slate-500">
          <span className="text-center sm:text-left">{t('showingOrdersCount', { start: filteredOrders.length ? (page - 1) * pageSize + 1 : 0, end: Math.min(page * pageSize, filteredOrders.length), total: filteredOrders.length })}</span>
          <div className="flex items-center gap-1.5 sm:gap-1">
            <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button" className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer bg-white">‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
              <button
                className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-semibold text-xs cursor-pointer ${
                  pageNumber === page
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button" className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer bg-white">›</button>
          </div>
        </div>
      )}
    </section>
  )
}
