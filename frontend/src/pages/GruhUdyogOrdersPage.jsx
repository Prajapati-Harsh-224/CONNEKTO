import { useEffect, useMemo, useState } from 'react'
import {
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiCalendar,
  FiPackage,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCheck,
  FiMoreHorizontal,
  FiX
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogOrders, updateGruhUdyogOrderStatus } from '../services/gruhUdyogService.js'

function formatOrderId(orderId = '') {
  const value = String(orderId || '').trim()
  if (!value) return '—'
  if (value.startsWith('ORD-')) return value
  const hexMatch = value.match(/[A-Fa-f0-9]{4,8}/)
  if (hexMatch) return `ORD-${hexMatch[0].toUpperCase()}`
  const sanitized = value.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase()
  return sanitized ? `ORD-${sanitized}` : value
}

function formatOrderDate(dateString) {
  const date = dateString ? new Date(dateString) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPlacedDateTime(dateString) {
  const date = dateString ? new Date(dateString) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatCurrency(amount) {
  const num = Number(amount || 0)
  if (num % 1 === 0) {
    return num.toLocaleString('en-IN')
  }
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
}

function StatusPill({ status }) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]">
        Pending
      </span>
    )
  }
  if (normalized === 'preparing') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#edf5fd] text-[#2563eb] border border-[#d2e5fa]">
        Preparing
      </span>
    )
  }
  if (normalized === 'confirmed' || normalized === 'accepted') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]">
        Confirmed
      </span>
    )
  }
  if (normalized === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fdf2f2] text-[#e02424] border border-[#fbd5d5]">
        Cancelled
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]">
      Delivered
    </span>
  )
}

