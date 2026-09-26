import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TbPackage,
  TbShoppingBag,
  TbBottle,
  TbSparkles,
  TbSpray,
  TbMilk,
  TbCookie,
  TbBuildingFactory2,
  TbLayoutGrid,
  TbPencil,
  TbTag,
} from 'react-icons/tb'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSuppliers } from '../services/catalogService.js'

const categoryDescriptions = {
  FMCG: 'Everyday essentials and quick-turn replenishment.',
  'Grocery & Staples': 'Core groceries and staple goods for repeat demand.',
  Beverages: 'Refreshment and household drinks with local appeal.',
  'Personal Care': 'Daily personal care basics and repeat-purchase items.',
  'Cleaning & Household': 'Household products for regular store restocking.',
  'Dairy & Bakery': 'Fresh dairy, bakery, and daily essentials.',
  'Snacks & Packaged Foods': 'Fast-moving packaged and impulse snack favourites.',
  'Local Manufacturers': 'Locally produced goods and regional speciality products.',
}

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
const baseCategoryCatalog = [
  { id: 'all', key: 'allCategories', label: 'All Categories', icon: 'all' },
  { id: 'FMCG', key: 'categoryFmcg', descKey: 'categoryFmcgDesc', icon: 'fmcg' },
  { id: 'Grocery & Staples', key: 'categoryGrocery', descKey: 'categoryGroceryDesc', icon: 'grocery' },
  { id: 'Beverages', key: 'categoryBeverages', descKey: 'categoryBeveragesDesc', icon: 'beverage' },
  { id: 'Personal Care', key: 'categoryPersonalCare', descKey: 'categoryPersonalCareDesc', icon: 'personal' },
  { id: 'Cleaning & Household', key: 'categoryCleaning', descKey: 'categoryCleaningDesc', icon: 'cleaning' },
  { id: 'Dairy & Bakery', key: 'categoryDairy', descKey: 'categoryDairyDesc', icon: 'dairy' },
  { id: 'Snacks & Packaged Foods', key: 'categorySnacks', descKey: 'categorySnacksDesc', icon: 'snacks' },
  { id: 'Local Manufacturers', key: 'categoryLocal', descKey: 'categoryLocalDesc', icon: 'local' },
  { id: 'Stationary', label: 'Stationary', icon: 'stationary' },
]

// ---------------------------------------------------------------------------
// Category SVG icons
// ---------------------------------------------------------------------------
const CategoryIcon = ({ type }) => {
  const iconProps = { size: 24, strokeWidth: 1.8, 'aria-hidden': true }
  switch (type) {
    case 'all':
      return <TbLayoutGrid {...iconProps} />
    case 'fmcg':
      return <TbPackage {...iconProps} />
    case 'grocery':
      return <TbShoppingBag {...iconProps} />
    case 'beverage':
      return <TbBottle {...iconProps} />
    case 'personal':
      return <TbSparkles {...iconProps} />
    case 'cleaning':
      return <TbSpray {...iconProps} />
    case 'dairy':
      return <TbMilk {...iconProps} />
    case 'snacks':
      return <TbCookie {...iconProps} />
    case 'local':
      return <TbBuildingFactory2 {...iconProps} />
    case 'stationary':
      return <TbPencil {...iconProps} />
    default:
      return <TbTag {...iconProps} />
  }
}

