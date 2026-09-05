import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogProducts } from '../services/gruhUdyogService.js'

export default function GruhUdyogProductsPage() {
  const { t } = useLocale()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGruhUdyogProducts()
      .then((response) => setProducts(response.data.products))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const visibleProducts = useMemo(() => products.filter((product) => {
    const search = `${product.name} ${product.brand} ${product.category}`.toLowerCase()
    return search.includes(query.toLowerCase())
  }), [products, query])

  if (isLoading) return <LoadingState message={t('loadingProducts')} />
  if (error) return <section className="catalog-page"><div className="eyebrow">{t('gruhUdyogWorkspace')}</div><h1>{t('productsUnavailable')}</h1><p className="form-message error" role="alert">{error}</p></section>

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <div className="eyebrow">{t('gruhUdyogWorkspace')}</div>
          <h1>{t('productListing')}</h1>
          <p className="muted">{t('manageCatalogVisible')}</p>
        </div>
      </div>
      <div className="catalog-tools">
        <label className="product-search">
          <span className="sr-only">{t('searchProducts')}</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchProducts')} type="search" value={query} />
        </label>
      </div>
      {visibleProducts.length ? (
        <div className="catalog-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <ProductImage alt={`${product.name} product`} aria-hidden="true" className="product-image" fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()} src={product.imageUrl || product.imageLabel || ''} />
              <div className="product-card-body">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="product-brand">{product.brand}</p>
                <div className="product-specs">
                  <span>Pack size<strong>{product.packSize}</strong></span>
                  <span>Min qty<strong>{product.minimumQuantity}</strong></span>
                </div>
                <div className="product-card-footer">
                  <span className="product-price">Rs {Number(product.price).toLocaleString('en-IN')}</span>
                  <button className="button secondary add-to-cart-button" type="button">{t('availableForOrders')}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={t('noProductsListed')} message={t('tryDifferentSearch')} />
      )}
    </section>
  )
}
