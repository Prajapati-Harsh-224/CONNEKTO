import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierProducts } from '../services/catalogService.js'
import { addToCart, getCart, updateCartItem } from '../utils/cartStorage.js'

const categoryOrder = ['All Products', 'Staples', 'Cooking Essentials', 'Beverages', 'Snacks & Biscuits', 'Personal Care', 'Cleaning & Household', 'Packaged Foods', 'Dairy & Bakery', 'More']

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function formatPrice(value) {
  return `Rs ${Number(value).toLocaleString('en-IN')}`
}

function SearchIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
}

function SupplierCatalogCard({ product, supplier, favorite, onFavorite, onAdd, onIncrement, onDecrement, cartItem }) {
  const { t } = useLocale()
  const unitsPerBox = Number(product.unitsPerBox || product.minimumQuantity || 1)
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox
  const quantityLabel = `${t('packetSingular')}`

  const availableStock = Number(product.availableStock ?? 0)
  const isAvailable = availableStock > 0

  const cartBoxes = cartItem ? Number(cartItem.boxes || Math.max(1, Math.round(Number(cartItem.quantity || unitsPerBox) / unitsPerBox))) : 0

  return (
    <article className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all ${!isAvailable ? 'opacity-70 bg-slate-50/50' : ''}`}>
      <button 
        className={`absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${favorite ? 'text-rose-500' : 'text-slate-300'}`} 
        type="button" 
        onClick={() => onFavorite(product.id)} 
        aria-label={favorite ? `Remove ${product.name} from favorites` : `Save ${product.name}`}
      >
        <svg viewBox="0 0 20 20" fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" width="18" height="18">
          <path d="M10 17.5S2 13 2 7a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 10.5-8 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="space-y-3">
        <Link className="block relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products/${product.id}`} aria-label={`View ${product.name}`}>
          <ProductImage className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={`${product.name} product`} fallbackText={product.imageLabel} src={product.imageUrl || product.imageLabel} />
        </Link>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{product.brand}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isAvailable 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {isAvailable ? t('available') : t('unavailable')}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate group-hover:text-brand-orange transition-colors" title={product.name}>
            {product.name}
          </h3>
          <span className="text-xs text-slate-500 font-medium block truncate">{product.packSize}</span>

          <div className="py-2 my-2 border-y border-slate-100 space-y-0.5">
            <div className="text-base sm:text-lg font-black text-slate-900">
              {formatPrice(unitPrice)} <small className="text-xs text-slate-400 font-normal">/ {t('packetSingular')}</small>
            </div>
            <div className="text-xs text-emerald-700 font-semibold truncate">
              1 {t('boxSingular')} = {unitsPerBox} {t('packetPlural')} ({formatPrice(boxPrice)}/{t('boxSingular')})
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        {!isAvailable ? (
          <button className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200" disabled type="button">
            {t('unavailable')}
          </button>
        ) : cartBoxes > 0 ? (
          <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-orange-50 border border-brand-orange/30">
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-brand-orange font-bold text-base shadow-xs hover:bg-orange-100 transition-colors disabled:opacity-40 cursor-pointer"
              disabled={cartBoxes <= 1}
              type="button"
              onClick={() => onDecrement(product)}
              aria-label={`Decrease quantity of ${product.name}`}
            >
              −
            </button>
            <span className="text-xs font-bold text-slate-900">{`${cartBoxes} ${cartBoxes === 1 ? 'Box' : 'Boxes'}`}</span>
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-brand-orange font-bold text-base shadow-xs hover:bg-orange-100 transition-colors cursor-pointer" 
              type="button" 
              onClick={() => onIncrement(product)} 
              aria-label={`Increase quantity of ${product.name}`}
            >
              +
            </button>
          </div>
        ) : (
          <button 
            className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5" 
            type="button" 
            onClick={() => onAdd(product)}
          >
            {t('addOneBox', { packets: unitsPerBox })}
          </button>
        )}
      </div>
    </article>
  )
}

