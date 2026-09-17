import { useEffect, useMemo, useState } from 'react'
import {
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiMapPin,
  FiShoppingCart,
  FiCalendar,
  FiPhone,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiGlobe,
  FiAward,
  FiMoreVertical,
  FiStar,
  FiPackage,
  FiCheckCircle,
  FiX
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import { getGruhUdyogCustomers } from '../services/gruhUdyogService.js'

const pageSize = 8

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Pastel palette for avatar letters
const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
]

function getAvatarColor(str) {
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) {
    hash = (hash + str.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash] || AVATAR_COLORS[0]
}

export default function GruhUdyogCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters & selection
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('All cities')
  const [selectedStatus, setSelectedStatus] = useState('All status')
  const [page, setPage] = useState(1)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  // Details panel tab: 'overview' | 'orders' | 'notes'
  const [activeTab, setActiveTab] = useState('overview')
  const [customerNotes, setCustomerNotes] = useState({})
  const [noteInput, setNoteInput] = useState('')
  const [isNoteSuccess, setIsNoteSuccess] = useState(false)

  // Message modal
  const [messageModalCustomer, setMessageModalCustomer] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)

  useEffect(() => {
    let isMounted = true

    getGruhUdyogCustomers()
      .then((res) => {
        if (!isMounted) return
        const list = res?.data?.customers || []
        setCustomers(list)
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id)
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load customers.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Cities extracted from real data
  const cities = useMemo(() => {
    const set = new Set()
    customers.forEach((c) => {
      if (c.city) set.add(c.city)
      if (c.area) set.add(c.area)
    })
    return ['All cities', ...Array.from(set)]
  }, [customers])

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      const matchSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.shopOwner || '').toLowerCase().includes(q) ||
        (c.area || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)

      const matchCity =
        selectedCity === 'All cities' ||
        c.city === selectedCity ||
        c.area === selectedCity ||
        (c.location || '').includes(selectedCity)

      const matchStatus =
        selectedStatus === 'All status' ||
        (selectedStatus === 'Active' && c.status === 'Active') ||
        (selectedStatus === 'Inactive' && c.status === 'Inactive')

      return matchSearch && matchCity && matchStatus
    })
  }, [customers, search, selectedCity, selectedStatus])

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return (
      filteredCustomers.find((c) => c.id === selectedCustomerId) ||
      customers.find((c) => c.id === selectedCustomerId) ||
      filteredCustomers[0] ||
      null
    )
  }, [filteredCustomers, customers, selectedCustomerId])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCustomers.slice(start, start + pageSize)
  }, [filteredCustomers, currentPage])

  function handleClearFilters() {
    setSearch('')
    setSelectedCity('All cities')
    setSelectedStatus('All status')
    setPage(1)
  }

  function handleSaveNote(e) {
    e.preventDefault()
    if (!noteInput.trim() || !selectedCustomer) return
    const prev = customerNotes[selectedCustomer.id] || []
    setCustomerNotes({
      ...customerNotes,
      [selectedCustomer.id]: [
        {
          id: Date.now(),
          text: noteInput.trim(),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        },
        ...prev
      ]
    })
    setNoteInput('')
    setIsNoteSuccess(true)
    setTimeout(() => setIsNoteSuccess(false), 2500)
  }

  function openDirections(customer) {
    if (!customer) return
    const query = encodeURIComponent(`${customer.name}, ${customer.address || customer.location || 'Ahmedabad'}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  function openCall(customer) {
    if (!customer?.phone) return
    window.location.href = `tel:${customer.phone.replace(/\s+/g, '')}`
  }

  function openMessageModal(customer) {
    setMessageModalCustomer(customer)
    setMessageText(`Hello ${customer.shopOwner || customer.name}, thank you for your order with our Gruh Udyog!`)
    setMessageSent(false)
  }

  if (isLoading) return <LoadingState message="Loading customers..." />

  return (
    <section className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header Row with Breadcrumbs, Title, Subtitle, and Hero Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <span>Gruh Udyog</span>
            <span className="text-slate-300">›</span>
            <span className="text-slate-600">Customers</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your valued partners who support your handmade products.
          </p>
        </div>

        {/* Hero Decorative Banner: Small Businesses Stronger Together */}
        <div className="hidden sm:flex items-center gap-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border border-emerald-100/90 rounded-2xl px-5 py-2.5 shadow-2xs">
          <div>
            <p className="font-serif italic font-bold text-[#1b6442] text-xs leading-tight">
              Small Businesses
            </p>
            <p className="font-serif italic font-bold text-emerald-950 text-xs leading-tight flex items-center gap-1">
              <span>Stronger Together</span>
              <span className="not-italic text-emerald-600 text-xs">♡</span>
            </p>
          </div>

          {/* SVG Illustration representing shop partners working together */}
          <div className="flex items-center gap-2 pl-2 border-l border-emerald-200/60">
            <svg
              className="w-16 h-10 text-emerald-700/80"
              viewBox="0 0 100 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Partner 1 */}
              <circle cx="28" cy="20" r="10" stroke="currentColor" strokeWidth="2.5" fill="#eaf5ef" />
              <path d="M12 48C12 37 19 32 28 32C37 32 44 37 44 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Partner 2 (Center) */}
              <circle cx="50" cy="16" r="11" stroke="#166534" strokeWidth="2.5" fill="#d8ecdf" />
              <path d="M33 48C33 35 41 29 50 29C59 29 67 35 67 48" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
              {/* Partner 3 */}
              <circle cx="72" cy="20" r="10" stroke="currentColor" strokeWidth="2.5" fill="#eaf5ef" />
              <path d="M56 48C56 37 63 32 72 32C81 32 88 37 88 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="text-[10px] font-semibold text-emerald-800 leading-tight">
              <span className="block">Shops</span>
              <span className="block">Support</span>
              <span className="block">Communities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name, shop name, city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* City, Status Dropdowns & Clear button */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* City Dropdown */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value)
                  setPage(1)
                }}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setPage(1)
                }}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
              >
                <option value="All status">All status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.1fr] gap-5 items-start">
        {/* LEFT COLUMN: Customer List */}
        <div className="space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">All Customers</h2>
              <p className="text-[11px] text-slate-400">Manage your customers and build long-term relationships.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
            </span>
          </div>

          {/* Customer Cards List */}
          {visibleCustomers.length > 0 ? (
            <div className="space-y-2.5">
              {visibleCustomers.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id
                const avatarStyle = getAvatarColor(customer.name)
                const initial = (customer.name || 'S').slice(0, 1).toUpperCase()
                const isActive = customer.status === 'Active'

                return (
                  <article
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer bg-white flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#1b6442] shadow-sm ring-1 ring-[#1b6442]/30 bg-emerald-50/20'
                        : 'border-slate-100 shadow-xs hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Left: Avatar Initial & Shop Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar initial badge */}
                      <div
                        className={`w-10 h-10 rounded-xl ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}
                      >
                        {initial}
                      </div>

                      {/* Shop Name & Owner */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
                          {customer.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{customer.shopOwner}</p>
                      </div>
                    </div>

                    {/* Middle: Location info */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 min-w-[120px]">
                      <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="leading-tight">
                        <span className="font-medium text-slate-800 block text-[11px]">{customer.area || 'Maninagar'}</span>
                        <span className="text-slate-400 text-[10px]">{customer.city || 'Ahmedabad'}</span>
                      </div>
                    </div>

                    {/* Middle-Right: Orders & Spend */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 min-w-[110px]">
                      <FiShoppingCart className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="leading-tight">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                        </span>
                        <span className="text-slate-500 text-[10px]">{formatCurrency(customer.totalSpent)}</span>
                      </div>
                    </div>

                    {/* Last Order Date */}
                    <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 min-w-[105px]">
                      <FiCalendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="leading-tight">
                        <span className="text-[10px] text-slate-400 block">Last order</span>
                        <span className="font-medium text-slate-700 text-[11px]">{formatDate(customer.lastOrder)}</span>
                      </div>
                    </div>

                    {/* Right: Status badge & Chevron */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]'
                            : 'bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]'
                        }`}
                      >
                        {customer.status || 'Active'}
                      </span>
                      <FiChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b6442] flex items-center justify-center mx-auto text-xl mb-3">
                <FiUser className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No customers found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || selectedCity !== 'All cities' || selectedStatus !== 'All status'
                  ? 'Try adjusting your search query or filters to see more results.'
                  : 'Retailers who place orders with your Gruh Udyog will automatically show up here.'}
              </p>
              {(search || selectedCity !== 'All cities' || selectedStatus !== 'All status') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination Footer */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between pt-3 px-1 text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredCustomers.length)} of{' '}
                {filteredCustomers.length} customers
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === p
                        ? 'bg-[#1b6442] text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Customer Details Panel */}
        <aside className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4 lg:sticky lg:top-6">
          {selectedCustomer ? (
            <>
              {/* Panel Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl ${getAvatarColor(selectedCustomer.name).bg} ${getAvatarColor(selectedCustomer.name).text} flex items-center justify-center font-bold text-base shrink-0 shadow-2xs`}
                  >
                    {(selectedCustomer.name || 'S').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedCustomer.shopOwner}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedCustomer.status === 'Active'
                        ? 'bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]'
                        : 'bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]'
                    }`}
                  >
                    {selectedCustomer.status || 'Active'}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="More options"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs: Overview | Order History | Notes */}
              <div className="flex items-center gap-4 border-b border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-[#1b6442] text-[#1b6442]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-[#1b6442] text-[#1b6442]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Order History ({selectedCustomer.orders?.length || selectedCustomer.totalOrders || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-[#1b6442] text-[#1b6442]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Notes {(customerNotes[selectedCustomer.id]?.length || 0) > 0 && `(${customerNotes[selectedCustomer.id].length})`}
                </button>
              </div>

              {/* TAB CONTENT: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Action Buttons: Call | Message | Directions */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openCall(selectedCustomer)}
                      disabled={!selectedCustomer.phone}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FiPhone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openMessageModal(selectedCustomer)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FiMessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDirections(selectedCustomer)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FiSend className="w-3.5 h-3.5 text-slate-500" />
                      <span>Directions</span>
                    </button>
                  </div>

                  {/* Customer Information List */}
                  <div className="space-y-3 text-xs pt-1">
                    <div className="flex items-start gap-2.5">
                      <FiUser className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">Shop Owner</span>
                        <strong className="text-slate-800 font-semibold mt-0.5 block">{selectedCustomer.shopOwner}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <FiPhone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">Phone</span>
                        <strong className="text-slate-800 font-semibold mt-0.5 block">
                          {selectedCustomer.phone || 'No phone provided'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <FiMapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">Address</span>
                        <strong className="text-slate-800 font-semibold mt-0.5 block">
                          {selectedCustomer.address || `${selectedCustomer.area}, Ahmedabad`}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <FiGlobe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">City</span>
                        <strong className="text-slate-800 font-semibold mt-0.5 block">
                          {selectedCustomer.city || 'Ahmedabad'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <FiCalendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-none">Customer Since</span>
                        <strong className="text-slate-800 font-semibold mt-0.5 block">
                          {formatDate(selectedCustomer.customerSince)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Valued Customer Badge Card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-[#eaf5ef] text-[#1b6442] flex items-center justify-center shrink-0">
                      <FiAward className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-emerald-950 leading-tight">A valued customer</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Thank you for being a part of our journey!</p>
                    </div>
                  </div>

                  {/* 4 Stats Metric Tiles (2x2 Grid) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Tile 1: Total Orders */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <FiShoppingCart className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight">Total Orders</span>
                        <strong className="text-sm font-black text-slate-900 mt-0.5 block">
                          {selectedCustomer.totalOrders}
                        </strong>
                      </div>
                    </div>

                    {/* Tile 2: Total Spent */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold">₹</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight">Total Spent</span>
                        <strong className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                          {formatCurrency(selectedCustomer.totalSpent)}
                        </strong>
                      </div>
                    </div>

                    {/* Tile 3: Last Order */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <FiCalendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight">Last Order</span>
                        <strong className="text-xs font-bold text-slate-800 mt-0.5 block">
                          {formatDate(selectedCustomer.lastOrder)}
                        </strong>
                      </div>
                    </div>

                    {/* Tile 4: Customer Since */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <FiStar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight">Customer Since</span>
                        <strong className="text-xs font-bold text-slate-800 mt-0.5 block">
                          {formatDate(selectedCustomer.customerSince)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <div className="space-y-3 pt-1">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {selectedCustomer.orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs space-y-1.5 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">{order.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {order.status || 'Delivered'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{formatDate(order.createdAt)}</span>
                            <strong className="text-slate-900 font-bold">
                              {formatCurrency(order.subtotal || order.amount)}
                            </strong>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {order.items.map((i) => i.name || i.productNameSnapshot).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <FiPackage className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                      <p>Past orders will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-3 pt-1">
                  <form onSubmit={handleSaveNote} className="space-y-2">
                    <textarea
                      rows="3"
                      placeholder="Add relationship notes, delivery preferences..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                    />
                    <div className="flex items-center justify-between">
                      {isNoteSuccess ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Note saved!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Private internal note</span>
                      )}
                      <button
                        type="submit"
                        disabled={!noteInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#1b6442] text-white text-xs font-semibold hover:bg-[#144d32] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(customerNotes[selectedCustomer.id] || []).length > 0 ? (
                      customerNotes[selectedCustomer.id].map((note) => (
                        <div key={note.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <p className="text-slate-700">{note.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{note.date}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center py-4">No notes recorded yet.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <FiUser className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Select a customer to view their details.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Quick Message Modal */}
      {messageModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1b6442] flex items-center justify-center">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Message {messageModalCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400">{messageModalCustomer.phone || messageModalCustomer.shopOwner}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessageModalCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {messageSent ? (
              <div className="py-6 text-center space-y-2">
                <FiCheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Message sent successfully!</p>
                <p className="text-[11px] text-slate-400">Your message was delivered to {messageModalCustomer.phone}.</p>
                <button
                  type="button"
                  onClick={() => setMessageModalCustomer(null)}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-[#1b6442] text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows="4"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442]"
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMessageModalCustomer(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageSent(true)
                      setTimeout(() => setMessageModalCustomer(null), 2000)
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
