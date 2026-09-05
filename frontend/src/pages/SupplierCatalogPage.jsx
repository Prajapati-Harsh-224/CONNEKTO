import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierProducts } from '../services/catalogService.js'

export default function SupplierCatalogPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')

  useEffect(() => {
    getSupplierProducts(supplierId).then((response) => { setSupplier(response.data.supplier); setProducts(response.data.products) }).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [supplierId])

  const categories = useMemo(() => ['All categories', ...new Set(products.map((product) => product.category))], [products])
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'All categories' || product.category === category)
  }), [category, query, products])

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="catalog-page"><p className="form-message error" role="alert">{error}</p></section>
  if (!supplier) return <EmptyState title={t('catalogUnavailable')} message={t('supplierCatalogMessage')} />

  return <section className="catalog-page">
    <Link className="back-link" to={`/dashboard/shop-owner/suppliers/${supplier.id}`}>← {t('backToCatalog', { supplier: supplier.name })}</Link>
    <div className="catalog-heading"><div><div className="eyebrow">{t('supplierCatalog')}</div><h1>{supplier.name}</h1><p className="muted">{t('productSummaryInfo')}</p></div><span className="summary-period">{products.length} {t('shownCounter', { count: products.length })}</span></div>
    <div className="catalog-tools"><label className="product-search"><span className="sr-only">{t('searchProductsLabel')}</span><input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchByProductBrandCategory')} type="search" value={query} /></label><label className="category-filter"><span className="sr-only">{t('filterByCategoryLabel')}</span><select onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    {visibleProducts.length ? <div className="catalog-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} supplierId={supplier.id} />)}</div> : <EmptyState title={t('noProductsFoundTitle')} message={t('tryDifferentProductNameOrCategory')} />}
  </section>
}
