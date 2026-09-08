import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSuppliers } from '../services/catalogService.js'

const categoryCatalog = [
  { id: 'FMCG', key: 'categoryFmcg', icon: 'fmcg' },
  { id: 'Grocery & Staples', key: 'categoryGrocery', icon: 'groceries' },
  { id: 'Beverages', key: 'categoryBeverages', icon: 'beverage' },
  { id: 'Personal Care', key: 'categoryPersonalCare', icon: 'personal' },
  { id: 'Cleaning & Household', key: 'categoryCleaning', icon: 'cleaning' },
  { id: 'Dairy & Bakery', key: 'categoryDairy', icon: 'dairy' },
  { id: 'Snacks & Packaged Foods', key: 'categorySnacks', icon: 'snacks' },
  { id: 'Local Manufacturers', key: 'categoryLocal', icon: 'local' },
]

const categoryIcons = {
  fmcg: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8.5h14l-1.2 10.3A2 2 0 0 1 15.9 20H8.1a2 2 0 0 1-2-1.2L5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 1 1 6 0v1.5" />
      <path d="M9.5 12.5h5" />
    </svg>
  ),
  groceries: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 8.5h15l-1.2 10.2a2 2 0 0 1-2 1.8H7.7a2 2 0 0 1-2-1.8L4.5 8.5Z" />
      <path d="M8 8.5V7a4 4 0 0 1 8 0v1.5" />
      <path d="M9 11.5c.9 0 1.6-.7 1.6-1.5S9.9 8.5 9 8.5 7.4 9.2 7.4 10s.7 1.5 1.6 1.5Zm5 0c.9 0 1.6-.7 1.6-1.5S14.9 8.5 14 8.5s-1.6.7-1.6 1.5.7 1.5 1.6 1.5Z" />
    </svg>
  ),
  beverage: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h8l-1 13.5a2 2 0 0 1-2 1.8h-2a2 2 0 0 1-2-1.8L8 4.5Z" />
      <path d="M9.5 8.5h5" />
      <path d="M12 18.5v2.5" />
    </svg>
  ),
  personal: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4v4.5H8v-4.5Z" />
      <path d="M9.5 8.5V7.8A2.5 2.5 0 0 1 12 5.3a2.5 2.5 0 0 1 2.5 2.5v.7" />
      <path d="M5.5 18.5h13" />
    </svg>
  ),
  cleaning: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.8 4.5h6.4l1.2 9.1a3.8 3.8 0 0 1-3.8 4.4 3.8 3.8 0 0 1-3.8-4.4l1.2-9.1Z" />
      <path d="M9 9.5h6" />
      <path d="M12 4.5v-2" />
    </svg>
  ),
  dairy: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8.5h10l-1 11.5H8L7 8.5Z" />
      <path d="M9 8.5V6.8A3 3 0 0 1 12 4a3 3 0 0 1 3 2.8v1.7" />
      <path d="M10 12.5h4" />
    </svg>
  ),
  snacks: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 11.5h12l-1.2 7.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 11.5Z" />
      <path d="M8 11.5V8.5A4 4 0 0 1 12 4.5a4 4 0 0 1 4 4v3" />
      <path d="M9.5 15.5h5" />
    </svg>
  ),
  local: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 18.5h15" />
      <path d="M6.5 18.5V9.5h11v9" />
      <path d="M9 9.5V6.5h6v3" />
      <path d="M10 13.5h4" />
    </svg>
  )
}

function getSupplierInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'S'
}

function getAvatarColors(name = '') {
  const palette = ['#1f2937', '#5c6a7f', '#7a7d9d', '#a46f74', '#5d7b73', '#7f8a65', '#de8f66', '#b690c7']
  const index = name.charCodeAt(0) % palette.length
  return palette[index]
}

