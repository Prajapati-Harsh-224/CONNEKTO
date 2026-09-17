import { useEffect, useMemo, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
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
  if (error) {
    return (
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl font-bold text-slate-900">{t('productsUnavailable')}</h1>
        <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">{t('gruhUdyogWorkspace')}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('productListing')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('manageCatalogVisible')}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          aria-label={t('searchProducts')}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-xs"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchProducts')}
          type="search"
          value={query}
        />
      </div>

      {/* Product Grid */}
      {visibleProducts.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
            >
              <div className="relative h-44 w-full bg-slate-50 overflow-hidden">
                <ProductImage
                  alt={`${product.name} product`}
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()}
                  src={product.imageUrl || product.imageLabel || ''}
                />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{product.category}</span>
                <h3 className="text-base font-bold text-slate-800 line-clamp-1 mt-0.5">{product.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-3">{product.brand}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-3">
                  <div>Pack size <strong className="block text-slate-800 font-semibold">{product.packSize}</strong></div>
                  <div>Min qty <strong className="block text-slate-800 font-semibold">{product.minimumQuantity}</strong></div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-slate-900">
                    Rs {Number(product.price).toLocaleString('en-IN')}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg border border-purple-200">
                    {t('availableForOrders')}
                  </span>
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
