import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrders, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const pageSize = 8

const tabs = ['All Orders', 'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
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

  const customerOptions = useMemo(() => ['All Customers', ...new Set(orders.map((order) => order.customer).filter(Boolean))], [orders])

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
    return <section className="orders-page orders-error"><div className="orders-breadcrumb"><span>{t('supplierWorkspace')}</span><span>›</span><span>{t('orders')}</span></div><h1>{t('incomingOrders')}</h1><p className="form-message error" role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()} type="button">{t('tryAgain')}</button></section>
  }

  return (
    <section className="supplier-orders-page">
      <div className="orders-breadcrumb">
        <span>{t('supplier')}</span>
        <span>›</span>
        <span>{t('orders')}</span>
      </div>

      <div className="supplier-orders-header-row">
        <div>
          <h1>Orders</h1>
          <p>Manage and fulfill orders from your shop customers.</p>
        </div>

        <div className="supplier-orders-header-actions">
          <button className="supplier-export-button" onClick={exportOrders} type="button">Export</button>
          <div className="supplier-bulk-select-wrap">
            <select className="supplier-bulk-select" defaultValue="" disabled={!selectedIds.length || isUpdating} onChange={(event) => {
              const value = event.target.value
              if (value) applyBulkStatus(value)
              event.target.value = ''
            }}>
              <option value="">Bulk Actions</option>
              <option value="Accepted">Mark as accepted</option>
              <option value="Preparing">Mark as preparing</option>
              <option value="Out for Delivery">Mark as out for delivery</option>
              <option value="Delivered">Mark as delivered</option>
              <option value="Cancelled">Cancel orders</option>
            </select>
          </div>
        </div>
      </div>

      <div className="supplier-order-tabs" role="tablist">
        {tabs.map((tab) => (
          <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">
            <span>{tab}</span>
            {tab !== 'All Orders' && <small>({counts[tab] || 0})</small>}
          </button>
        ))}
      </div>

      <div className="supplier-filter-panel">
        <div className="supplier-filter-row">
          <label className="supplier-search-field">
            <span aria-hidden="true">⌕</span>
            <input onChange={(event) => setSearch(event.target.value)} placeholder="Search by order ID or customer name..." type="search" value={search} />
          </label>
          <label className="supplier-select-field">
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              {statusValues.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="supplier-select-field">
            <select onChange={(event) => setCustomerFilter(event.target.value)} value={customerFilter}>
              {customerOptions.map((customer) => <option key={customer} value={customer}>{customer}</option>)}
            </select>
          </label>
          <label className="supplier-select-field">
            <select onChange={(event) => setDateFilter(event.target.value)} value={dateFilter}>
              <option value="Select Date Range">Select Date Range</option>
              <option value="Today">Today</option>
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
            </select>
          </label>
          <button className="supplier-clear-button" onClick={clearFilters} type="button">Clear</button>
        </div>
      </div>

      <div className="supplier-table-wrap">
        <div className="supplier-table-header">
          <label className="supplier-checkbox-head">
            <input checked={allVisibleSelected} onChange={(event) => handleSelectAll(event.target.checked)} type="checkbox" />
          </label>
          <span>Order ID</span>
          <span>Customer (Shop)</span>
          <span>Items</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date &amp; Time</span>
          <span>Action</span>
        </div>

        {visibleOrders.length ? (
          <>
            {visibleOrders.map((order) => {
              const orderItems = Array.isArray(order.items) ? order.items : []

              return (
                <div className="supplier-table-row" key={order.id}>
                  <label className="supplier-checkbox-cell">
                    <input checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} type="checkbox" />
                  </label>
                  <div className="supplier-order-id">{formatOrderId(order.id)}</div>
                  <div className="supplier-customer-cell">
                    <div>
                      <strong>{order.customer}</strong>
                      <small>{order.area}</small>
                    </div>
                  </div>
                  <div className="supplier-items-cell">
                    <small>{orderItems.length} items</small>
                  </div>
                  <div className="supplier-amount-cell">{formatCurrency(order.amount)}</div>
                  <div className="supplier-status-cell"><StatusBadge status={order.status} /></div>
                  <div className="supplier-date-cell">{formatDateTime(order.date)}</div>
                  <div className="supplier-action-cell">
                    <Link className="supplier-view-button" to={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`}>
                      View
                    </Link>
                  </div>
                </div>
              )
            })}

            <div className="supplier-pagination">
              <span>Showing {filteredOrders.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</span>
              <div className="supplier-pagination-controls">
                <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">‹</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                  <button className={pageNumber === page ? 'active' : ''} key={pageNumber} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">›</button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="No orders found" message="Try another search or reset the filters to view more orders." />
        )}
      </div>
    </section>
  )
}