export default function SupplierListPage() {
  const { t } = useLocale()
  const [suppliers, setSuppliers] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [serviceAreaFilter, setServiceAreaFilter] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [favorites, setFavorites] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSuppliers = useCallback(() => {
    setIsLoading(true)
    setError('')
    getSuppliers()
      .then((response) => setSuppliers(response?.data?.suppliers || []))
      .catch((requestError) => setError(requestError?.message || t('supplierLoadError')))
      .finally(() => setIsLoading(false))
  }, [t])

  useEffect(() => { loadSuppliers() }, [loadSuppliers])

  const filteredSuppliers = useMemo(() => {
    if (!suppliers.length) return []

    const normalizedSearch = searchTerm.trim().toLowerCase()

    return [...suppliers]
      .filter((supplier) => {
        const categoryMatches = selectedCategory === 'all' || supplier.category === selectedCategory || (supplier.tags || []).includes(selectedCategory)
        const searchMatches = !normalizedSearch || [supplier.name, supplier.category, supplier.location, supplier.description, ...(supplier.tags || [])].some((value) => String(value).toLowerCase().includes(normalizedSearch))
        const locationMatches = locationFilter === 'all' || (supplier.location || '').toLowerCase().includes(locationFilter.toLowerCase())
        const serviceAreaMatches = serviceAreaFilter === 'all' || (() => {
          const count = Number(supplier.serviceAreaCount || supplier.serviceAreas?.length || 0)
          if (serviceAreaFilter === '1-3') return count >= 1 && count <= 3
          if (serviceAreaFilter === '4-6') return count >= 4 && count <= 6
          if (serviceAreaFilter === '7+') return count >= 7
          return true
        })()

        return categoryMatches && searchMatches && locationMatches && serviceAreaMatches
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0)
        if (sortBy === 'service') return Number(b.serviceAreaCount || b.serviceAreas?.length || 0) - Number(a.serviceAreaCount || a.serviceAreas?.length || 0)
        if (sortBy === 'name') return String(a.name).localeCompare(String(b.name))
        return Number(b.rating || 0) * (Number(b.reviewCount || 0) || 1) - Number(a.rating || 0) * (Number(a.reviewCount || 0) || 1)
      })
  }, [locationFilter, searchTerm, selectedCategory, serviceAreaFilter, sortBy, suppliers])

  if (isLoading) return <LoadingState message={t('loadingWorkspace') || 'Loading suppliers...'} />
  if (error) return <section className="supplier-discovery-page"><div className="supplier-discovery-header"><div className="supplier-crumb">{t('shopOwner')} <span>→</span> {t('suppliers')}</div><h1>{t('findSuppliers')}</h1></div><p className="form-message error" role="alert">{error}</p><button className="button secondary supplier-retry-button" type="button" onClick={loadSuppliers}>{t('tryAgain')}</button></section>

  return (
    <section className="supplier-discovery-page">
      <div className="supplier-discovery-header">
        <div className="supplier-discovery-copy">
          <div className="supplier-crumb">{t('shopOwner')} <span>→</span> {t('suppliers')}</div>
          <h1>{t('findSuppliers')}</h1>
          <p>{t('findSuppliersDescription')}</p>
        </div>
      </div>

      <div className="supplier-category-panel">
        <div className="supplier-panel-title">{t('shopByCategory')}</div>
        <div className="supplier-category-grid">
          {categoryCatalog.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`supplier-category-card${selectedCategory === category.id ? ' active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="supplier-category-icon">{categoryIcons[category.id.replace(/[^a-z]/g, '').toLowerCase()] || categoryIcons.fmcg}</span>
              <span className="supplier-category-label">{t(category.key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="supplier-toolbar">
        <label className="supplier-search-field" htmlFor="supplier-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
          <input id="supplier-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('searchSuppliersByName')} type="text" />
        </label>

        <label className="supplier-filter-field" htmlFor="supplier-location">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>
          <select id="supplier-location" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">{t('allLocations')}</option>
            <option value="Ahmedabad">Ahmedabad</option>
          </select>
        </label>

        <label className="supplier-filter-field" htmlFor="supplier-service-area">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5h16M6.5 6.5h11v11h-11z"/><path d="M9 17.5v-7.5M15 17.5v-7.5"/></svg>
          <select id="supplier-service-area" value={serviceAreaFilter} onChange={(event) => setServiceAreaFilter(event.target.value)}>
            <option value="all">{t('serviceAreaFilter')}</option>
            <option value="1-3">{t('serviceAreasOneToThree')}</option>
            <option value="4-6">{t('serviceAreasFourToSix')}</option>
            <option value="7+">{t('serviceAreasSevenPlus')}</option>
          </select>
        </label>

        <label className="supplier-filter-field supplier-sort-field" htmlFor="supplier-sort">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 12h7M7 17h4"/><path d="M17 14v5l2 2"/></svg>
          <select id="supplier-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="relevance">{t('sortByRelevance')}</option>
            <option value="rating">{t('sortByRating')}</option>
            <option value="service">{t('sortByServiceArea')}</option>
            <option value="name">{t('sortByName')}</option>
          </select>
        </label>
      </div>

      <div className="supplier-results-header">
        <h2>
          {selectedCategory === 'all' ? t('allSuppliers') : t('suppliersInCategory', { category: t(categoryCatalog.find((category) => category.id === selectedCategory)?.key || 'categoryFmcg') })}
          <span> ({filteredSuppliers.length} {t('suppliers').toLowerCase()})</span>
        </h2>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="supplier-empty-state">{t('noSuppliers')}</div>
      ) : (
        <div className="supplier-cards-grid">
          {filteredSuppliers.map((supplier) => {
            const initials = getSupplierInitials(supplier.name)
            const isFavorite = Boolean(favorites[supplier.id])

            return (
              <article className="supplier-card" key={supplier.id}>
                <div className="supplier-card-head">
                  <div className="supplier-avatar" style={{ background: getAvatarColors(supplier.name) }} aria-hidden="true">{initials}</div>
                  <div className="supplier-card-main">
                    <div className="supplier-name-row">
                      <h3>{supplier.name}</h3>
                      {supplier.isVerified && <span className="supplier-verified-badge">Verified Supplier</span>}
                    </div>
                    <div className="supplier-card-type">{supplier.category}</div>
                  </div>
                  <button
                    type="button"
                    className={`supplier-favorite${isFavorite ? ' active' : ''}`}
                    aria-label={isFavorite ? `Remove ${supplier.name} from favorites` : `Add ${supplier.name} to favorites`}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setFavorites((current) => ({ ...current, [supplier.id]: !current[supplier.id] }))
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.3-4.6-9.2-8.8C1.4 8.8 3.5 4.5 7.7 4.5c2 0 3.1 1.1 4.3 2.7 1.2-1.6 2.3-2.7 4.3-2.7 4.2 0 6.3 4.3 4.9 7.2-1.9 4.2-9.2 8.8-9.2 8.8Z" /></svg>
                  </button>
                </div>

                <div className="supplier-meta-row">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>
                  {supplier.location && <><span>{supplier.location}</span><span className="supplier-dot">•</span></>}
                  {supplier.serviceAreaCount ? <span>{supplier.serviceAreaCount} {t('serviceAreas').toLowerCase()}</span> : null}
                </div>

                <p className="supplier-description">{supplier.description}</p>

                {supplier.rating && supplier.reviewCount ? <div className="supplier-rating-row"><span className="supplier-star">★</span><span>{Number(supplier.rating).toFixed(1)}</span><span className="supplier-review-copy">({supplier.reviewCount} {t('reviews')})</span></div> : null}

                <div className="supplier-tag-row">
                  {(supplier.tags || []).slice(0, 3).map((tag) => (
                    <span key={`${supplier.id}-${tag}`} className="supplier-tag">{tag}</span>
                  ))}
                </div>

                <div className="supplier-card-footer">
                  {supplier.minimumOrder && <span className="supplier-price">{supplier.minimumOrder}</span>}
                  <Link className="button supplier-view-button" to={`/dashboard/shop-owner/suppliers/${supplier.id}`}>
                    View Supplier <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
