import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiSearch,
  FiChevronDown,
  FiHeart,
  FiGrid,
  FiList,
  FiMapPin,
  FiX,
  FiPackage,
  FiCheck,
  FiShoppingBag,
  FiEye,
  FiPlus,
  FiMinus,
  FiPhone,
  FiMail,
} from 'react-icons/fi'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierProducts } from '../services/catalogService.js'
import { addToCart, getCart, updateCartItem, removeFromCart, getItemUnitLabel } from '../utils/cartStorage.js'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function SupplierReviewsSection({ supplier }) {
  const { t } = useLocale()
  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      author: 'Ramesh Kirana Store',
      location: supplier.location || 'Punitnagar',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent supplier! Products are delivered fast and packed securely. High margin items for retail shops.',
    },
    {
      id: 'rev-2',
      author: 'Patel Supermarket',
      location: 'Ahmedabad',
      rating: 4,
      date: '1 week ago',
      comment: 'Reliable supplier for stock replenishment. Packaging was sturdy and delivery was on time.',
    },
    {
      id: 'rev-3',
      author: 'Shreeji Traders',
      location: 'Isanpur',
      rating: 5,
      date: '3 weeks ago',
      comment: 'Very reliable distribution desk. Always stocks authentic brands with fresh expiry dates.',
    },
  ])

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
      comment: newComment.trim(),
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
          <div className="text-xs text-slate-400 font-medium">Based on {reviews.length} reviews</div>
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
        <h3 className="text-base font-bold text-slate-900">Write a Review for {supplier.name}</h3>
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold" role="status">
            {successMsg}
          </div>
        )}
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className={`text-2xl cursor-pointer transition-transform hover:scale-110 ${
                    star <= newRating ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rev-author" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Store / Business Name
            </label>
            <input
              id="rev-author"
              type="text"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="e.g. Mahadev General Store"
              value={newAuthor}
            />
          </div>

          <div>
            <label htmlFor="rev-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Review Details
            </label>
            <textarea
              id="rev-comment"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share feedback on packaging quality, speed of delivery, product freshness..."
              rows={3}
              value={newComment}
            />
          </div>

          <button
            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            type="submit"
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Verified Retailer Reviews ({reviews.length})</h3>
        {reviews.map((rev) => (
          <div key={rev.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-slate-900">{rev.author}</strong>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Verified Retailer</span>
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
  const [activeTab, setActiveTab] = useState('products')
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Filters & Controls (Same structure as Gruh Udyog)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('All Brands')
  const [sortBy, setSortBy] = useState('popular')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [page, setPage] = useState(1)
  const pageSize = 8

  const [favorites, setFavorites] = useState({})
  const [cartMessage, setCartMessage] = useState('')
  const [cart, setCart] = useState(getCart)
  const [viewingProduct, setViewingProduct] = useState(null)

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

  // Dynamic categories and brands
  const categories = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return ['All', ...unique]
  }, [products])

  const brands = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.brand).filter(Boolean))]
    return ['All Brands', ...unique]
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'All') {
          const cat = (product.category || '').toLowerCase()
          const sel = selectedCategory.toLowerCase()
          if (!cat.includes(sel) && !sel.includes(cat)) return false
        }

        // Brand filter
        if (selectedBrand !== 'All Brands' && product.brand !== selectedBrand) {
          return false
        }

        // Search query
        if (normalizedQuery) {
          const matches = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedQuery)
          if (!matches) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price)
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price)
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
        return 0 // default order
      })
  }, [products, query, selectedBrand, selectedCategory, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

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
      boxQuantity: minBoxes,
      boxes: minBoxes,
      quantity: actualQuantity,
      unitPrice: product.price,
      price: product.price,
    })
    notifyCartUpdated()
    const unitLabel = getItemUnitLabel(product, unitsPerBox)
    const msg = `${product.name} (1 Box = ${unitsPerBox} ${unitLabel}) added to cart!`
    setCartMessage(msg)
    setTimeout(() => setCartMessage(''), 3000)
  }

  function handleIncrement(product) {
    const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
    if (!cartItem) {
      handleAdd(product)
      return
    }
    const currentBoxes = Number(cartItem.boxQuantity || cartItem.boxes || 1)
    const nextBoxes = currentBoxes + 1
    updateCartItem(product.id, supplier.id, nextBoxes)
    notifyCartUpdated()
  }

  function handleDecrement(product) {
    const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
    if (!cartItem) return

    const currentBoxes = Number(cartItem.boxQuantity || cartItem.boxes || 1)
    if (currentBoxes <= 1) {
      removeFromCart(product.id, supplier.id)
      notifyCartUpdated()
      const msg = `${product.name} removed from cart`
      setCartMessage(msg)
      setTimeout(() => setCartMessage(''), 2500)
      return
    }
    const nextBoxes = currentBoxes - 1
    updateCartItem(product.id, supplier.id, nextBoxes)
    notifyCartUpdated()
  }

  function toggleFavorite(id, e) {
    e.stopPropagation()
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">
          {error}
        </p>
      </section>
    )
  }
  if (notFound || !supplier) {
    return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link className="hover:text-slate-600 transition-colors" to="/dashboard/shop-owner/suppliers">
          {t('suppliers')}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{supplier.name}</span>
      </div>

      {/* Supplier Profile Banner */}
      <header className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div
          className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-white font-black text-xl shrink-0 shadow-xs"
          aria-hidden="true"
        >
          {getInitials(supplier.name)}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {supplier.name}
            </h1>
            {supplier.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ● {t('verifiedSupplier')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <strong className="text-brand-orange">{supplier.category}</strong>
            <span>•</span>
            <span>{supplier.location || 'Ahmedabad'}</span>
            <span>•</span>
            <span>
              {Array.isArray(supplier.serviceAreas) && supplier.serviceAreas.length > 0
                ? supplier.serviceAreas.join(', ')
                : supplier.serviceAreaCount
                ? `${supplier.serviceAreaCount} service areas`
                : 'Local Delivery'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{supplier.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <FiPhone className="text-slate-400" /> {supplier.phone || '+91 98765 43210'}
            </span>
            {supplier.email && (
              <span className="flex items-center gap-1">
                <FiMail className="text-slate-400" /> {supplier.email}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
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
          {t('products')} ({products.length})
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
          Reviews
        </button>
      </nav>

      {activeTab === 'products' ? (
        <div className="space-y-5 sm:space-y-6">
          {/* Notifications */}
          {cartMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-emerald-600" />
                {cartMessage}
              </span>
              <button
                type="button"
                onClick={() => setCartMessage('')}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Category Pills Row (Same Concept as Gruh Udyog, with Supplier Categories) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category)
                    setPage(1)
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {category === 'All' ? t('allCategories') || 'All categories' : category}
                </button>
              )
            })}
          </div>

          {/* Toolbar Row: Search, Brand Filter, Sort By, View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search in ${supplier.name}...`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs"
              />
            </div>

            {/* Filters & View Controls */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Brand Dropdown */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value)
                    setPage(1)
                  }}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs cursor-pointer"
                >
                  <option value="popular">{t('popular') || 'Popular / Newest'}</option>
                  <option value="price-low">{t('priceLowToHigh') || 'Price: Low to High'}</option>
                  <option value="price-high">{t('priceHighToLow') || 'Price: High to Low'}</option>
                  <option value="name">{t('sortName') || 'Name: A-Z'}</option>
                </select>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Grid / List Switcher */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid view"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="List view"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Display (Grid or List) */}
          {visibleProducts.length > 0 ? (
            viewMode === 'grid' ? (
              /* 4-Column Product Cards Grid (Matching Gruh Udyog Concept & Size) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {visibleProducts.map((product) => {
                  const isFav = Boolean(favorites[product.id])
                  const availableStock = Number(product.availableStock ?? 0)
                  const isAvailable = product.isActive !== false && (product.availableStock == null || availableStock > 0)

                  const unitsPerBox = Number(product.unitsPerBox || product.minimumQuantity || 1)
                  const unitPrice = Number(product.price || 0)
                  const boxPrice = unitPrice * unitsPerBox

                  const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
                  const cartBoxes = cartItem
                    ? Number(cartItem.boxQuantity || cartItem.boxes || 1)
                    : 0

                  return (
                    <article
                      key={product.id}
                      className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all group relative ${
                        !isAvailable ? 'opacity-70 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* Image Container with Fixed Height h-44 matching Gruh Udyog */}
                      <div className="relative h-44 w-full bg-slate-50 overflow-hidden shrink-0">
                        {/* Status Pill Badge */}
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs z-10 ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>

                        {/* Wishlist Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(product.id, e)}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-xs flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                          aria-label={`Save ${product.name}`}
                        >
                          <FiHeart
                            className={`w-4 h-4 transition-colors ${
                              isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
                            }`}
                          />
                        </button>

                        {/* Product Image */}
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50/50 text-4xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3
                            className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 leading-tight group-hover:text-brand-orange transition-colors cursor-pointer"
                            onClick={() => setViewingProduct(product)}
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{product.brand || 'General'} · {product.packSize || '1 unit'}</p>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{product.category || 'General'}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <div className="text-base font-black text-slate-900 leading-none">
                              {formatPrice(unitPrice)}{' '}
                              <small className="text-[11px] text-slate-400 font-normal">/ {getItemUnitLabel(product, 1)}</small>
                            </div>
                            <div className="text-xs text-emerald-700 font-semibold mt-1 truncate">
                              1 Box = {unitsPerBox} {getItemUnitLabel(product, unitsPerBox)} ({formatPrice(boxPrice)}/box)
                            </div>
                          </div>

                          {/* Action Buttons: Add to Cart or Incrementer */}
                          <div className="mt-3.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingProduct(product)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              title="Quick view"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>

                            {!isAvailable ? (
                              <button
                                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200 text-center"
                                disabled
                                type="button"
                              >
                                {t('unavailable')}
                              </button>
                            ) : cartBoxes > 0 ? (
                              <div className="flex-1 flex items-center justify-between p-1 rounded-xl bg-orange-50 border border-brand-orange/30">
                                <button
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white text-brand-orange font-bold text-sm shadow-xs hover:bg-orange-100 transition-colors cursor-pointer"
                                  type="button"
                                  onClick={() => handleDecrement(product)}
                                  aria-label={`Decrease quantity of ${product.name}`}
                                >
                                  <FiMinus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-900">
                                  {cartBoxes} {cartBoxes === 1 ? 'Box' : 'Boxes'}
                                </span>
                                <button
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white text-brand-orange font-bold text-sm shadow-xs hover:bg-orange-100 transition-colors cursor-pointer"
                                  type="button"
                                  onClick={() => handleIncrement(product)}
                                  aria-label={`Increase quantity of ${product.name}`}
                                >
                                  <FiPlus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="flex-1 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                type="button"
                                onClick={() => handleAdd(product)}
                              >
                                <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{t('addToCart')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              /* List View Layout */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                        <th className="py-3 px-4">{t('product') || 'Product'}</th>
                        <th className="py-3 px-4">{t('category') || 'Category'}</th>
                        <th className="py-3 px-4">{t('brand') || 'Brand'}</th>
                        <th className="py-3 px-4">{t('packSize') || 'Pack Size'}</th>
                        <th className="py-3 px-4">Price / Box</th>
                        <th className="py-3 px-4">{t('status')}</th>
                        <th className="py-3 px-4 text-right">Order / Cart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleProducts.map((product) => {
                        const availableStock = Number(product.availableStock ?? 0)
                        const isAvailable = product.isActive !== false && (product.availableStock == null || availableStock > 0)
                        const unitsPerBox = Number(product.unitsPerBox || product.minimumQuantity || 1)
                        const unitPrice = Number(product.price || 0)
                        const boxPrice = unitPrice * unitsPerBox

                        const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id)
                        const cartBoxes = cartItem
                          ? Number(cartItem.boxes || Math.max(1, Math.round(Number(cartItem.quantity || unitsPerBox) / unitsPerBox)))
                          : 0

                        return (
                          <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0 cursor-pointer"
                                  onClick={() => setViewingProduct(product)}
                                />
                                <div>
                                  <p
                                    className="text-xs font-bold text-slate-900 leading-tight hover:text-brand-orange cursor-pointer"
                                    onClick={() => setViewingProduct(product)}
                                  >
                                    {product.name}
                                  </p>
                                  <p className="text-[11px] text-slate-400 line-clamp-1">{product.description || product.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">{product.category}</td>
                            <td className="py-3 px-4 text-xs text-slate-600">{product.brand || '—'}</td>
                            <td className="py-3 px-4 text-xs text-slate-500">{product.packSize}</td>
                            <td className="py-3 px-4 text-xs">
                              <strong className="text-slate-900">{formatPrice(unitPrice)} <small className="text-[11px] text-slate-400 font-normal">/ {getItemUnitLabel(product, 1)}</small></strong>
                              <span className="text-[11px] text-slate-500 block">
                                {formatPrice(boxPrice)} / box ({unitsPerBox} {getItemUnitLabel(product, unitsPerBox)})
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isAvailable ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingProduct(product)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                                >
                                  {t('view') || 'View'}
                                </button>
                                {isAvailable && (
                                  cartBoxes > 0 ? (
                                    <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-orange-50 border border-brand-orange/30">
                                      <button
                                        type="button"
                                        onClick={() => handleDecrement(product)}
                                        className="w-6 h-6 rounded bg-white text-brand-orange font-bold text-xs flex items-center justify-center hover:bg-orange-100 cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-bold text-slate-800 px-1">{cartBoxes}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleIncrement(product)}
                                        className="w-6 h-6 rounded bg-white text-brand-orange font-bold text-xs flex items-center justify-center hover:bg-orange-100 cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAdd(product)}
                                      className="px-3 py-1 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto text-2xl mb-3.5">
                📦
              </div>
              <h3 className="text-base font-bold text-slate-900">No products match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for a different brand, item name, or clear the category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedBrand('All Brands')
                  setQuery('')
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination Footer */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredProducts.length)} of{' '}
                {filteredProducts.length} products
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                      page === p
                        ? 'bg-brand-orange text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <SupplierReviewsSection supplier={supplier} />
      )}

      {/* Quick View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  {viewingProduct.imageUrl ? (
                    <img
                      src={viewingProduct.imageUrl}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{viewingProduct.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{viewingProduct.brand} · {viewingProduct.packSize}</p>
                  <span className="inline-block mt-1 text-xs text-brand-orange font-semibold">{viewingProduct.category}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 font-medium">Unit Price</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{formatPrice(viewingProduct.price)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Wholesale Box Packaging</p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  1 Box = {Number(viewingProduct.unitsPerBox || viewingProduct.minimumQuantity || 1)} {getItemUnitLabel(viewingProduct, Number(viewingProduct.unitsPerBox || viewingProduct.minimumQuantity || 1))}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Available Stock</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {viewingProduct.availableStock != null ? `${viewingProduct.availableStock} in stock` : 'Available'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Box Cost</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatPrice(Number(viewingProduct.price || 0) * Number(viewingProduct.unitsPerBox || viewingProduct.minimumQuantity || 1))} / box
                </p>
              </div>
            </div>

            {viewingProduct.description && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Description</p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {viewingProduct.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAdd(viewingProduct)
                  setViewingProduct(null)
                }}
                className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('addToCart')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
