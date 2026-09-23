import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { deactivateSupplierProduct, getSupplierProducts } from '../services/supplierProductService.js'

function formatPrice(value) {
  return `Rs\u00A0${Number(value || 0).toLocaleString('en-IN')}`
}

export default function SupplierProductManagementPage() {
  const { t } = useLocale()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(location.state?.feedback || '')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All categories')
  const [sortBy, setSortBy] = useState('popular')

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    getSupplierProducts()
      .then((response) => setProducts(response.data.products || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return ['All categories', ...uniqueCategories.sort((first, second) => first.localeCompare(second))]
  }, [products])

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return [...products]
      .filter((product) => {
        const matchesQuery = !normalizedQuery || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedQuery)
        const matchesCategory = activeCategory === 'All categories' || product.category === activeCategory
        return matchesQuery && matchesCategory
      })
      .sort((first, second) => {
        if (sortBy === 'price-low') return Number(first.price) - Number(second.price)
        if (sortBy === 'price-high') return Number(second.price) - Number(first.price)
        if (sortBy === 'name') return String(first.name).localeCompare(String(second.name))
        return 0
      })
  }, [activeCategory, products, query, sortBy])


  async function deactivateProduct(product) {
    setFeedback('')
    try {
      const response = await deactivateSupplierProduct(product.id)
      setProducts((current) => current.map((item) => item.id === product.id ? response.data.product : item))
      setFeedback(t('productDeactivatedMessage', { product: product.name }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingYourProducts')} />
  if (error && !products.length) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('supplierWorkspace')}</div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('productsUnavailable')}</h1>
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
      </section>
    )
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>{t('supplierWorkspace')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('products')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('yourProducts')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('manageCatalogVisible')}</p>
        </div>
        <Link 
          className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm shadow-xs hover:shadow transition-all self-start sm:self-auto cursor-pointer inline-flex items-center gap-1.5" 
          to="/dashboard/supplier/products/new"
        >
          + {t('addProduct')}
        </Link>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between" role="status">
          <span>{feedback}</span>
          <button className="text-emerald-600 hover:text-emerald-900 text-xs font-bold ml-2 cursor-pointer" onClick={() => setFeedback('')} type="button">{t('dismiss')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <aside className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-1 lg:sticky lg:top-20 self-start">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">{t('categoriesTitle')}</h2>
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer truncate shrink-0 lg:shrink ${
                  activeCategory === category 
                    ? 'bg-orange-50 text-brand-orange font-bold border border-orange-200/60' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <label className="relative flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
              <span className="text-slate-400 mr-2 text-base" aria-hidden="true">⌕</span>
              <input 
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                onChange={(event) => setQuery(event.target.value)} 
                placeholder={t('searchProducts')} 
                type="search" 
                value={query} 
              />
            </label>

            <label className="sm:w-52">
              <span className="sr-only">Sort products</span>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                onChange={(event) => setSortBy(event.target.value)} 
                value={sortBy}
              >
                <option value="popular">{t('popular')}</option>
                <option value="name">{t('sortName')}</option>
                <option value="price-low">{t('priceLowToHigh')}</option>
                <option value="price-high">{t('priceHighToLow')}</option>
              </select>
            </label>

            <button
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
              onClick={() => {
                setQuery('')
                setActiveCategory('All categories')
                setSortBy('popular')
              }}
              type="button"
            >
              {t('clear')}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-500 px-1">
            <h2 className="font-bold text-slate-800">{visibleProducts.length} {t('products')}</h2>
            <span>{query ? t('filteredByQuery', { query }) : t('showingAllProducts')}</span>
          </div>

          {visibleProducts.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {visibleProducts.map((product) => (
                <article 
                  className={`group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all ${
                    product.isActive ? '' : 'opacity-70 bg-slate-50/50'
                  }`} 
                  key={product.id}
                >
                  <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center">
                    <ProductImage
                      alt={`${product.name} product`}
                      aria-hidden="true"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()}
                      src={product.imageUrl || ''}
                    />
                  </div>

                  <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{product.category || 'General'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          product.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {product.isActive ? t('active') : t('inactive')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-brand-orange transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mb-3 truncate" title={`${product.brand} · ${product.packSize}`}>
                        {product.brand} · {product.packSize}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-y border-slate-100 font-medium">
                        <span>{t('minStock', { minimum: product.minimumQuantity, stock: product.availableStock ?? 0 })}</span>
                        <strong className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                          {formatPrice(product.price)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link 
                          className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-brand-orange hover:bg-orange-50 hover:text-brand-orange text-xs font-bold text-slate-700 transition-all cursor-pointer text-center inline-flex items-center justify-center whitespace-nowrap" 
                          to={`/dashboard/supplier/products/${product.id}/edit`}
                        >
                          {t('edit')}
                        </Link>
                        {product.isActive && (
                          <button 
                            className="flex-1 py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer text-center inline-flex items-center justify-center whitespace-nowrap" 
                            onClick={() => deactivateProduct(product)} 
                            type="button"
                          >
                            {t('deactivate')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noProductsFound')} message={t('tryDifferentSearch')} />
          )}
        </div>
      </div>
    </section>
  )
}
