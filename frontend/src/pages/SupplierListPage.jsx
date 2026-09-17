import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

function normalizeSupplier(supplier = {}) {
  const category = supplier.category || supplier.categoryLabel || 'FMCG'
  const serviceAreas = Array.isArray(supplier.serviceAreas) ? supplier.serviceAreas : []

  return {
    ...supplier,
    id: supplier.id,
    name: supplier.name,
    type: supplier.type || category,
    category,
    categoryLabel: supplier.categoryLabel || category,
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
    tags: Array.isArray(supplier.tags) && supplier.tags.length ? supplier.tags : [category],
  }
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------
const categoryCatalog = [
  { id: 'FMCG', key: 'categoryFmcg', descKey: 'categoryFmcgDesc', icon: 'fmcg' },
  { id: 'Grocery & Staples', key: 'categoryGrocery', descKey: 'categoryGroceryDesc', icon: 'grocery' },
  { id: 'Beverages', key: 'categoryBeverages', descKey: 'categoryBeveragesDesc', icon: 'beverage' },
  { id: 'Personal Care', key: 'categoryPersonalCare', descKey: 'categoryPersonalCareDesc', icon: 'personal' },
  { id: 'Cleaning & Household', key: 'categoryCleaning', descKey: 'categoryCleaningDesc', icon: 'cleaning' },
  { id: 'Dairy & Bakery', key: 'categoryDairy', descKey: 'categoryDairyDesc', icon: 'dairy' },
  { id: 'Snacks & Packaged Foods', key: 'categorySnacks', descKey: 'categorySnacksDesc', icon: 'snacks' },
  { id: 'Local Manufacturers', key: 'categoryLocal', descKey: 'categoryLocalDesc', icon: 'local' },
]

// ---------------------------------------------------------------------------
// Category SVG icons
// ---------------------------------------------------------------------------
const CategoryIcon = ({ type }) => {
  switch (type) {
    case 'fmcg':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="8" y="14" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 23.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'grocery':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7 13h18l-2 12H9L7 13Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 13v-2a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="13" cy="10" r="1.2" fill="currentColor" />
          <circle cx="19" cy="10" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'beverage':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M11 7h10l-1.5 18H12.5L11 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M13 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 25v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'personal':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M12 17c0-2.8 1.8-4 4-4s4 1.2 4 4v6H12v-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M13 13v-1.5a3 3 0 0 1 6 0V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 23h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 8v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'cleaning':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M13 7h6l2 14a4 4 0 0 1-4 5h-2a4 4 0 0 1-4-5L13 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 7V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'dairy':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M10 12h12l-1.5 14H11.5L10 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M13 12V9.5a3 3 0 0 1 6 0V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 22h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'snacks':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M8 16h16l-2 9a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L8 16Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M11 16v-4a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'local':
      return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M6 26h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 26V14h14v12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 14V10h8v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M13 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 10V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

// Category icon accent colors (background tint / icon color)
const categoryColors = {
  fmcg: { bg: '#e8f5e9', color: '#2E7D32' },
  grocery: { bg: '#fff8e1', color: '#F57F17' },
  beverage: { bg: '#e3f2fd', color: '#1565C0' },
  personal: { bg: '#fce4ec', color: '#AD1457' },
  cleaning: { bg: '#e8eaf6', color: '#283593' },
  dairy: { bg: '#f3e5f5', color: '#6A1B9A' },
  snacks: { bg: '#fff3e0', color: '#E65100' },
  local: { bg: '#e0f2f1', color: '#00695C' },
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
  '#1a3a4c', '#2e5266', '#4a6741', '#6b4e3d',
  '#3d5a6e', '#5c4033', '#1b5e20', '#4a148c',
]
function getAvatarBg(name = '') {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}

// ---------------------------------------------------------------------------
// VerifiedBadge sub-component
// ---------------------------------------------------------------------------
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider" aria-label="Verified Supplier">
      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="11" height="11">
        <circle cx="7" cy="7" r="6.5" fill="#1a7a3c" />
        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
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
        <span className="text-slate-400">Not rated</span>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="#F59E0B" aria-hidden="true" width="14" height="14">
            <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.133L8 10.5l-3.708 2.085L5 8.452 2 5.528l4.146-.772L8 1z" />
          </svg>
          <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
          <span className="text-slate-400">({reviewCount})</span>
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
              {supplier.isVerified && <VerifiedBadge />}
            </div>
            <span className="text-xs font-semibold text-brand-orange">{supplier.type}</span>
            {(supplier.serviceAreas?.length > 0 || supplier.location) && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                <span>📍</span>
                <span className="truncate">{supplier.serviceAreas?.length > 0 ? supplier.serviceAreas.join(', ') : supplier.location}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {supplier.description || 'Verified wholesale distributor delivering to local grocery stores.'}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {(supplier.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100">
        <Link
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-50 hover:bg-brand-orange hover:text-white text-brand-orange font-bold text-xs sm:text-sm transition-all border border-orange-200/60 shadow-xs"
          to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}
          aria-label={`View ${supplier.name} products`}
        >
          View Products <span aria-hidden="true">→</span>
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

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return [...suppliers]
      .filter((s) => {
        if (selectedCategory !== 'all' && s.category !== selectedCategory) return false
        if (q && ![s.name, s.type, s.category, s.location, s.description, ...(s.tags || [])].some((v) => String(v).toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => (b.rating || 0) * Math.log((b.reviewCount || 1) + 1) - (a.rating || 0) * Math.log((a.reviewCount || 1) + 1))
  }, [suppliers, selectedCategory, searchTerm])

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return t('allSuppliers')
    const cat = categoryCatalog.find((c) => c.id === selectedCategory)
    return t('suppliersInCategory', { category: t(cat?.key || 'categoryFmcg') })
  }, [selectedCategory, t])

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" aria-label="Breadcrumb">
            <span>{t('shopOwner')}</span>
            <span aria-hidden="true">›</span>
            <span className="text-slate-700">{t('suppliers')}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('findSuppliers')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('findSuppliersDescription')}</p>
        </div>

        <div className="hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-semibold" aria-hidden="true">
          <div className="flex flex-col leading-tight">
            <span>Source Local</span>
            <span>Stock Local</span>
            <span className="text-emerald-700 font-extrabold">Grow Local</span>
          </div>
        </div>
      </div>

      {/* ── Category carousel / selector ── */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('shopByCategory')}</span>
        <div className="flex gap-3 overflow-x-auto pb-2" role="list">
          {categoryCatalog.map((cat) => {
            const isActive = selectedCategory === cat.id
            const colors = categoryColors[cat.icon] || categoryColors.fmcg
            return (
              <button
                key={cat.id}
                type="button"
                role="listitem"
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer min-w-[120px] shrink-0 ${
                  isActive 
                    ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                }`}
                onClick={() => setSelectedCategory(isActive ? 'all' : cat.id)}
                aria-pressed={isActive}
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-xl mb-2 text-lg"
                  style={{ background: colors.bg, color: colors.color }}
                >
                  <CategoryIcon type={cat.icon} />
                </span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{t(cat.key)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search toolbar & results header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {activeCategoryLabel} <span className="text-xs font-semibold text-slate-400">({filteredSuppliers.length} suppliers)</span>
          </h2>
        </div>

        <label className="relative sm:w-80 flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all" htmlFor="sdc-search">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="16" height="16" className="text-slate-400 mr-2 shrink-0">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
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
        <p className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">No suppliers are available right now.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