export default function GruhUdyogOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [customerFilter, setCustomerFilter] = useState('All customers')
  const [dateFilter, setDateFilter] = useState('Select date range')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const pageSize = 8

  useEffect(() => {
    let isMounted = true
    getGruhUdyogOrders()
      .then((response) => {
        if (!isMounted) return
        const loadedOrders = response?.data?.orders || []
        setOrders(loadedOrders)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Dynamic unique customer list
  const uniqueCustomers = useMemo(() => {
    const list = orders.map((o) => o.customer || o.shopName || o.shopOwner || '').filter(Boolean)
    return Array.from(new Set(list))
  }, [orders])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = order.customer || order.shopName || order.shopOwner || ''
      const orderIdDisplay = formatOrderId(order.id)

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesId = order.id.toLowerCase().includes(q) || orderIdDisplay.toLowerCase().includes(q)
        const matchesCustomer = customerName.toLowerCase().includes(q)
        if (!matchesId && !matchesCustomer) return false
      }

      // Status filter
      if (statusFilter !== 'All status') {
        const orderStatus = order.status || 'Pending'
        if (statusFilter === 'Confirmed' || statusFilter === 'Accepted') {
          if (orderStatus !== 'Confirmed' && orderStatus !== 'Accepted') return false
        } else if (orderStatus !== statusFilter) {
          return false
        }
      }

      // Customer filter
      if (customerFilter !== 'All customers') {
        if (customerName !== customerFilter) return false
      }

      // Date range filter
      if (dateFilter !== 'Select date range' && order.createdAt) {
        const orderDate = new Date(order.createdAt)
        const now = new Date()
        if (Number.isNaN(orderDate.getTime())) return true
        if (dateFilter === 'Today') {
          if (orderDate.toDateString() !== now.toDateString()) return false
        } else if (dateFilter === 'Last 7 days') {
          const diffMs = now.getTime() - orderDate.getTime()
          if (diffMs > 7 * 24 * 60 * 60 * 1000 || diffMs < -86400000) return false
        } else if (dateFilter === 'Last 30 days') {
          const diffMs = now.getTime() - orderDate.getTime()
          if (diffMs > 30 * 24 * 60 * 60 * 1000 || diffMs < -86400000) return false
        }
      }

      return true
    })
  }, [orders, search, statusFilter, customerFilter, dateFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const visibleOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, page, pageSize])

  // Derive selected order without triggering cascading renders in effect
  const selectedOrder = useMemo(() => {
    if (!visibleOrders.length) return null
    if (selectedOrderId) {
      const match = visibleOrders.find((o) => o.id === selectedOrderId)
      if (match) return match
      const fromAll = orders.find((o) => o.id === selectedOrderId)
      if (fromAll) return fromAll
    }
    return visibleOrders[0]
  }, [orders, selectedOrderId, visibleOrders])

  function clearFilters() {
    setSearch('')
    setStatusFilter('All status')
    setCustomerFilter('All customers')
    setDateFilter('Select date range')
    setPage(1)
  }

  async function updateStatus(orderId, nextStatus) {
    if (!nextStatus || isUpdating) return
    setIsUpdating(true)
    setShowMoreMenu(false)
    try {
      const response = await updateGruhUdyogOrderStatus(orderId, nextStatus)
      const updated = response?.data?.order
      if (updated) {
        setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, ...updated } : o)))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function advanceToPreparing(orderId) {
    if (isUpdating) return
    setIsUpdating(true)
    setShowMoreMenu(false)
    try {
      await updateGruhUdyogOrderStatus(orderId, 'Accepted')
      const response = await updateGruhUdyogOrderStatus(orderId, 'Preparing')
      const updated = response?.data?.order
      if (updated) {
        setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, ...updated } : o)))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingOrders') || 'Loading orders...'} />

  return (
    <section className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header: Breadcrumb & Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
          <span>Gruh Udyog</span>
          <span className="text-slate-300">›</span>
          <span className="text-slate-600">Orders</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Orders</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage and fulfill orders from your customers.</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders (Order ID, customer name)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
          >
            <option value="All status">All status</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Accepted">Confirmed</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Customer Dropdown */}
        <div className="relative shrink-0">
          <select
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
          >
            <option value="All customers">All customers</option>
            {uniqueCustomers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Date Range Dropdown */}
        <div className="relative shrink-0">
          <FiCalendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
          >
            <option value="Select date range">Select date range</option>
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
          <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={clearFilters}
          className="shrink-0 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Orders Table Card */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleOrders.length > 0 ? (
                  visibleOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id
                    const itemsCount = (order.items || []).length || 1
                    const displayAmount = Number(order.amount || order.subtotal || 0)
                    const customerName = order.customer || order.shopName || order.shopOwner || 'Retail Shop'
                    const locationArea = order.area || order.shopAddress || ''

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-900 whitespace-nowrap">
                          {formatOrderId(order.id)}
                        </td>
                        <td className="py-3.5 px-4 min-w-[120px]">
                          <span className="block text-xs font-semibold text-slate-900 leading-tight">
                            {customerName}
                          </span>
                          {locationArea && (
                            <span className="block text-[11px] text-slate-400 mt-0.5 leading-tight">
                              {locationArea}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-900 whitespace-nowrap">
                          ₹{formatCurrency(displayAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatOrderDate(order.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusPill status={order.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <FiChevronRight
                            className={`w-4 h-4 inline-block transition-transform ${
                              isSelected ? 'text-[#1b6442] translate-x-0.5' : 'text-slate-400'
                            }`}
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-medium">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filteredOrders.length > 0 ? (page - 1) * pageSize + 1 : 0}-
              {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                    page === p ? 'bg-[#1b6442] text-white shadow-2xs' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Order Details Panel */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 lg:sticky lg:top-20">
          {selectedOrder ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf5ef] text-[#1b6442] flex items-center justify-center shrink-0">
                    <FiPackage className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">Order Details</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      View and manage order information
                    </p>
                  </div>
                </div>
                <StatusPill status={selectedOrder.status} />
              </div>

              {/* Order ID & Timestamp */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formatOrderId(selectedOrder.id)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {formatPlacedDateTime(selectedOrder.createdAt)}
                </p>
              </div>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100/90 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <FiUser className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Customer
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight truncate">
                      {selectedOrder.customer || selectedOrder.shopName || selectedOrder.shopOwner || 'Retail Shop'}
                    </strong>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {selectedOrder.shopAddress
                          ? `${selectedOrder.shopAddress}${selectedOrder.area ? `, ${selectedOrder.area}` : ''}`
                          : selectedOrder.area || 'Gujarat, India'}
                      </span>
                    </div>
                    {selectedOrder.shopOwnerPhone && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedOrder.shopOwnerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.shopOwnerPhone && (
                  <a
                    href={`tel:${selectedOrder.shopOwnerPhone}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <FiPhone className="w-3.5 h-3.5 text-[#1b6442]" />
                    <span>Call customer</span>
                  </a>
                )}
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2.5">
                  <FiPackage className="w-3.5 h-3.5 text-slate-500" />
                  <span>Items ({selectedOrder.items?.length || 1})</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {(selectedOrder.items || []).length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={item.productId || idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center shrink-0 text-sm shadow-2xs">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span>🥫</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.name || item.productNameSnapshot || 'Handmade Product'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.unitsPerBoxSnapshot && item.unitsPerBoxSnapshot > 1
                                ? `${item.unitsPerBoxSnapshot} units/box`
                                : 'Handmade'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-900">
                            ₹{formatCurrency(item.lineTotal || (item.quantity * (item.unitPriceSnapshot || item.unitPrice || 0)))}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 text-xs text-slate-500">
                      Standard package order · ₹{formatCurrency(selectedOrder.amount || selectedOrder.subtotal || 0)}
                    </div>
                  )}
                </div>

                {/* Subtotal / Delivery / Total Breakdown */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">
                      ₹{formatCurrency(selectedOrder.amount || selectedOrder.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-slate-800">₹0</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Total Amount</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{formatCurrency(selectedOrder.amount || selectedOrder.subtotal || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-3 border-t border-slate-100 relative">
                {selectedOrder.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(selectedOrder.id, 'Accepted')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-900/10 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <FiCheck className="w-4 h-4 stroke-[3]" />
                      <span>Accept Order</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => advanceToPreparing(selectedOrder.id)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>Mark as Preparing</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMoreMenu((prev) => !prev)}
                        className="py-2.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        aria-label="More options"
                      >
                        <FiMoreHorizontal className="w-4 h-4" />
                        <span>More</span>
                      </button>

                      {showMoreMenu && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                          <button
                            type="button"
                            onClick={() => updateStatus(selectedOrder.id, 'Cancelled')}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'Accepted' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(selectedOrder.id, 'Preparing')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                    >
                      <FiCheck className="w-4 h-4 stroke-[3]" />
                      <span>Mark as Preparing</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(selectedOrder.id, 'Cancelled')}
                      className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'Preparing' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(selectedOrder.id, 'Out for Delivery')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                    >
                      <FiCheck className="w-4 h-4 stroke-[3]" />
                      <span>Mark Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus(selectedOrder.id, 'Cancelled')}
                      className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'Out for Delivery' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => updateStatus(selectedOrder.id, 'Delivered')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    <FiCheck className="w-4 h-4 stroke-[3]" />
                    <span>Mark as Delivered</span>
                  </button>
                )}

                {selectedOrder.status === 'Delivered' && (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1b6442] text-xs font-bold flex items-center justify-center gap-1.5">
                    <FiCheck className="w-4 h-4 stroke-[3]" />
                    <span>Order Successfully Delivered</span>
                  </div>
                )}

                {selectedOrder.status === 'Cancelled' && (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5">
                    <FiX className="w-4 h-4 stroke-[3]" />
                    <span>Order Cancelled</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              Select an order to view its details.
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

