import { useEffect, useMemo, useState } from 'react'
import { FiX, FiSearch } from 'react-icons/fi'
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

function CustomerDetailCard({ customer, onClose }) {
  const { t } = useLocale()
  if (!customer) return null

  const handleCall = () => {
    if (!customer.phone) return
    window.location.href = `tel:${String(customer.phone).replace(/\s+/g, '')}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 pr-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
            {getInitials(customer.name)}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 leading-tight truncate">{customer.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{customer.category}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label={t('close') || 'Close'}
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-center">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('orders')}</span>
          <strong className="text-base font-bold text-slate-900 tabular-nums">{customer.totalOrders}</strong>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('totalSpent')}</span>
          <strong className="text-base font-bold text-slate-900 tabular-nums">{formatCurrency(customer.totalSpent)}</strong>
        </div>
      </div>

      <div className="space-y-2.5 text-xs divide-y divide-slate-50">
        <div className="pt-2 flex justify-between items-center">
          <span className="text-slate-400">{t('shopOwner')}</span>
          <strong className="font-semibold text-slate-800">{customer.shopOwner}</strong>
        </div>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-slate-400">{t('phoneNumber')}</span>
          <strong className="font-semibold text-slate-800">{customer.phone || '—'}</strong>
        </div>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-slate-400">{t('area')}</span>
          <strong className="font-semibold text-slate-800">{customer.location}</strong>
        </div>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-slate-400">{t('orderDate')}</span>
          <strong className="font-semibold text-slate-800">{formatDate(customer.lastOrder)}</strong>
        </div>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-slate-400">{t('status')}</span>
          <StatusBadge status={customer.status} />
        </div>
      </div>

      <div className="pt-2">
        <button
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!customer.phone}
          onClick={handleCall}
          type="button"
        >
          {t('callCustomer') || 'Call Customer'}
        </button>
      </div>
    </div>
  )
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
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)

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
      .catch(() => {
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



  const locationOptions = ['All cities', ...new Set(customers.map((customer) => customer.location).filter(Boolean))]

  if (loading) return <LoadingState message={t('loadingCustomers')} />

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('supplierWorkspace')}</p>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">{t('customers')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('customersDescription')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">◎</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{t('totalCustomers')}</span>
            <strong className="text-base sm:text-xl font-bold text-slate-900 tabular-nums">{stats.totalCustomers}</strong>
            <small className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{t('activeThisMonth', { count: stats.activeCustomers })}</small>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">↗</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{t('orderVolume')}</span>
            <strong className="text-base sm:text-xl font-bold text-slate-900 tabular-nums">{stats.totalOrders}</strong>
            <small className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{t('acrossAllActiveStores')}</small>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">₹</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{t('averageSpend')}</span>
            <strong className="text-base sm:text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(stats.avgOrderValue)}</strong>
            <small className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{t('perCustomer')}</small>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">✓</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{t('activeCustomers')}</span>
            <strong className="text-base sm:text-xl font-bold text-slate-900 tabular-nums">{stats.activeCustomers}</strong>
            <small className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{t('currentlyActive')}</small>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              aria-label={t('searchCustomers')}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchCustomers')}
              type="text"
              value={search}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer truncate max-w-[130px]"
            >
              <option value="All status">{t('allStatus')}</option>
              <option value="Active">{t('active')}</option>
              <option value="Inactive">{t('inactive')}</option>
            </select>

            <select
              onChange={(event) => setLocationFilter(event.target.value)}
              value={locationFilter}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer truncate max-w-[130px]"
            >
              {locationOptions.map((location) => (
                <option key={location} value={location}>{location === 'All cities' ? t('allCities') : location}</option>
              ))}
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {visibleCustomers.length ? (
            <>
              <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1.1fr_0.6fr_0.9fr] items-center gap-2 md:gap-3 px-3.5 sm:px-4 md:px-5 py-3 border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{t('customerShop')}</span>
                <span>{t('contact')}</span>
                <span>{t('area')}</span>
                <span>{t('orders')}</span>
                <span>{t('totalSpent')}</span>
              </div>

              <div className="divide-y divide-slate-50">
                  {visibleCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`flex flex-col md:grid md:grid-cols-[1.3fr_1.3fr_1.1fr_0.6fr_0.9fr] items-start md:items-center gap-2 md:gap-3 px-3.5 sm:px-4 md:px-5 py-3.5 transition-colors cursor-pointer text-xs ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50/70'
                      }`}
                      onClick={() => {
                        setSelectedCustomerId(customer.id)
                        setIsMobileDetailOpen(true)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedCustomerId(customer.id)
                          setIsMobileDetailOpen(true)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="min-w-0">
                        <strong className="font-bold text-slate-800 block truncate" title={customer.name}>{customer.name}</strong>
                        <small className="text-slate-400 text-[11px] block truncate">{customer.category}</small>
                      </div>

                      <div className="min-w-0">
                        <strong className="font-medium text-slate-700 block truncate" title={customer.shopOwner}>{customer.shopOwner}</strong>
                        <small className="text-slate-400 text-[11px] block truncate">{customer.phone || t('noPhoneAvailable')}</small>
                      </div>

                      <div className="text-slate-600 min-w-0 truncate" title={customer.location}>{customer.location}</div>
                      <div className="font-bold text-slate-800 tabular-nums min-w-0">{customer.totalOrders}</div>
                      <div className="font-bold text-slate-900 tabular-nums min-w-0 whitespace-nowrap">{formatCurrency(customer.totalSpent)}</div>
                    </div>
                  ))}
                </div>
            </div>
          </div>

              <div className="hidden sm:flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  {t('showingCustomers', {
                    start: filteredCustomers.length ? (currentPage - 1) * pageSize + 1 : 0,
                    end: Math.min(currentPage * pageSize, filteredCustomers.length),
                    total: filteredCustomers.length,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage((pageNumber) => Math.max(1, pageNumber - 1))}
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      type="button"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs cursor-pointer ${
                        pageNumber === currentPage
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((pageNumber) => Math.min(totalPages, pageNumber + 1))}
                    type="button"
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState title={t('noCustomerData')} message={t('tryDifferentSearch')} />
          )}
        </div>

        {/* Desktop Sidebar Card */}
        {selectedCustomer && (
          <aside className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sticky top-20">
            <CustomerDetailCard
              customer={selectedCustomer}
            />
          </aside>
        )}
      </div>

      {/* Mobile Modal Card (opens like Edit Product Card with top right cross) */}
      {isMobileDetailOpen && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomerDetailCard
              customer={selectedCustomer}
              onClose={() => setIsMobileDetailOpen(false)}
            />
          </div>
        </div>
      )}
    </section>
  )
}
