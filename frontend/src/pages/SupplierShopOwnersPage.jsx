import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiMapPin,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiArrowRight,
  FiTag,
  FiHome,
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierShopOwners } from '../services/supplierShopOwnerService.js'

function formatCurrency(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`
}

function getInitials(name = '') {
  return String(name || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'S'
}

export default function SupplierShopOwnersPage() {
  const { t } = useLocale()
  const [shopOwners, setShopOwners] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedShopId, setSelectedShopId] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    getSupplierShopOwners()
      .then((res) => {
        if (!isMounted) return
        const list = res.data?.shopOwners || []
        setShopOwners(list)
        setServiceAreas(res.data?.serviceAreas || [])
        setSupplierName(res.data?.supplierName || '')
        if (list.length > 0) {
          setSelectedShopId(list[0].id)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load shop owners:', err)
        setError(err.message || 'Failed to load shop owners')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Derived filtered list
  const filteredShops = useMemo(() => {
    const q = search.trim().toLowerCase()
    return shopOwners.filter((shop) => {
      const matchesSearch =
        !q ||
        `${shop.shopName} ${shop.ownerName} ${shop.area} ${shop.address} ${shop.phone}`
          .toLowerCase()
          .includes(q)

      const matchesArea =
        selectedArea === 'ALL' ||
        shop.area.toLowerCase().includes(selectedArea.toLowerCase()) ||
        (shop.matchingArea && shop.matchingArea.toLowerCase() === selectedArea.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CUSTOMER' && shop.totalOrders > 0) ||
        (statusFilter === 'PROSPECT' && shop.totalOrders === 0)

      return matchesSearch && matchesArea && matchesStatus
    })
  }, [shopOwners, search, selectedArea, statusFilter])

  const selectedShop =
    shopOwners.find((s) => s.id === selectedShopId) || filteredShops[0] || null

  const stats = useMemo(() => {
    const totalMatching = shopOwners.length
    const existingCustomers = shopOwners.filter((s) => s.totalOrders > 0).length
    const potentialRetailers = totalMatching - existingCustomers
    const areasCount = serviceAreas.length
    return {
      totalMatching,
      existingCustomers,
      potentialRetailers,
      areasCount,
    }
  }, [shopOwners, serviceAreas])

  function handleCall(phone) {
    if (!phone) return
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`
  }

  if (loading) {
    return <LoadingState message={t('loadingShopOwners') || 'Loading shop owners in your service areas...'} />
  }

  return (
    <section className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider" aria-label="Breadcrumb">
        <Link to="/dashboard/supplier/home" className="hover:text-slate-600 transition-colors">
          {t('supplierWorkspace')}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('shopOwners') || 'Shop Owners'}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
            {t('serviceAreaCoverage') || 'Same Area Matching'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            {t('shopOwners') || 'Shop Owners'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('shopOwnersMatchingDescription') ||
              'Every retail shop owner located within your active delivery service areas.'}
          </p>
        </div>

        {/* Service area tags */}
        {serviceAreas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto max-w-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              {t('yourAreas') || 'Your Areas'}:
            </span>
            {serviceAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(selectedArea === area ? 'ALL' : area)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedArea === area
                    ? 'bg-brand-orange text-white shadow-2xs'
                    : 'bg-orange-50 text-brand-orange border border-orange-200/80 hover:bg-orange-100'
                }`}
              >
                <FiMapPin className="text-[10px]" />
                <span>{area}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Metrics Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center text-xl shrink-0">
            <FiShoppingBag />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              {t('matchingShops') || 'Matching Shops'}
            </span>
            <strong className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.totalMatching}
            </strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {t('inYourServiceAreas') || 'in your service areas'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <FiCheckCircle />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              {t('activeCustomers') || 'Active Buyers'}
            </span>
            <strong className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.existingCustomers}
            </strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {t('hasOrderedBefore') || 'have ordered from you'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <FiClock />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              {t('potentialRetailers') || 'New Prospects'}
            </span>
            <strong className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.potentialRetailers}
            </strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {t('readyToConnect') || 'ready to restock'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <FiMapPin />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              {t('activeServiceAreas') || 'Areas Covered'}
            </span>
            <strong className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.areasCount}
            </strong>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {t('localAhmedabadAreas') || 'active delivery zones'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            <FiSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchShopOwnersPlaceholder') || 'Search by shop name, owner, area, or phone...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Area filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
          >
            <option value="ALL">{t('allServiceAreas') || 'All Matching Areas'}</option>
            {serviceAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
          >
            <option value="ALL">{t('allRelationshipStatus') || 'All Status'}</option>
            <option value="CUSTOMER">{t('existingCustomer') || 'Active Customer'}</option>
            <option value="PROSPECT">{t('potentialProspect') || 'New Prospect'}</option>
          </select>

          {(search || selectedArea !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedArea('ALL')
                setStatusFilter('ALL')
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <FiX /> {t('clear')}
            </button>
          )}
        </div>
      </div>

      {/* ── Main List & Details Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: Shops List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500">
            <span>
              {t('shopCountMatching', { count: filteredShops.length }) ||
                `Showing ${filteredShops.length} matching shop owners`}
            </span>
            <span className="text-slate-400">
              {serviceAreas.length} {t('areasCovered') || 'areas covered'}
            </span>
          </div>

          {filteredShops.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredShops.map((shop) => {
                const isSelected = selectedShop?.id === shop.id
                const isCustomer = shop.totalOrders > 0
                return (
                  <article
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50/50 border-l-4 border-l-brand-orange shadow-2xs'
                        : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {getInitials(shop.shopName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {shop.shopName}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isCustomer
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {isCustomer
                              ? `${shop.totalOrders} ${shop.totalOrders === 1 ? 'Order' : 'Orders'}`
                              : t('newProspect') || 'New Prospect'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-slate-700">
                            <FiUser className="text-slate-400" />
                            {shop.ownerName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-brand-orange font-semibold">
                            <FiMapPin />
                            {shop.area}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {shop.address || shop.area}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isCustomer ? (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {t('totalOrdered') || 'Total Ordered'}
                          </span>
                          <strong className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {formatCurrency(shop.totalSpent)}
                          </strong>
                        </div>
                      ) : (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {t('matchedArea') || 'Matched Area'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            ✓ {shop.matchingArea || shop.area}
                          </span>
                        </div>
                      )}

                      {shop.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCall(shop.phone)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-brand-orange text-brand-orange hover:text-white border border-orange-200/80 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                          title={`Call ${shop.ownerName}`}
                        >
                          <FiPhone />
                          <span>{t('call') || 'Call'}</span>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                title={t('noMatchingShopOwners') || 'No shop owners found'}
                message={
                  t('noMatchingShopOwnersDesc') ||
                  'No shop owners currently match your selected area or filters.'
                }
              />
            </div>
          )}
        </div>

        {/* Right: Selected Shop Owner Detail Card */}
        {selectedShop && (
          <aside className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                {getInitials(selectedShop.shopName)}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block">
                  {selectedShop.matchingArea ? `Serviced Zone: ${selectedShop.matchingArea}` : 'Local Shop'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {selectedShop.shopName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedShop.ownerName}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('totalOrders') || 'Orders Placed'}
                </span>
                <strong className="text-base font-extrabold text-slate-900 tabular-nums">
                  {selectedShop.totalOrders}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('totalSpent') || 'Total Spent'}
                </span>
                <strong className="text-base font-extrabold text-slate-900 tabular-nums">
                  {formatCurrency(selectedShop.totalSpent)}
                </strong>
              </div>
            </div>

            {/* Shop Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                  <FiMapPin /> {t('area')}
                </span>
                <span className="font-bold text-slate-800 text-right">
                  {selectedShop.area}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                  <FiHome /> {t('address') || 'Address'}
                </span>
                <span className="font-medium text-slate-700 text-right leading-relaxed">
                  {selectedShop.address || selectedShop.area}
                </span>
              </div>

              {selectedShop.phone && (
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                    <FiPhone /> {t('phone') || 'Phone'}
                  </span>
                  <a
                    href={`tel:${selectedShop.phone.replace(/[^\d+]/g, '')}`}
                    className="font-bold text-brand-orange hover:underline"
                  >
                    {selectedShop.phone}
                  </a>
                </div>
              )}

              {selectedShop.email && (
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                    <FiMail /> {t('email') || 'Email'}
                  </span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {selectedShop.email}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-slate-400 font-medium">
                  {t('relationship') || 'Status'}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedShop.totalOrders > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {selectedShop.totalOrders > 0
                    ? t('activeCustomer') || 'Active Customer'
                    : t('potentialRetailer') || 'Potential Retailer'}
                </span>
              </div>
            </div>

            {/* Action Button */}
            {selectedShop.phone && (
              <button
                type="button"
                onClick={() => handleCall(selectedShop.phone)}
                className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FiPhone />
                <span>{t('callShopOwner') || `Call ${selectedShop.ownerName}`}</span>
              </button>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <strong className="text-slate-700 block font-bold">
                💡 {t('areaMatchingTipTitle') || 'Direct Local Connection'}
              </strong>
              <p>
                {t('areaMatchingTip') ||
                  `This shop is in ${selectedShop.area}, which matches your service area "${selectedShop.matchingArea}". You can contact them to supply inventory directly.`}
              </p>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
