import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiSearch,
  FiMapPin,
  FiChevronDown,
  FiX,
  FiFilter,
  FiRotateCcw,
} from 'react-icons/fi'
import { TbLayoutGrid } from 'react-icons/tb'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSuppliers } from '../services/catalogService.js'


function normalizeCategory(str) {
  if (!str) return ''
  const trimmed = str.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'fmgc' || lower === 'fmcg') return 'FMCG'
  if (lower === 'baverages' || lower === 'beverages') return 'Beverages'
  if (lower === 'grocery' || lower === 'staples') return 'Grocery & Staples'
  if (lower === 'personal care') return 'Personal Care'
  if (lower === 'cleaning' || lower === 'household') return 'Cleaning & Household'
  if (lower === 'dairy' || lower === 'bakery') return 'Dairy & Bakery'
  if (lower === 'snacks') return 'Snacks & Packaged Foods'
  return trimmed
}

function normalizeSupplier(supplier = {}) {
  const rawCategory = supplier.category || supplier.categoryLabel || 'FMCG'
  const serviceAreas = Array.isArray(supplier.serviceAreas) ? supplier.serviceAreas : []

  // Split multiple comma-separated categories if present (e.g. 'FMCG, Grocery & Staples, Beverages, Personal Care')
  const categoryList = rawCategory
    .split(',')
    .map(normalizeCategory)
    .filter(Boolean)

  const rawTags = Array.isArray(supplier.tags) ? supplier.tags : []
  const tagList = rawTags.map(normalizeCategory).filter(Boolean)

  const allCategories = Array.from(new Set([...categoryList, ...tagList]))

  return {
    ...supplier,
    id: supplier.id,
    name: supplier.name,
    type: supplier.type || rawCategory,
    category: rawCategory,
    categoryLabel: supplier.categoryLabel || rawCategory,
    allCategories: allCategories.length ? allCategories : [normalizeCategory(rawCategory)],
    description: supplier.description || '',
    location: supplier.location || '',
    serviceAreas,
    serviceAreaCount: Number(supplier.serviceAreaCount ?? serviceAreas.length ?? 0),
    productCount: supplier.productCount || 0,
    minimumOrder: supplier.minimumOrder || '',
    phone: supplier.phone || '',
    isVerified: Boolean(supplier.isVerified),
    rating: supplier.rating == null ? null : Number(supplier.rating),
    reviewCount: Number(supplier.reviewCount ?? 0),
    tags: allCategories.length ? allCategories : [rawCategory],
  }
}

// ---------------------------------------------------------------------------
// Base Category definitions
// ---------------------------------------------------------------------------
const AREA_CHIPS = ['All Areas', 'Bodakdev', 'Navrangpura', 'Satellite', 'Vastrapur', 'Paldi', 'Maninagar']

const baseCategoryCatalog = [
  { id: 'all', key: 'allCategories', label: 'All categories' },
  { id: 'FMCG', key: 'categoryFmcg', descKey: 'categoryFmcgDesc', label: 'FMCG' },
  { id: 'Grocery & Staples', key: 'categoryGrocery', descKey: 'categoryGroceryDesc', label: 'Grocery & Staples' },
  { id: 'Snacks & Packaged Foods', key: 'categorySnacks', descKey: 'categorySnacksDesc', label: 'Snacks & Packaged Foods' },
  { id: 'Beverages', key: 'categoryBeverages', descKey: 'categoryBeveragesDesc', label: 'Beverages' },
  { id: 'Dairy & Bakery', key: 'categoryDairy', descKey: 'categoryDairyDesc', label: 'Dairy & Bakery' },
  { id: 'Personal Care', key: 'categoryPersonalCare', descKey: 'categoryPersonalCareDesc', label: 'Personal Care' },
  { id: 'Cleaning & Household', key: 'categoryCleaning', descKey: 'categoryCleaningDesc', label: 'Cleaning & Household' },
  { id: 'Packaged Foods', label: 'Packaged Foods' },
  { id: 'Cooking Essentials', label: 'Cooking Essentials' },
  { id: 'Stationary', label: 'Stationary' },
]

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'S'
  )
}

const avatarPalette = [
  '#0f2942', // brand navy
  '#1e293b', // slate 800
  '#0f766e', // teal 700
  '#15803d', // green 700
  '#334155', // slate 700
  '#1e3a5f', // deep blue
  '#4338ca', // indigo 700
  '#b45309', // amber 700
]
function getAvatarBg(name = '') {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}