// Category icon accent colors (background tint / icon color)
const categoryColors = {
  all: { bg: '#f1f5f9', color: '#334155' },
  fmcg: { bg: '#ecfdf5', color: '#047857' },
  grocery: { bg: '#fffbeb', color: '#b45309' },
  beverage: { bg: '#eff6ff', color: '#1d4ed8' },
  personal: { bg: '#fdf2f8', color: '#be185d' },
  cleaning: { bg: '#f0fdfa', color: '#0f766e' },
  dairy: { bg: '#f5f3ff', color: '#6d28d9' },
  snacks: { bg: '#fff7ed', color: '#c2410c' },
  local: { bg: '#ecfdf5', color: '#065f46' },
  stationary: { bg: '#f1f5f9', color: '#475569' },
  tag: { bg: '#f8fafc', color: '#64748b' },
}

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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider" aria-label={label}>
      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="11" height="11">
        <circle cx="7" cy="7" r="6.5" fill="#15803d" />
        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
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
// HeartButton sub-component
// ---------------------------------------------------------------------------
function HeartButton({ isFavorite, name, onClick }) {
  return (
    <button
      type="button"
      className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
      aria-label={isFavorite ? `Remove ${name} from favorites` : `Save ${name}`}
      onClick={onClick}
    >
      <svg viewBox="0 0 20 20" fill={isFavorite ? '#ef4444' : 'none'} stroke={isFavorite ? '#ef4444' : '#9ca3af'} strokeWidth="1.6" aria-hidden="true" width="18" height="18">
        <path d="M10 17.5S2 13 2 7a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 10.5-8 10.5Z" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ---------------------------------------------------------------------------
// SupplierCard sub-component
// ---------------------------------------------------------------------------
function SupplierCard({ supplier, isFavorite, onToggleFavorite }) {
  const { t } = useLocale()
  const initials = getInitials(supplier.name)
  const bg = getAvatarBg(supplier.name)

  return (
    <article className="relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
      <div className="absolute top-4 right-4">
        <HeartButton
          isFavorite={isFavorite}
          name={supplier.name}
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite(supplier.id)
          }}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl text-white font-black text-base shrink-0 shadow-xs" style={{ background: bg }} aria-hidden="true">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{supplier.name}</h3>
              {supplier.isVerified && <VerifiedBadge label={t('verifiedSupplier')} />}
            </div>
            <span className="text-xs font-semibold text-brand-orange">{supplier.type}</span>
            {(supplier.serviceAreas?.length > 0 || supplier.location) && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                <span>📍</span>
                <span className="truncate">{supplier.serviceAreas?.length > 0 ? supplier.serviceAreas.join(', ') : supplier.location}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {supplier.description || t('verifiedSupplierDescription')}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {(supplier.tags || []).map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100">
        <Link
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-orange-light hover:bg-brand-orange hover:text-white text-brand-orange font-bold text-xs sm:text-sm transition-all border border-brand-orange/20 shadow-xs"
          to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}
          aria-label={`${t('viewProducts')} ${supplier.name}`}
        >
          {t('viewProducts')} <span aria-hidden="true">→</span>
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const categoryScrollRef = useRef(null)

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -300 : 300
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    let isMounted = true

    async function fetchSuppliers() {
      setIsLoading(true)
      setError('')

      try {
        const response = await getSuppliers()
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
  }, [])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

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
        if (selectedCategory !== 'all') {
          const target = selectedCategory.toLowerCase().trim()
          const supplierCats = (s.allCategories || [s.category]).map((c) => String(c).toLowerCase().trim())
          const matchesCategory = supplierCats.some((c) => 
            c === target || 
            c.includes(target) || 
            target.includes(c) ||
            (target.includes('snack') && c.includes('snack')) ||
            (target.includes('grocery') && (c.includes('grocery') || c.includes('staple')))
          )
          if (!matchesCategory) return false
        }
        if (q && ![s.name, s.type, s.category, s.location, s.description, ...(s.tags || []), ...(s.allCategories || [])].some((v) => String(v).toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => (b.rating || 0) * Math.log((b.reviewCount || 1) + 1) - (a.rating || 0) * Math.log((a.reviewCount || 1) + 1))
  }, [suppliers, selectedCategory, searchTerm])

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return t('allSuppliers')
    const cat = categoryCatalog.find((c) => c.id === selectedCategory)
    const label = cat?.label || (cat?.key ? t(cat.key) : selectedCategory)
    return t('suppliersInCategory', { category: label })
  }, [categoryCatalog, selectedCategory, t])

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0 max-w-full">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2" aria-label="Breadcrumb">
            <span>{t('shopOwner')}</span>
            <span aria-hidden="true">›</span>
            <span className="text-slate-700">{t('suppliers')}</span>
          </nav>
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

      {/* ── Category selector (single row of square cards) ── */}
      <div className="space-y-3 w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('shopByCategory')}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
              aria-label="Scroll left"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
              aria-label="Scroll right"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div 
          ref={categoryScrollRef}
          className="flex flex-nowrap gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth w-full min-w-0 max-w-full"
          style={{ scrollbarWidth: 'none' }}
          role="list"
        >
          {categoryCatalog.map((cat) => {
            const isActive = selectedCategory === cat.id
            const colors = categoryColors[cat.icon] || categoryColors.tag
            return (
              <button
                key={cat.id}
                type="button"
                role="listitem"
                className={`aspect-square w-[130px] sm:w-[140px] shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer shadow-2xs hover:shadow-xs ${
                  isActive 
                    ? 'bg-brand-orange-light border-brand-orange/40 ring-2 ring-brand-orange/20' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
                onClick={() => setSelectedCategory(isActive && cat.id !== 'all' ? 'all' : cat.id)}
                aria-pressed={isActive}
              >
                <span
                  className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl mb-2 text-xl shrink-0 shadow-2xs"
                  style={{ background: colors.bg, color: colors.color }}
                >
                  <CategoryIcon type={cat.icon} />
                </span>
                <span className="text-xs font-bold text-slate-800 leading-snug text-center break-words max-w-full px-1">
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search toolbar & results header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {activeCategoryLabel} <span className="text-xs font-semibold text-slate-500">({filteredSuppliers.length} {t('suppliers')})</span>
          </h2>
        </div>

        <label className="relative w-full sm:w-80 flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all" htmlFor="sdc-search">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="16" height="16" className="text-slate-500 mr-2 shrink-0">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-500 focus:outline-hidden"
            id="sdc-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchSuppliersByName')}
          />
        </label>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              isFavorite={Boolean(favorites[supplier.id])}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}
