import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierProducts } from '../services/catalogService.js'
import { addToCart, getCart, removeFromCart, updateCartItem } from '../utils/cartStorage.js'

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
  const unitsPerBox = Number(product.unitsPerBox || 1)
  const isBox = unitsPerBox > 1
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox
  const minimumQuantity = Number(product.minimumQuantity || 1)
  const minimumBoxes = Math.ceil(minimumQuantity / unitsPerBox)

  const cartBoxes = cartItem ? Number(cartItem.boxes || Math.ceil(cartItem.quantity / unitsPerBox)) : 0

  return (
    <article className="spc-product-card">
      <button className={`spc-favorite${favorite ? ' active' : ''}`} type="button" onClick={() => onFavorite(product.id)} aria-label={favorite ? `Remove ${product.name} from favorites` : `Save ${product.name}`}>
        <svg viewBox="0 0 20 20" fill={favorite ? 'currentColor' : 'none'} aria-hidden="true"><path d="M10 17.5S2 13 2 7a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 10.5-8 10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      </button>
      <Link className="spc-product-image-link" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products/${product.id}`} aria-label={`View ${product.name}`}>
        <ProductImage className="spc-product-image" alt={`${product.name} product`} fallbackText={product.imageLabel} src={product.imageUrl || product.imageLabel} />
      </Link>
      <div className="spc-product-info">
        <span className="spc-brand">{product.brand}</span>
        <h3>{product.name}</h3>
        <span className="spc-pack">{product.packSize}</span>
        
        {isBox ? (
          <div style={{ display: 'grid', gap: '0.15rem', margin: '0.2rem 0' }}>
            <strong className="spc-price">{formatPrice(unitPrice)} <small style={{ fontSize: '0.72rem', fontWeight: 'normal', color: '#6b7280' }}>/ packet</small></strong>
            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '600' }}>1 Box = {unitsPerBox} packets ({formatPrice(boxPrice)}/box)</span>
            <span className="spc-minimum">Min. order: {minimumBoxes} {minimumBoxes === 1 ? 'box' : 'boxes'} ({minimumQuantity} pkts)</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.15rem', margin: '0.2rem 0' }}>
            <strong className="spc-price">{formatPrice(unitPrice)}</strong>
            <span className="spc-minimum">Min. qty: {minimumQuantity} units</span>
          </div>
        )}

        {cartBoxes > 0 ? (
          <div className="spc-quantity-control">
            <button className="spc-qty-btn minus" type="button" onClick={() => onDecrement(product)} aria-label={`Decrease quantity of ${product.name}`}>
              −
            </button>
            <span className="spc-qty-count">{isBox ? `${cartBoxes} ${cartBoxes === 1 ? 'Box' : 'Boxes'}` : cartBoxes}</span>
            <button className="spc-qty-btn plus" type="button" onClick={() => onIncrement(product)} aria-label={`Increase quantity of ${product.name}`}>
              +
            </button>
          </div>
        ) : (
          <button className="spc-add-button" type="button" onClick={() => onAdd(product)}>
            <span aria-hidden="true">[+]</span> {isBox ? `Add ${minimumBoxes} ${minimumBoxes === 1 ? 'Box' : 'Boxes'} (${minimumQuantity} pkts)` : 'Add to cart'}
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
    <div className="spc-reviews-section" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Review summary box */}
      <div className="spc-reviews-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{avgRating}</div>
          <div style={{ color: '#f59e0b', fontSize: '1.1rem', margin: '0.35rem 0' }}>
            {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Based on {reviews.length} reviews</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', justifyContent: 'center' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length
            const percent = reviews.length ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4b5563' }}>
                <span style={{ width: '45px' }}>{star} stars</span>
                <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
                </div>
                <span style={{ width: '25px', textAlign: 'right' }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Review Form */}
      <div className="spc-review-form-card" style={{ background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', color: '#111827' }}>Write a Review for {supplier.name}</h3>
        {successMsg && (
          <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', color: '#047857', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {successMsg}
          </div>
        )}
        <form onSubmit={handleSubmitReview} style={{ display: 'grid', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
              Your Rating
            </label>
            <div style={{ display: 'flex', gap: '0.35rem', fontSize: '1.4rem', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setNewRating(star)}
                  style={{ color: star <= newRating ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label htmlFor="rev-author" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                Shop Name / Your Name
              </label>
              <input
                id="rev-author"
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="e.g. Laxmi Supermarket"
                style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                type="text"
                value={newAuthor}
              />
            </div>
          </div>

          <div>
            <label htmlFor="rev-comment" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
              Review Details
            </label>
            <textarea
              id="rev-comment"
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience ordering from this supplier..."
              rows={3}
              style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
              value={newComment}
            />
          </div>

          <div>
            <button
              className="button primary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer' }}
              type="submit"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="spc-reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Customer Feedback ({reviews.length})</h3>
        {reviews.map((rev) => (
          <div key={rev.id} style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '9px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{rev.author}</strong>
                <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '600' }}>Verified Shop</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{rev.date}</span>
            </div>
            <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5' }}>{rev.comment}</p>
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
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Products')
  const [brand, setBrand] = useState('All Brands')
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

  const categories = useMemo(() => ['All Categories', ...new Set(products.map((product) => product.category))], [products])
  const brands = useMemo(() => ['All Brands', ...new Set(products.map((product) => product.brand))], [products])
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedQuery)
      const matchesCategory = category === 'All Products' || category === 'All Categories' || product.category === category
      const matchesBrand = brand === 'All Brands' || product.brand === brand
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
    const unitsPerBox = Math.max(1, Number(product.unitsPerBox || 1))
    const minQty = Math.max(1, Number(product.minimumQuantity || 1))
    const minBoxes = Math.ceil(minQty / unitsPerBox)
    const actualQuantity = minBoxes * unitsPerBox

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
      minimumQuantity: minQty,
      unitsPerBox: unitsPerBox,
      boxes: minBoxes,
      quantity: actualQuantity,
      unitPrice: product.price
    })
    notifyCartUpdated()
    const msg = unitsPerBox > 1
      ? `${product.name} added to cart (${minBoxes} ${minBoxes === 1 ? 'Box' : 'Boxes'} = ${actualQuantity} packets)`
      : `${product.name} added to cart (${actualQuantity} units)`
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
    const unitsPerBox = Math.max(1, Number(product.unitsPerBox || 1))
    const minQty = Math.max(1, Number(product.minimumQuantity || 1))
    const minBoxes = Math.ceil(minQty / unitsPerBox)

    const currentBoxes = Number(cartItem.boxes || 1)
    const nextBoxes = currentBoxes - 1

    if (nextBoxes < minBoxes) {
      removeFromCart(product.id, supplier.id)
      setCartMessage(`${product.name} removed from cart`)
      setTimeout(() => setCartMessage(''), 3000)
    } else {
      updateCartItem(product.id, supplier.id, nextBoxes)
    }
    notifyCartUpdated()
  }

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="spc-page"><p className="form-message error" role="alert">{error}</p></section>
  if (notFound || !supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  return (
    <section className="spc-page">
      <div className="spc-breadcrumb"><Link to="/dashboard/shop-owner/suppliers">Shop Owner</Link><span>›</span><Link to="/dashboard/shop-owner/suppliers">Suppliers</Link><span>›</span><span>{supplier.name}</span></div>
      <header className="spc-supplier-header">
        <div className="spc-supplier-avatar" aria-hidden="true">{getInitials(supplier.name)}</div>
        <div className="spc-supplier-copy">
          <div className="spc-name-row">
            <h1>{supplier.name}</h1>
            {supplier.isVerified && <span className="spc-verified">● Verified Supplier</span>}
          </div>
          <div className="spc-supplier-meta">
            <strong>{supplier.category}</strong>
            <span>|</span>
            <span>{supplier.location || '—'}</span>
            <span>|</span>
            <span>{supplier.serviceAreaCount ?? supplier.serviceAreas?.length ?? 0} service areas</span>
          </div>
          <p>{supplier.description}</p>
          <div className="spc-supplier-contact" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.45rem', fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>
            <span>📞 {supplier.phone || '+91 98765 43210'}</span>
            {supplier.email && <span>✉️ {supplier.email}</span>}
          </div>
        </div>
      </header>
      <nav className="spc-tabs" aria-label="Supplier sections">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')} type="button">Products</button>
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')} type="button">Reviews</button>
      </nav>
      {activeTab === 'products' ? (
        <>
          <div className="spc-toolbar">
            <label className="spc-search"><SearchIcon /><span className="sr-only">Search products</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search products in ${supplier.name}...`} /></label>
            <label className="spc-select"><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All Products">All Categories</option>{categories.filter((item) => item !== 'All Categories').map((item) => <option key={item}>{item}</option>)}</select><span>⌄</span></label>
            <label className="spc-select"><span className="sr-only">Brand</span><select value={brand} onChange={(event) => setBrand(event.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select><span>⌄</span></label>
            <label className="spc-select"><span className="sr-only">Sort products</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="popular">Sort by: Popular</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name</option></select><span>⌄</span></label>
          </div>
          <div className="spc-catalog-layout"><aside className="spc-category-sidebar"><h2>Categories</h2>{categoryOrder.map((item) => <button className={(category === item || (item === 'All Products' && category === 'All Categories')) ? 'active' : ''} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</aside><div className="spc-products-area"><div className="spc-results-line"><strong>{visibleProducts.length} products</strong>{cartMessage && <span role="status">{cartMessage}</span>}</div>{visibleProducts.length ? <div className="spc-product-grid">{visibleProducts.map((product) => { const cartItem = cart.find((item) => item.productId === product.id && item.supplierId === supplier.id); return <SupplierCatalogCard key={product.id} cartItem={cartItem} favorite={Boolean(favorites[product.id])} onAdd={handleAdd} onDecrement={handleDecrement} onFavorite={(id) => setFavorites((current) => ({ ...current, [id]: !current[id] }))} onIncrement={handleIncrement} product={product} supplier={supplier} /> })}</div> : <div className="spc-empty">No products match these filters.</div>}</div></div>
        </>
      ) : (
        <SupplierReviewsSection supplier={supplier} />
      )}
    </section>
  )
}