// ---------------------------------------------------------------------------
// VerifiedBadge sub-component
// ---------------------------------------------------------------------------
function VerifiedBadge({ label = 'Verified Supplier' }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0" aria-label={label}>
      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="10" height="10" className="sm:w-[11px] sm:h-[11px]">
        <circle cx="7" cy="7" r="6.5" fill="#15803d" />
        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="truncate max-w-[70px] sm:max-w-none">{label}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// StarRating sub-component
// ---------------------------------------------------------------------------
function StarRating({ rating, reviewCount }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {rating == null ? (
        <span className="text-slate-500">Not rated</span>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="#F59E0B" aria-hidden="true" width="14" height="14">
            <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.133L8 10.5l-3.708 2.085L5 8.452 2 5.528l4.146-.772L8 1z" />
          </svg>
          <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
          <span className="text-slate-500">({reviewCount})</span>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SupplierCard sub-component
// ---------------------------------------------------------------------------
function SupplierCard({ supplier }) {
  const { t } = useLocale()
  const initials = getInitials(supplier.name)
  const bg = getAvatarBg(supplier.name)

  return (
    <article className="relative flex flex-col justify-between p-3.5 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-start gap-2 sm:gap-3.5">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl text-white font-black text-xs sm:text-sm lg:text-base shrink-0 shadow-xs" style={{ background: bg }} aria-hidden="true">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <h3 className="text-xs sm:text-lg font-bold text-slate-900 truncate">{supplier.name}</h3>
              {supplier.isVerified && <VerifiedBadge label={t('verifiedSupplier')} />}
            </div>
            {(supplier.serviceAreas?.length > 0 || supplier.location) && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                <span>📍</span>
                <span className="truncate">{supplier.serviceAreas?.length > 0 ? supplier.serviceAreas.join(', ') : supplier.location}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {supplier.description || t('verifiedSupplierDescription')}
        </p>

        <div className="hidden sm:flex flex-wrap gap-1.5 pt-1">
          {(supplier.tags || []).map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-2.5 sm:pt-4 mt-2 sm:mt-4 border-t border-slate-100">
        <Link
          className="flex items-center justify-center gap-1 sm:gap-2 w-full py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] truncate text-center"
          to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}
          aria-label={`${t('viewProducts')} ${supplier.name}`}
        >
          <span className="truncate">{t('viewProducts')}</span> <span aria-hidden="true" className="shrink-0">→</span>
        </Link>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function SupplierListPage() {
  const { t } = useLocale()
  const [selectedArea, setSelectedArea] = useState('All Areas')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    let isMounted = true

    async function fetchSuppliers() {
      setIsLoading(true)
      setError('')

      try {
        const areaParam = selectedArea === 'All Areas' ? 'all' : selectedArea
        const response = await getSuppliers({ area: areaParam })
        const records = Array.isArray(response?.data?.suppliers) ? response.data.suppliers : []
        if (isMounted) {
          setSuppliers(records.map(normalizeSupplier))
        }
      } catch (requestError) {
        if (isMounted) {
          setSuppliers([])
          setError(requestError.message)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchSuppliers()

    return () => {
      isMounted = false
    }
  }, [selectedArea])

  const categoryCatalog = useMemo(() => {
    const list = baseCategoryCatalog.map((item) => ({
      ...item,
      label: item.id === 'all' ? (t('allCategories') || item.label) : (item.key ? t(item.key) : item.label || item.id)
    }))

    const existingIds = new Set(list.map((c) => c.id.toLowerCase()))

    suppliers.forEach((s) => {
      (s.allCategories || []).forEach((cat) => {
        if (cat && !existingIds.has(cat.toLowerCase())) {
          existingIds.add(cat.toLowerCase())
          list.push({
            id: cat,
            label: cat,
            icon: cat.toLowerCase().includes('food') ? 'snacks' : 'tag'
          })
        }
      })
    })

    return list
  }, [suppliers, t])

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return [...suppliers]
      .filter((s) => {
        if (selectedArea !== 'All Areas') {
          const areaNorm = selectedArea.toLowerCase().trim()
          const servAreas = (s.serviceAreas || []).map((a) => String(a).toLowerCase().trim())
          const loc = String(s.location || '').toLowerCase().trim()
          const matchesArea = servAreas.some((a) => a === areaNorm || a.includes(areaNorm) || areaNorm.includes(a)) || loc.includes(areaNorm)
          if (!matchesArea) return false
        }
        if (selectedCategory !== 'all') {
          const target = selectedCategory.toLowerCase().trim()
          const supplierCats = (s.allCategories || [s.category]).map((c) => String(c).toLowerCase().trim())
          const matchesCategory = supplierCats.some((c) => 
            c === target || 
            c.includes(target) || 
            target.includes(c) ||
            (target.includes('snack') && c.includes('snack')) ||
            (target.includes('grocery') && (c.includes('grocery') || c.includes('staple'))) ||
            (target.includes('cooking') && (c.includes('cooking') || c.includes('staple') || c.includes('grocery')))
          )
          if (!matchesCategory) return false
        }
        if (q && ![s.name, s.type, s.category, s.location, s.description, ...(s.tags || []), ...(s.allCategories || [])].some((v) => String(v).toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => (b.rating || 0) * Math.log((b.reviewCount || 1) + 1) - (a.rating || 0) * Math.log((a.reviewCount || 1) + 1))
  }, [suppliers, selectedArea, selectedCategory, searchTerm])

  const areaOptions = useMemo(() => {
    const list = [...AREA_CHIPS]
    const existing = new Set(list.map((a) => a.toLowerCase()))
    suppliers.forEach((s) => {
      (s.serviceAreas || []).forEach((area) => {
        if (area && !existing.has(area.toLowerCase())) {
          existing.add(area.toLowerCase())
          list.push(area)
        }
      })
      if (s.location && !existing.has(s.location.toLowerCase())) {
        existing.add(s.location.toLowerCase())
        list.push(s.location)
      }
    })
    return list
  }, [suppliers])

  const handleResetFilters = () => {
    setSelectedArea('All Areas')
    setSelectedCategory('all')
    setSearchTerm('')
  }

  const activeCategoryLabel = useMemo(() => {
    let base = t('allSuppliers') || 'All Suppliers'
    if (selectedCategory !== 'all') {
      const cat = categoryCatalog.find((c) => c.id === selectedCategory)
      const label = cat?.label || (cat?.key ? t(cat.key) : selectedCategory)
      base = label
    }
    if (selectedArea !== 'All Areas') {
      return `${base} in ${selectedArea}`
    }
    return base
  }, [categoryCatalog, selectedCategory, selectedArea, t])

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0 max-w-full">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('findSuppliers')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('findSuppliersDescription')}</p>
        </div>

        <div className="hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-semibold" aria-hidden="true">
          <div className="flex flex-col leading-tight">
            <span>{t('sourceLocal')}</span>
            <span>{t('stockLocal')}</span>
            <span className="text-emerald-700 font-extrabold">{t('growLocal')}</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar (Desktop, Tablet, Mobile) ── */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5 sm:space-y-4">
        {/* Top Header inside filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-orange-light text-brand-orange text-sm font-bold">
              <FiFilter className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                Filter Suppliers
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Select your shop area discovery location and product category
              </p>
            </div>
          </div>

          {(selectedArea !== 'All Areas' || selectedCategory !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange-dark cursor-pointer self-start sm:self-auto py-1 px-2 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <FiRotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        {/* Inputs Grid: Desktop (12-cols), Tablet (2-cols), Mobile (1-col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* 1. Search Box */}
          <div className="sm:col-span-2 lg:col-span-5 flex flex-col justify-end">
            <label htmlFor="sdc-search" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <FiSearch className="w-3.5 h-3.5 text-slate-500" />
              <span>Search Suppliers</span>
            </label>
            <div className="relative flex items-center">
              <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="sdc-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchSuppliersByName')}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Shop Area Discovery Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3 flex flex-col justify-end">
            <label htmlFor="area-discovery-select" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Shop Area Discovery</span>
            </label>
            <div className="relative flex items-center">
              <FiMapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 pointer-events-none shrink-0" />
              <select
                id="area-discovery-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                aria-label="Shop Area Discovery"
                className="w-full appearance-none pl-10 pr-9 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-orange rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 shadow-2xs cursor-pointer transition-all truncate"
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area === 'All Areas' ? 'All Areas (Any Location)' : area}
                  </option>
                ))}
              </select>
              <FiChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* 3. Shop by Category Dropdown */}
          <div className="sm:col-span-1 lg:col-span-4 flex flex-col justify-end">
            <label htmlFor="category-select" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <TbLayoutGrid className="w-3.5 h-3.5 text-brand-orange" />
              <span>{t('shopByCategory')}</span>
            </label>
            <div className="relative flex items-center">
              <TbLayoutGrid className="w-4 h-4 text-brand-orange absolute left-3.5 pointer-events-none shrink-0" />
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label={t('shopByCategory')}
                className="w-full appearance-none pl-10 pr-9 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-orange rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 shadow-2xs cursor-pointer transition-all truncate"
              >
                {categoryCatalog.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id === 'all' ? (t('allCategories') || 'All Categories') : cat.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
            </div>
          </div>
        </div>

        {/* Active Filter Pills Row */}
        {(selectedArea !== 'All Areas' || selectedCategory !== 'all' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Active filters:</span>
            {selectedArea !== 'All Areas' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] sm:text-xs">
                <span>📍 Area: {selectedArea}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArea('All Areas')}
                  className="hover:text-emerald-950 cursor-pointer p-0.5 rounded-full hover:bg-emerald-100"
                  aria-label="Remove area filter"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-brand-orange font-bold text-[11px] sm:text-xs">
                <span>🏷️ Category: {categoryCatalog.find((c) => c.id === selectedCategory)?.label || selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-orange-950 cursor-pointer p-0.5 rounded-full hover:bg-orange-100"
                  aria-label="Remove category filter"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px] sm:text-xs">
                <span>🔍 Search: "{searchTerm}"</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-blue-950 cursor-pointer p-0.5 rounded-full hover:bg-blue-100"
                  aria-label="Remove search filter"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-brand-orange hover:underline cursor-pointer ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight">
            {activeCategoryLabel}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              ({filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : t('suppliers')})
            </span>
          </h2>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
      )}

      {!error && !isLoading && suppliers.length === 0 && (
        <p className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">{t('noSuppliersAvailable')}</p>
      )}

      {/* ── Supplier grid ── */}
      {filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" width="48" height="48" className="text-slate-300">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
            <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-slate-600 font-semibold text-sm">{t('noSuppliers')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 w-full min-w-0">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
            />
          ))}
        </div>
      )}
    </section>
  )
}
