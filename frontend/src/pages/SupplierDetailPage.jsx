import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductSummaryCard from '../components/ProductSummaryCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplier } from '../services/catalogService.js'

function getSupplierInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'S'
}

export default function SupplierDetailPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')

  useEffect(() => {
    setIsLoading(true)
    setError('')
    setNotFound(false)
    setSupplier(null)
    setProducts([])
    getSupplier(supplierId)
      .then((response) => {
        setSupplier(response.data?.supplier || null)
        setProducts(Array.isArray(response.data?.products) ? response.data.products : [])
      })
      .catch((requestError) => {
        if (requestError.status === 404) setNotFound(true)
        else setError(requestError.message)
      })
      .finally(() => setIsLoading(false))
  }, [supplierId])

  const categories = useMemo(() => ['All categories', ...new Set(products.map((product) => product.category))], [products])
  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesQuery = `${product.name} ${product.brand}`.toLowerCase().includes(query.toLowerCase())
        return matchesQuery && (category === 'All categories' || product.category === category)
      }),
    [category, query, products],
  )

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="supplier-detail-page"><p className="form-message error" role="alert">{error}</p></section>
  if (notFound) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />
  if (!supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  const initials = getSupplierInitials(supplier.name)
  const featuredProducts = visibleProducts.slice(0, 3)

  return (
    <section className="supplier-detail-page">
      <div className="supplier-detail-breadcrumb">
        Shop Owner <span>→</span> Suppliers <span>→</span> {supplier.name}
      </div>

      <div className="supplier-profile-panel">
        <div className="supplier-profile-header">
          <div className="supplier-profile-avatar" aria-hidden="true">{initials}</div>

          <div className="supplier-profile-copy">
            <div className="supplier-profile-heading-row">
              <span className="supplier-profile-category">{supplier.category}</span>
              {supplier.isVerified && <span className="supplier-verified-badge">Verified Supplier</span>}
            </div>
            <h1>{supplier.name}</h1>
            <p>{supplier.description}</p>

            <div className="supplier-profile-meta-row">
              <span className="supplier-meta-pill">📍 {supplier.location || '—'}</span>
              <span className="supplier-meta-pill">{supplier.serviceAreaCount ?? supplier.serviceAreas?.length ?? 0} service areas</span>
              <span className="supplier-meta-pill">{supplier.rating == null ? 'Not rated' : `⭐ ${Number(supplier.rating).toFixed(1)} (${supplier.reviewCount || 0} reviews)`}</span>
            </div>
          </div>
        </div>

        <div className="supplier-profile-actions">
          <Link className="button primary supplier-primary-action" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>
            View products
          </Link>
          <Link className="button secondary supplier-secondary-action" to="/dashboard/shop-owner/suppliers">
            Back to suppliers
          </Link>
        </div>
      </div>

      <div className="supplier-profile-stats">
        <div className="supplier-stat-box">
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="supplier-stat-box">
          <span>Rating</span>
          <strong>{supplier.rating == null ? '—' : Number(supplier.rating).toFixed(1)}</strong>
        </div>
        <div className="supplier-stat-box">
          <span>Service area</span>
          <strong>{supplier.serviceAreaCount || supplier.serviceAreas?.length || 0}</strong>
        </div>
        <div className="supplier-stat-box">
          <span>Minimum order</span>
          <strong>{supplier.minimumOrder || '—'}</strong>
        </div>
      </div>

      <div className="supplier-profile-grid">
        <section className="supplier-profile-info-card">
          <div className="supplier-card-label">About supplier</div>
          <h2>{supplier.category}</h2>
          <p>{supplier.description}</p>
          <div className="supplier-profile-detail-list">
            <div>
              <span>Business type</span>
              <strong>{supplier.category}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{supplier.location || '—'}</strong>
            </div>
            <div>
              <span>Minimum order</span>
              <strong>{supplier.minimumOrder || '—'}</strong>
            </div>
          </div>
        </section>

        <section className="supplier-profile-info-card">
          <div className="supplier-card-label">Service coverage</div>
          <h2>Local delivery areas</h2>
          <div className="service-area-list">
            {(supplier.serviceAreas || []).map((area) => (
              <span key={area}>{area}</span>
            ))}
            {!supplier.serviceAreas?.length && <span>—</span>}
          </div>
        </section>
      </div>

      <section className="supplier-products-panel">
        <div className="supplier-products-header">
          <div>
            <div className="supplier-card-label">Products</div>
            <h2>{products.length} products available</h2>
          </div>
          <Link className="button secondary" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>
            Browse all products
          </Link>
        </div>

        <div className="product-tools">
          <label className="product-search">
            <span className="sr-only">{t('searchProductsLabel')}</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchProductsLabel')} type="search" value={query} />
          </label>
          <label className="category-filter">
            <span className="sr-only">{t('filterByCategoryLabel')}</span>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {visibleProducts.length ? (
          <div className="product-summary-list">
            {featuredProducts.map((product) => (
              <Link key={product.id} className="product-summary-card-link" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products/${product.id}`}>
                <ProductSummaryCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t('noProductsFound')} message={t('tryDifferentProductNameOrCategory')} />
        )}
      </section>
    </section>
  )
}
