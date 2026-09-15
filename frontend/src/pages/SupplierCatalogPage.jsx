import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierProducts } from '../services/catalogService.js'
import { addToCart } from '../utils/cartStorage.js'

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

function SupplierCatalogCard({ product, supplier, favorite, onFavorite, onAdd }) {
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
        <strong className="spc-price">{formatPrice(product.price)}</strong>
        <span className="spc-minimum">Min. qty: {product.minimumQuantity}</span>
        <button className="spc-add-button" type="button" onClick={() => onAdd(product)}><span aria-hidden="true">[+]</span> Add to cart</button>
      </div>
    </article>
  )
}

export default function SupplierCatalogPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
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

  function handleAdd(product) {
    addToCart({ productId: product.id, supplierId: supplier.id, supplierName: supplier.name, serviceArea: (supplier.serviceAreas || []).join(', '), category: product.category, name: product.name, brand: product.brand, packSize: product.packSize, imageUrl: product.imageUrl || '', minimumQuantity: product.minimumQuantity, quantity: product.minimumQuantity, unitPrice: product.price })
    window.dispatchEvent(new Event('connecto-cart-updated'))
    setCartMessage(`${product.name} added to cart`)
  }

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="spc-page"><p className="form-message error" role="alert">{error}</p></section>
  if (notFound || !supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  return (
    <section className="spc-page">
      <div className="spc-breadcrumb"><Link to="/dashboard/shop-owner/suppliers">Shop Owner</Link><span>›</span><Link to="/dashboard/shop-owner/suppliers">Suppliers</Link><span>›</span><span>{supplier.name}</span></div>
      <header className="spc-supplier-header">
        <div className="spc-supplier-avatar" aria-hidden="true">{getInitials(supplier.name)}</div>
        <div className="spc-supplier-copy"><div className="spc-name-row"><h1>{supplier.name}</h1>{supplier.isVerified && <span className="spc-verified">● Verified Supplier</span>}</div><div className="spc-supplier-meta"><strong>{supplier.category}</strong><span>|</span><span>{supplier.location || '—'}</span><span>|</span><span>{supplier.serviceAreaCount ?? supplier.serviceAreas?.length ?? 0} service areas</span></div><p>{supplier.description}</p></div>
        <div className="spc-supplier-actions"><button className="spc-outline-button" type="button">Contact</button><Link className="spc-primary-button" to={`/dashboard/shop-owner/suppliers/${supplier.id}`}>View Profile</Link></div>
      </header>
      <nav className="spc-tabs" aria-label="Supplier sections"><button className="active" type="button">Products</button><button type="button">About</button><button type="button">Service Areas</button><button type="button">Reviews</button></nav>
      <div className="spc-toolbar">
        <label className="spc-search"><SearchIcon /><span className="sr-only">Search products</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search products in ${supplier.name}...`} /></label>
        <label className="spc-select"><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All Products">All Categories</option>{categories.filter((item) => item !== 'All Categories').map((item) => <option key={item}>{item}</option>)}</select><span>⌄</span></label>
        <label className="spc-select"><span className="sr-only">Brand</span><select value={brand} onChange={(event) => setBrand(event.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select><span>⌄</span></label>
        <label className="spc-select"><span className="sr-only">Sort products</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="popular">Sort by: Popular</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name</option></select><span>⌄</span></label>
      </div>
      <div className="spc-catalog-layout"><aside className="spc-category-sidebar"><h2>Categories</h2>{categoryOrder.map((item) => <button className={(category === item || (item === 'All Products' && category === 'All Categories')) ? 'active' : ''} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</aside><div className="spc-products-area"><div className="spc-results-line"><strong>{visibleProducts.length} products</strong>{cartMessage && <span role="status">{cartMessage}</span>}</div>{visibleProducts.length ? <div className="spc-product-grid">{visibleProducts.map((product) => <SupplierCatalogCard key={product.id} favorite={Boolean(favorites[product.id])} onAdd={handleAdd} onFavorite={(id) => setFavorites((current) => ({ ...current, [id]: !current[id] }))} product={product} supplier={supplier} />)}</div> : <div className="spc-empty">No products match these filters.</div>}</div></div>
    </section>
  )
}
