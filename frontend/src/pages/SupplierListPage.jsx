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
    <span className="sdc-verified-badge" aria-label="Verified Supplier">
      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="11" height="11">
        <circle cx="7" cy="7" r="6.5" fill="#1a7a3c" />
        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified Supplier
    </span>
  )
}

// ---------------------------------------------------------------------------
// StarRating sub-component
// ---------------------------------------------------------------------------
function StarRating({ rating, reviewCount }) {
  return (
    <div className="sdc-rating-row">
      {rating == null ? (
        <span className="sdc-review-count">Not rated</span>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="#F59E0B" aria-hidden="true" width="14" height="14">
            <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.133L8 10.5l-3.708 2.085L5 8.452 2 5.528l4.146-.772L8 1z" />
          </svg>
          <span className="sdc-rating-value">{rating.toFixed(1)}</span>
          <span className="sdc-review-count">({reviewCount} reviews)</span>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LocationPin icon
// ---------------------------------------------------------------------------
function LocationPinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13" className="sdc-loc-icon">
      <path d="M8 14s5-4.3 5-8.5a5 5 0 1 0-10 0C3 9.7 8 14 8 14Z" stroke="#6b7280" strokeWidth="1.4" />
      <circle cx="8" cy="5.5" r="1.5" stroke="#6b7280" strokeWidth="1.4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// HeartButton sub-component
// ---------------------------------------------------------------------------
function HeartButton({ isFavorite, name, onClick }) {
  return (
    <button
      type="button"
      className={`sdc-heart-btn${isFavorite ? ' active' : ''}`}
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
    <article className="sdc-card">
      <HeartButton
        isFavorite={isFavorite}
        name={supplier.name}
        onClick={(e) => {
          e.preventDefault()
          onToggleFavorite(supplier.id)
        }}
      />

      <div className="sdc-card-top">
        <div className="sdc-avatar" style={{ background: bg }} aria-hidden="true">
          {initials}
        </div>
        <div className="sdc-card-identity">
          <div className="sdc-name-row">
            <h3 className="sdc-name">{supplier.name}</h3>
            {supplier.isVerified && <VerifiedBadge />}
          </div>
          <span className="sdc-type">{supplier.type}</span>
          {(supplier.location || supplier.serviceAreas?.[0]) && (
            <div className="sdc-location-sub" style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              📍 {supplier.location || supplier.serviceAreas?.[0]}
            </div>
          )}
        </div>
      </div>

      <p className="sdc-description">{supplier.description}</p>

      <div className="sdc-tag-row">
        {(supplier.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className="sdc-tag">{tag}</span>
        ))}
      </div>

      <div className="sdc-card-footer">
        <Link
          className="sdc-view-btn"
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
    <section className="sdc-page">

      {/* ── Page header ── */}
      <div className="sdc-page-header">
        <div className="sdc-page-header-copy">
          <nav className="sdc-breadcrumb" aria-label="Breadcrumb">
            <span>{t('shopOwner')}</span>
            <span className="sdc-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">{t('suppliers')}</span>
          </nav>
          <h1 className="sdc-heading">{t('findSuppliers')}</h1>
          <p className="sdc-subheading">{t('findSuppliersDescription')}</p>
        </div>
        <div className="sdc-hero-banner" aria-hidden="true">
          <div className="sdc-hero-icon">
            <svg viewBox="0 0 56 56" fill="none" width="56" height="56" aria-hidden="true">
              <rect x="8" y="28" width="40" height="22" rx="3" fill="#2E7D32" opacity=".15" />
              <rect x="14" y="20" width="28" height="30" rx="2" fill="#2E7D32" opacity=".25" />
              <rect x="20" y="14" width="16" height="36" rx="2" fill="#2E7D32" opacity=".45" />
              <path d="M24 40h8M24 35h8M26 30h4" stroke="#1a5c1e" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M28 14v-4M24 12l4-4 4 4" stroke="#1a5c1e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="sdc-hero-text">
            <div>Source Local</div>
            <div>Stock Local</div>
            <div>Grow Local</div>
          </div>
        </div>
      </div>

      {/* ── Category carousel ── */}
      <div className="sdc-category-section">
        <div className="sdc-category-label">{t('shopByCategory')}</div>
        <div className="sdc-category-list" role="list">
          {categoryCatalog.map((cat) => {
            const isActive = selectedCategory === cat.id
            const colors = categoryColors[cat.icon] || categoryColors.fmcg
            return (
              <button
                key={cat.id}
                type="button"
                role="listitem"
                className={`sdc-cat-card${isActive ? ' active' : ''}`}
                onClick={() => setSelectedCategory(isActive ? 'all' : cat.id)}
                aria-pressed={isActive}
              >
                <span
                  className="sdc-cat-icon"
                  style={{ background: colors.bg, color: colors.color }}
                >
                  <CategoryIcon type={cat.icon} />
                </span>
                <span className="sdc-cat-name">{t(cat.key)}</span>
                <span className="sdc-cat-desc">
                  {categoryDescriptions[cat.id]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results header ── */}
      <div className="sdc-results-header">
        <h2 className="sdc-results-heading">
          {activeCategoryLabel}
          <span className="sdc-results-count">({filteredSuppliers.length} suppliers)</span>
        </h2>
      </div>

      {/* ── Search toolbar ── */}
      <div className="sdc-toolbar">
        <label className="sdc-search-field" htmlFor="sdc-search">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="16" height="16" className="sdc-search-icon">
            <circle cx="9" cy="9" r="5.5" stroke="#9ca3af" strokeWidth="1.6" />
            <path d="m13 13 3.5 3.5" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
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
        <p className="form-message error sdc-error" role="alert">{error}</p>
      )}

      {!error && !isLoading && suppliers.length === 0 && (
        <p className="form-message info sdc-empty-message">No suppliers are available right now.</p>
      )}

      {/* ── Supplier grid ── */}
      {filteredSuppliers.length === 0 ? (
        <div className="sdc-empty-state">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" width="48" height="48">
            <circle cx="24" cy="24" r="22" stroke="#e5e7eb" strokeWidth="2" />
            <path d="M16 24h16M24 16v16" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>{t('noSuppliers')}</p>
        </div>
      ) : (
        <div className="sdc-grid">
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