function SupplierReviewsSection({ supplier }) {
  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      author: 'Ramesh Kirana Store',
      location: supplier.location || 'Punitnagar',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent supplier! Products are delivered fast and packed securely. High margin items for retail shops.'
    },
    {
      id: 'rev-2',
      author: 'Patel Supermarket',
      location: 'Ahmedabad',
      rating: 4,
      date: '1 week ago',
      comment: 'Reliable supplier for stock replenishment. Packaging was sturdy and delivery was on time.'
    },
    {
      id: 'rev-3',
      author: 'Shreeji Traders',
      location: 'Isanpur',
      rating: 5,
      date: '3 weeks ago',
      comment: 'Very reliable distribution desk. Always stocks authentic brands with fresh expiry dates.'
    }
  ])

  const { t } = useLocale()
  const [newRating, setNewRating] = useState(5)
  const [newAuthor, setNewAuthor] = useState('')
  const [newComment, setNewComment] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const avgRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1)

  function handleSubmitReview(e) {
    e.preventDefault()
    if (!newComment.trim()) return

    const createdReview = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() || 'Verified Shop Owner',
      location: supplier.location || 'Local Shop Owner',
      rating: newRating,
      date: 'Just now',
      comment: newComment.trim()
    }

    setReviews([createdReview, ...reviews])
    setNewAuthor('')
    setNewComment('')
    setNewRating(5)
    setSuccessMsg('Thank you! Your review has been published.')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Review summary box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col justify-center">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">{avgRating}</div>
          <div className="text-amber-400 text-lg my-2">
            {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
          </div>
          <div className="text-xs text-slate-400 font-medium">{t('basedOnReviews', { count: reviews.length })}</div>
        </div>

        <div className="flex flex-col justify-center space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length
            const percent = reviews.length ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-12 font-medium">{star} stars</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-6 text-right font-bold text-slate-800">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Review Form */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">{t('writeReviewFor', { supplier: supplier.name })}</h3>
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold" role="status">
            {successMsg}
          </div>
        )}
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('yourRating')}
            </label>
            <div className="flex gap-1 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className={`transition-colors cursor-pointer ${star <= newRating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rev-author" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('shopNameOrYourName')}
            </label>
            <input
              id="rev-author"
              className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="e.g. Laxmi Supermarket"
              type="text"
              value={newAuthor}
            />
          </div>

          <div>
            <label htmlFor="rev-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('reviewDetails')}
            </label>
            <textarea
              id="rev-comment"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('reviewPlaceholder')}
              rows={3}
              value={newComment}
            />
          </div>

          <button
            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            type="submit"
          >
            {t('submitReview')}
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">{t('customerFeedback', { count: reviews.length })}</h3>
        {reviews.map((rev) => (
          <div key={rev.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-slate-900">{rev.author}</strong>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{t('verifiedShop')}</span>
              </div>
              <span className="text-xs text-slate-400">{rev.date}</span>
            </div>
            <div className="text-amber-400 text-sm">
              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SupplierCatalogPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
  const allProductsLabel = t('allProducts')
  const allBrandsLabel = t('allBrands')
  const [activeTab, setActiveTab] = useState('products')
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(allProductsLabel)
  const [brand, setBrand] = useState(allBrandsLabel)
  const [sortBy, setSortBy] = useState('popular')
  const [favorites, setFavorites] = useState({})
  const [cartMessage, setCartMessage] = useState('')
  const [cart, setCart] = useState(getCart)

  useEffect(() => {
    const syncCart = () => setCart(getCart())
    window.addEventListener('connecto-cart-updated', syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener('connecto-cart-updated', syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')
    setNotFound(false)
    setSupplier(null)
    setProducts([])

    getSupplierProducts(supplierId)
      .then((response) => {
        if (!isMounted) return
        setSupplier(response.data?.supplier || null)
        setProducts((response.data?.products || []).filter((product) => product.supplierId === supplierId))
      })
      .catch((requestError) => {
        if (!isMounted) return
        if (requestError.status === 404) setNotFound(true)
        else setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [supplierId])

  const categories = useMemo(() => [t('allCategories'), ...new Set(products.map((product) => product.category))], [products, t])
  const brands = useMemo(() => [allBrandsLabel, ...new Set(products.map((product) => product.brand))], [products, allBrandsLabel])
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedQuery)
      const matchesCategory = category === allProductsLabel || category === t('allCategories') || product.category === category
      const matchesBrand = brand === allBrandsLabel || product.brand === brand
      return matchesQuery && matchesCategory && matchesBrand
    }).sort((first, second) => {
      if (sortBy === 'price-low') return first.price - second.price
      if (sortBy === 'price-high') return second.price - first.price
      if (sortBy === 'name') return first.name.localeCompare(second.name)
      return products.indexOf(first) - products.indexOf(second)
    })
  }, [brand, category, products, query, sortBy])

  function notifyCartUpdated() {
    window.dispatchEvent(new Event('connecto-cart-updated'))
  }

  function handleAdd(product) {
    const unitsPerBox = Math.max(1, Number(product.unitsPerBox || product.minimumQuantity || 1))
    const minBoxes = 1
    const actualQuantity = unitsPerBox

    addToCart({
      productId: product.id,
      supplierId: supplier.id,
      supplierName: supplier.name,
      serviceArea: (supplier.serviceAreas || []).join(', '),
      category: product.category,
      name: product.name,
      brand: product.brand,
      packSize: product.packSize,
      imageUrl: product.imageUrl || '',
      minimumQuantity: unitsPerBox,
      unitsPerBox: unitsPerBox,
      boxes: minBoxes,
      quantity: actualQuantity,
      unitPrice: product.price
    })
    notifyCartUpdated()
    const msg = t('addedToCart', { product: product.name })
    setCartMessage(msg)
    setTimeout(() => setCartMessage(''), 3000)
  }

  function handleIncrement(product) {
    const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
    if (!cartItem) {
      handleAdd(product)
      return
    }
    const currentBoxes = Number(cartItem.boxes || 1)
    const nextBoxes = currentBoxes + 1
    updateCartItem(product.id, supplier.id, nextBoxes)
    notifyCartUpdated()
  }

  function handleDecrement(product) {
    const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
    if (!cartItem) return

    const currentBoxes = Number(cartItem.boxes || 1)
    if (currentBoxes <= 1) {
      return
    }
    const nextBoxes = currentBoxes - 1
    updateCartItem(product.id, supplier.id, nextBoxes)
    notifyCartUpdated()
  }

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
    </section>
  )
  if (notFound || !supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link className="hover:text-slate-600 transition-colors" to="/dashboard/shop-owner/suppliers">{t('shopOwner')}</Link>
        <span aria-hidden="true">›</span>
        <Link className="hover:text-slate-600 transition-colors" to="/dashboard/shop-owner/suppliers">{t('suppliers')}</Link>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{supplier.name}</span>
      </div>

      <header className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-white font-black text-xl shrink-0 shadow-xs" aria-hidden="true">
          {getInitials(supplier.name)}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{supplier.name}</h1>
            {supplier.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ● {t('verifiedSupplier')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <strong className="text-brand-orange">{supplier.category}</strong>
            <span>•</span>
            <span>{supplier.location || '—'}</span>
            <span>•</span>
            <span>{Array.isArray(supplier.serviceAreas) && supplier.serviceAreas.length > 0 ? supplier.serviceAreas.join(', ') : (supplier.serviceAreaCount ? `${supplier.serviceAreaCount} service areas` : '—')}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{supplier.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
            <span>📞 {supplier.phone || '+91 98765 43210'}</span>
            {supplier.email && <span>✉️ {supplier.email}</span>}
          </div>
        </div>
      </header>

      <nav className="flex items-center gap-2 border-b border-slate-200" aria-label="Supplier sections">
        <button 
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'products' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`} 
          onClick={() => setActiveTab('products')} 
          type="button"
        >
          {t('products')}
        </button>
        <button 
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reviews' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`} 
          onClick={() => setActiveTab('reviews')} 
          type="button"
        >
          {t('reviews')}
        </button>
      </nav>

      {activeTab === 'products' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <label className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs sm:col-span-2 md:col-span-1 focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
              <span className="text-slate-400 mr-2 text-sm"><SearchIcon /></span>
              <input 
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                value={query} 
                onChange={(event) => setQuery(event.target.value)} 
                placeholder={t('searchInSupplier', { supplier: supplier.name })} 
              />
            </label>

            <select 
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium shadow-xs focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
              value={category} 
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All Products">{t('allCategories')}</option>
              {categories.filter((item) => item !== 'All Categories').map((item) => <option key={item}>{item}</option>)}
            </select>

            <select 
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium shadow-xs focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
              value={brand} 
              onChange={(event) => setBrand(event.target.value)}
            >
              {brands.map((item) => <option key={item}>{item}</option>)}
            </select>

            <select 
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium shadow-xs focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all cursor-pointer"
              value={sortBy} 
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="popular">{t('sortPopular')}</option>
              <option value="price-low">{t('sortPriceLow')}</option>
              <option value="price-high">{t('sortPriceHigh')}</option>
              <option value="name">{t('sortName')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
            <aside className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-1 lg:sticky lg:top-20 self-start">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">{t('categoriesLabel')}</h2>
              <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {categoryOrder.map((item) => (
                  <button 
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer truncate shrink-0 lg:shrink ${
                      (category === item || (item === 'All Products' && category === 'All Categories'))
                        ? 'bg-orange-50 text-brand-orange font-bold border border-orange-200/60' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`} 
                    key={item} 
                    type="button" 
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </aside>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-500 px-1">
                <strong className="text-slate-900">{t('productsCount', { count: visibleProducts.length })}</strong>
                {cartMessage && (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 text-xs" role="status">
                    {cartMessage}
                  </span>
                )}
              </div>

              {visibleProducts.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {visibleProducts.map((product) => {
                    const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
                    return (
                      <SupplierCatalogCard 
                        key={product.id} 
                        cartItem={cartItem} 
                        favorite={Boolean(favorites[product.id])} 
                        onAdd={handleAdd} 
                        onDecrement={handleDecrement} 
                        onFavorite={(id) => setFavorites((current) => ({ ...current, [id]: !current[id] }))} 
                        onIncrement={handleIncrement} 
                        product={product} 
                        supplier={supplier} 
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center text-slate-500 text-sm font-medium">
                  {t('noProductsMatchFilters')}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <SupplierReviewsSection supplier={supplier} />
      )}
    </section>
  )
}
