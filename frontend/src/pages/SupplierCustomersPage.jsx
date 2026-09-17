import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrders } from '../services/supplierOrderService.js'

const pageSize = 8

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(value) {
  return String(value || 'S').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

export default function SupplierCustomersPage() {
  const { t } = useLocale()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [locationFilter, setLocationFilter] = useState('All cities')
  const [page, setPage] = useState(1)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    getSupplierOrders()
      .then((res) => {
        if (!isMounted) return
        const orders = res.data?.orders || []
        const customerMap = {}

        orders.forEach((order) => {
          const id = order.shopOwnerId || order.shopName || order.shopOwnerName
          if (!id) return
          if (!customerMap[id]) {
            customerMap[id] = {
              id,
              name: order.shopName || order.shopOwnerName || 'Retail Shop',
              shopOwner: order.shopOwnerName || 'Shop Owner',
              phone: order.shopOwnerPhone || '',
              location: order.serviceArea || 'Ahmedabad',
              totalOrders: 0,
              totalSpent: 0,
              lastOrder: order.createdAt,
              status: 'Active',
              category: 'Retail Store',
              orders: []
            }
          }
          customerMap[id].totalOrders += 1
          customerMap[id].totalSpent += Number(order.subtotal || 0)
          customerMap[id].orders.push(order)
          if (new Date(order.createdAt) > new Date(customerMap[id].lastOrder)) {
            customerMap[id].lastOrder = order.createdAt
          }
        })

        const list = Object.values(customerMap)
        setCustomers(list)
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id)
        }
      })
      .catch((err) => {
        console.error('Failed to load supplier customers:', err)
        if (isMounted) setCustomers([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [])


  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesSearch = !query || `${customer.name} ${customer.location} ${customer.shopOwner} ${customer.category}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All status' || customer.status === statusFilter
      const matchesLocation = locationFilter === 'All cities' || customer.location === locationFilter
      return matchesSearch && matchesStatus && matchesLocation
    })
  }, [customers, locationFilter, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedCustomerId) || visibleCustomers[0] || null

  const stats = useMemo(() => {
    const totalSpend = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0)
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((customer) => customer.status === 'Active').length,
      avgOrderValue: Math.round(totalSpend / Math.max(customers.length, 1)),
      totalOrders: customers.reduce((sum, customer) => sum + Number(customer.totalOrders || 0), 0),
    }
  }, [customers])

  function callCustomer(phone) {
    if (!phone) return
    window.location.href = `tel:${String(phone).replace(/\s+/g, '')}`
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('All status')
    setLocationFilter('All cities')
    setPage(1)
  }

  function exportCustomers() {
    const rows = [
      ['Customer name', 'Contact', 'Location', 'Orders', 'Total spent', 'Last order', 'Status'].join(','),
      ...filteredCustomers.map((customer) => [customer.name, customer.phone || customer.shopOwnerPhone || '', customer.location, customer.totalOrders, customer.totalSpent, formatDate(customer.lastOrder), customer.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'supplier-customers.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const locationOptions = ['All cities', ...new Set(customers.map((customer) => customer.location).filter(Boolean))]

  if (loading) return <LoadingState message="Loading customers..." />

  return (
    <section className="supplier-customers-page">
      <div className="orders-breadcrumb">
        <span>{t('supplier')}</span>
        <span>›</span>
        <span>{t('customers')}</span>
      </div>

      <div className="supplier-orders-header-row">
        <div>
          <p className="supplier-detail-eyebrow">Supplier workspace</p>
          <h1>{t('customers')}</h1>
          <p>{t('customersDescription')}</p>
        </div>

        <div className="supplier-orders-header-actions">
          <button className="so-btn-outline" type="button" onClick={exportCustomers} disabled={!filteredCustomers.length}>
            {t('exportCSV')}
          </button>
        </div>
      </div>

      <div className="customer-summary-grid">
        <div className="metric-card customer-stat-card">
          <div className="metric-card-icon">◎</div>
          <div className="metric-card-content">
            <span>Total customers</span>
            <strong>{stats.totalCustomers}</strong>
            <small>{stats.activeCustomers} active this month</small>
          </div>
        </div>
        <div className="metric-card customer-stat-card">
          <div className="metric-card-icon">↗</div>
          <div className="metric-card-content">
            <span>Order volume</span>
            <strong>{stats.totalOrders}</strong>
            <small>Across all active stores</small>
          </div>
        </div>
        <div className="metric-card customer-stat-card">
          <div className="metric-card-icon">₹</div>
          <div className="metric-card-content">
            <span>Average spend</span>
            <strong>{formatCurrency(stats.avgOrderValue)}</strong>
            <small>Per customer</small>
          </div>
        </div>
        <div className="metric-card customer-stat-card">
          <div className="metric-card-icon">✓</div>
          <div className="metric-card-content">
            <span>Active customers</span>
            <strong>{stats.activeCustomers}</strong>
            <small>Currently active</small>
          </div>
        </div>
      </div>

      <div className="supplier-filter-panel">
        <div className="supplier-filter-row">
          <label className="supplier-search-field">
            <span aria-hidden="true">⌕</span>
            <input aria-label={t('searchCustomers')} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchCustomers')} type="search" value={search} />
          </label>

          <label className="supplier-select-field">
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="All status">All status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label className="supplier-select-field">
            <select onChange={(event) => setLocationFilter(event.target.value)} value={locationFilter}>
              {locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}
            </select>
          </label>

          <button className="supplier-clear-button" onClick={clearFilters} type="button">Clear</button>
        </div>
      </div>

      <div className="supplier-customer-layout">
        <div className="supplier-table-wrap">
          <div className="supplier-table-header">
            <span>Customer</span>
            <span>Contact</span>
            <span>Location</span>
            <span>Orders</span>
            <span>Total spent</span>
          </div>

          {visibleCustomers.length ? (
            <>
              {visibleCustomers.map((customer) => (
                <div
                  className={`supplier-table-row ${selectedCustomer?.id === customer.id ? 'is-selected' : ''}`}
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedCustomerId(customer.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="supplier-customer-cell">
                    <div className="supplier-customer-info">
                      <strong>{customer.name}</strong>
                      <small>{customer.category}</small>
                    </div>
                  </div>

                  <div className="supplier-customer-contact">
                    <strong>{customer.shopOwner}</strong>
                    <small>{customer.phone || 'No phone available'}</small>
                  </div>

                  <div className="supplier-customer-location">{customer.location}</div>
                  <div className="supplier-amount-cell">{customer.totalOrders}</div>
                  <div className="supplier-amount-cell">{formatCurrency(customer.totalSpent)}</div>
                </div>
              ))}

              <div className="supplier-pagination">
                <span>Showing {filteredCustomers.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers</span>
                <div className="supplier-pagination-controls">
                  <button disabled={currentPage === 1} onClick={() => setPage((pageNumber) => Math.max(1, pageNumber - 1))} type="button">‹</button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                    <button className={pageNumber === currentPage ? 'active' : ''} key={pageNumber} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setPage((pageNumber) => Math.min(totalPages, pageNumber + 1))} type="button">›</button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState title={t('noCustomerData')} message={t('tryDifferentSearch')} />
          )}
        </div>

        {selectedCustomer && (
          <aside className="customer-detail-card">
            <div className="customer-detail-header">
              <span className={`supplier-customer-avatar color-${selectedCustomer.color || 'green'}`}>{getInitials(selectedCustomer.name)}</span>
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>{selectedCustomer.category}</p>
              </div>
            </div>

            <div className="customer-detail-metrics">
              <div>
                <span>Orders</span>
                <strong>{selectedCustomer.totalOrders}</strong>
              </div>
              <div>
                <span>Spend</span>
                <strong>{formatCurrency(selectedCustomer.totalSpent)}</strong>
              </div>
            </div>

            <div className="customer-detail-list">
              <div>
                <label>Owner</label>
                <strong>{selectedCustomer.shopOwner}</strong>
              </div>
              <div>
                <label>Phone</label>
                <strong>{selectedCustomer.phone || '—'}</strong>
              </div>
              <div>
                <label>Location</label>
                <strong>{selectedCustomer.location}</strong>
              </div>
              <div>
                <label>Last order</label>
                <strong>{formatDate(selectedCustomer.lastOrder)}</strong>
              </div>
              <div>
                <label>Status</label>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>

            <div className="customer-detail-actions">
              <button className="supplier-view-button" disabled={!selectedCustomer.phone} onClick={() => callCustomer(selectedCustomer.phone)} type="button">Call customer</button>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
