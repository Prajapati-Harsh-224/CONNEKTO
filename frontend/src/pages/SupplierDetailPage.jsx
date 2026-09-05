import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductSummaryCard from '../components/ProductSummaryCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplier } from '../services/catalogService.js'

export default function SupplierDetailPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')

  useEffect(() => {
    getSupplier(supplierId).then((response) => { setSupplier(response.data.supplier); setProducts(response.data.products) }).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [supplierId])

  const categories = useMemo(() => ['All categories', ...new Set(products.map((product) => product.category))], [products])
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.brand}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'All categories' || product.category === category)
  }), [category, query, products])

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="supplier-detail-page"><p className="form-message error" role="alert">{error}</p></section>
  if (!supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  return <section className="supplier-detail-page">
    <Link className="back-link" to="/dashboard/shop-owner/suppliers">← {t('suppliers')}</Link>
    <div className="supplier-hero">
      <div className="supplier-avatar" aria-hidden="true">{supplier.name.slice(0, 1)}</div>
      <div className="supplier-heading"><div className="eyebrow">{t('supplierProfile')}</div><h1>{supplier.name}</h1><p className="muted">{supplier.description}</p></div>
    </div>
    <div className="supplier-actions"><Link className="button primary" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>{t('browseProductsAction')}</Link><span className="supplier-status"><span className="status-dot" aria-hidden="true" /> {t('availableForOrdersLabel')}</span></div>
    <div className="supplier-info-grid">
      <section className="supplier-info-panel"><span className="section-kicker">{t('businessInformation')}</span><h2>{supplier.category}</h2><dl><div><dt>{t('minimumOrder')}</dt><dd>{supplier.minimumOrder}</dd></div><div><dt>{t('contact')}</dt><dd>{supplier.phone}</dd></div></dl></section>
      <section className="supplier-info-panel"><span className="section-kicker">{t('serviceAreas')}</span><h2>{t('localDeliveryCoverage')}</h2><div className="service-area-list">{supplier.serviceAreas.length ? supplier.serviceAreas.map((area) => <span key={area}>{area}</span>) : <span>{t('catalogUnavailable')}</span>}</div></section>
    </div>
    <section className="supplier-products" id="supplier-products"><div className="section-heading"><div><span className="section-kicker">{t('productSummary')}</span><h2>{t('productCountAvailable', { count: products.length })}</h2></div><span className="summary-period">{t('catalogPreview')}</span></div><div className="product-tools"><label className="product-search"><span className="sr-only">{t('searchProductsLabel')}</span><input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchProductsLabel')} type="search" value={query} /></label><label className="category-filter"><span className="sr-only">{t('filterByCategoryLabel')}</span><select onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>{visibleProducts.length ? <div className="product-summary-list">{visibleProducts.map((product) => <ProductSummaryCard key={product.id} product={product} />)}</div> : <EmptyState title={t('noProductsFound')} message={t('tryDifferentProductNameOrCategory')} />}</section>
  </section>
}
