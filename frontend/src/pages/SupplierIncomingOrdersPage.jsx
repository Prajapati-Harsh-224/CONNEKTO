import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrders, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const pageSize = 8

const statusValues = ['All Statuses', 'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

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

  useEffect(() => {
    let isMounted = true
    getSupplierOrders()
      .then((response) => {
        if (isMounted) {
          setOrders((response?.data?.orders || []).map(normalizeOrder))
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setOrders([])
          setError(requestError.message)
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
  const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id))

  function handleSelectAll(checked) {
    setSelectedIds(checked ? visibleOrders.map((order) => order.id) : [])
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
    <section className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>{t('supplier')}</span>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-slate-800">{t('orders')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">{t('orders')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('manageOrdersProductsCustomers')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            onClick={exportOrders}
            type="button"
          >
            {t('export')}
          </button>
          <div>
            <select
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200" role="tablist">
        {tabs.map((tab) => (
          <button
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
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

      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] w-full sm:w-auto">
            <span className="absolute left-3 top-2.5 text-slate-400" aria-hidden="true">⌕</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchOrdersByIdOrCustomer')}
              type="search"
              value={search}
              className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <select
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer"
            >
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <select
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer"
            >
              {translatedCustomerOptions.map((customer) => <option key={customer.value} value={customer.value}>{customer.label}</option>)}
            </select>
            <select
              onChange={(event) => setDateFilter(event.target.value)}
              value={dateFilter}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer"
            >
              <option value="Select Date Range">{t('selectDateRange')}</option>
              <option value="Today">{t('today')}</option>
              <option value="Last 7 days">{t('last7Days')}</option>
              <option value="Last 30 days">{t('last30Days')}</option>
            </select>
            <button
              onClick={clearFilters}
              type="button"
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
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
                        {orderItems.length} {orderItems.length === 1 ? (t('itemCount') || 'item') : (t('itemsCount') || 'items')}
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

        {visibleOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
            <span>{t('showingOrdersCount', { start: filteredOrders.length ? (page - 1) * pageSize + 1 : 0, end: Math.min(page * pageSize, filteredOrders.length), total: filteredOrders.length })}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button" className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer">‹</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                <button
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs cursor-pointer ${
                    pageNumber === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button" className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer">›</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
