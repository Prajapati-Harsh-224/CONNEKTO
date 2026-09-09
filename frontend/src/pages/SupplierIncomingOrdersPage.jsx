import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { listDemoOrders } from '../data/supplierOrdersDemo.js'
import { getSupplierOrders, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const pageSize = 8

const demoOrders = [
  { id: 'ORD-1024', customer: 'Shree General Store', area: 'Ahmedabad', status: 'New', amount: 2450, date: '2026-09-09T10:42:00', items: [{ name: 'Fortune Oil', color: 'amber', qty: 2 }, { name: 'Aashirvaad Atta', color: 'green', qty: 3 }, { name: 'Basmati Rice', color: 'blue', qty: 3 }] },
  { id: 'ORD-1023', customer: 'Patel Kirana', area: 'Ahmedabad', status: 'Processing', amount: 1280, date: '2026-09-09T09:15:00', items: [{ name: 'Fortune Oil', color: 'amber', qty: 2 }, { name: 'Rice', color: 'blue', qty: 2 }] },
  { id: 'ORD-1022', customer: 'Jain Provision Store', area: 'Ahmedabad', status: 'Confirmed', amount: 3120, date: '2026-09-08T18:30:00', items: [{ name: 'Wheat', color: 'green', qty: 2 }, { name: 'Sugar', color: 'purple', qty: 2 }, { name: 'Tea', color: 'red', qty: 2 }] },
  { id: 'ORD-1021', customer: 'Mehta Mart', area: 'Ahmedabad', status: 'Ready', amount: 980, date: '2026-09-08T16:12:00', items: [{ name: 'Tea', color: 'red', qty: 1 }, { name: 'Oil', color: 'amber', qty: 2 }] },
  { id: 'ORD-1020', customer: 'Shakti Stores', area: 'Ahmedabad', status: 'Pending', amount: 2200, date: '2026-09-07T19:18:00', items: [{ name: 'Rice', color: 'blue', qty: 3 }, { name: 'Flour', color: 'green', qty: 2 }] },
  { id: 'ORD-1019', customer: 'Gujarat Provision', area: 'Ahmedabad', status: 'Completed', amount: 760, date: '2026-09-06T11:24:00', items: [{ name: 'Tea', color: 'red', qty: 1 }, { name: 'Oil', color: 'amber', qty: 1 }] },
  { id: 'ORD-1018', customer: 'Patel Super Mart', area: 'Ahmedabad', status: 'Processing', amount: 3890, date: '2026-09-06T09:10:00', items: [{ name: 'Rice', color: 'blue', qty: 6 }, { name: 'Soap', color: 'rose', qty: 1 }, { name: 'Masala', color: 'purple', qty: 3 }] },
  { id: 'ORD-1017', customer: 'Shree Balaji Store', area: 'Ahmedabad', status: 'Cancelled', amount: 1540, date: '2026-09-05T17:45:00', items: [{ name: 'Rice', color: 'blue', qty: 2 }, { name: 'Flour', color: 'green', qty: 4 }] },
  { id: 'ORD-1016', customer: 'Vishwakarma Mart', area: 'Ahmedabad', status: 'New', amount: 1765, date: '2026-09-04T13:20:00', items: [{ name: 'Tea', color: 'red', qty: 2 }, { name: 'Oil', color: 'amber', qty: 1 }, { name: 'Sugar', color: 'purple', qty: 2 }] },
  { id: 'ORD-1015', customer: 'Bharat Foods', area: 'Ahmedabad', status: 'Confirmed', amount: 2440, date: '2026-09-03T08:45:00', items: [{ name: 'Rice', color: 'blue', qty: 4 }, { name: 'Oil', color: 'amber', qty: 2 }] },
  { id: 'ORD-1014', customer: 'Rajasthan Stores', area: 'Ahmedabad', status: 'Ready', amount: 1350, date: '2026-09-02T15:30:00', items: [{ name: 'Soap', color: 'rose', qty: 3 }, { name: 'Tea', color: 'red', qty: 1 }] },
  { id: 'ORD-1013', customer: 'Nirmal Traders', area: 'Ahmedabad', status: 'Completed', amount: 980, date: '2026-09-01T12:10:00', items: [{ name: 'Flour', color: 'green', qty: 2 }, { name: 'Rice', color: 'blue', qty: 2 }] },
]

const tabs = ['All Orders', 'New', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled']
const statusValues = ['All Statuses', 'New', 'Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled']

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function getInitials(value) {
  return String(value || 'S').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

export default function SupplierIncomingOrdersPage() {
  const { t } = useLocale()
  const [orders, setOrders] = useState(listDemoOrders())
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
          const nextOrders = response?.data?.orders?.length ? response.data.orders : listDemoOrders()
          setOrders(nextOrders)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setOrders(listDemoOrders())
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
    New: orders.filter((order) => order.status === 'New').length,
    Confirmed: orders.filter((order) => order.status === 'Confirmed').length,
    Processing: orders.filter((order) => order.status === 'Processing').length,
    Ready: orders.filter((order) => order.status === 'Ready').length,
    Completed: orders.filter((order) => order.status === 'Completed').length,
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
      const updated = orders.map((order) => selectedIds.includes(order.id) ? { ...order, status: nextStatus } : order)
      setOrders(updated)
      setSelectedIds([])
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
              <option value="Confirmed">Mark as confirmed</option>
              <option value="Processing">Mark as processing</option>
              <option value="Ready">Mark as ready</option>
              <option value="Completed">Mark as completed</option>
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
                  <div className="supplier-order-id">{order.id}</div>
                  <div className="supplier-customer-cell">
                    <span className="supplier-customer-avatar">{getInitials(order.customer)}</span>
                    <div>
                      <strong>{order.customer}</strong>
                      <small>{order.area}</small>
                    </div>
                  </div>
                  <div className="supplier-items-cell">
                    <div className="supplier-item-pills">
                      {orderItems.slice(0, 3).map((item, index) => {
                        const itemName = item?.name || item?.product || 'Item'
                        return (
                          <span className={`supplier-item-pill color-${item?.color || 'green'}`} key={`${order.id}-${index}`}>
                            {itemName.slice(0, 2).toUpperCase()}
                          </span>
                        )
                      })}
                    </div>
                    <small>{orderItems.length} items</small>
                  </div>
                  <div className="supplier-amount-cell">{formatCurrency(order.amount)}</div>
                  <div className="supplier-status-cell"><StatusBadge status={order.status} /></div>
                  <div className="supplier-date-cell">{formatDateTime(order.date)}</div>
                  <div className="supplier-action-cell">
                    <Link className="supplier-view-button" to={`/dashboard/supplier/orders/${encodeURIComponent(order.id)}`}>
                      View
                    </Link>
                    <button aria-label={`More actions for ${order.id}`} className="supplier-menu-button" type="button">⋮</button>
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
