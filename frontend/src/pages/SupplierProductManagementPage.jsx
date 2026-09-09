import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import ProductManagementForm from '../components/ProductManagementForm.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { createSupplierProduct, deactivateSupplierProduct, getSupplierProducts, updateSupplierProduct } from '../services/supplierProductService.js'

const emptyForm = { name: '', brand: '', category: '', packSize: '', price: '', minimumQuantity: '1', imageUrl: '' }

function formatPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`
}

export default function SupplierProductManagementPage() {
  const { t } = useLocale()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All categories')
  const [sortBy, setSortBy] = useState('popular')

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

  function startAdd() {
    setEditingId('new')
    setForm({ ...emptyForm, category: activeCategory !== 'All categories' ? activeCategory : '' })
    setFormError('')
    setFeedback('')
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      packSize: product.packSize,
      price: String(product.price),
      minimumQuantity: String(product.minimumQuantity),
      imageUrl: product.imageUrl || ''
    })
    setFormError('')
    setFeedback('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  async function saveProduct(event) {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setIsSaving(true)
    const payload = { ...form, price: Number(form.price), minimumQuantity: Number(form.minimumQuantity) }
    try {
      const response = editingId === 'new' ? await createSupplierProduct(payload) : await updateSupplierProduct(editingId, payload)
      setProducts((current) => editingId === 'new'
        ? [...current, response.data.product]
        : current.map((product) => product.id === editingId ? response.data.product : product))
      setEditingId(null)
      setFeedback(editingId === 'new' ? t('productAdded') : t('productUpdated'))
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

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
      <section className="management-page">
        <div className="eyebrow">{t('supplierWorkspace')}</div>
        <h1>{t('productsUnavailable')}</h1>
        <p className="form-message error" role="alert">{error}</p>
      </section>
    )
  }

  return (
    <section className="supplier-product-page">
      <div className="supplier-product-breadcrumb">
        <span>{t('supplierWorkspace')}</span>
        <span aria-hidden="true">›</span>
        <span>{t('products')}</span>
      </div>

      <div className="supplier-product-header">
        <div>
          <div className="eyebrow">{t('supplierWorkspace')}</div>
          <h1>{t('yourProducts')}</h1>
          <p className="muted">{t('manageCatalogVisible')}</p>
        </div>
        <button className="button primary" onClick={startAdd} type="button">{t('addProduct')}</button>
      </div>

      {feedback && <p className="form-message success" role="status">{feedback}</p>}

      {editingId && (
        <section className="management-form-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">{editingId === 'new' ? t('newListing') : t('editListing')}</span>
              <h2>{editingId === 'new' ? t('addAProduct') : t('updateProduct')}</h2>
            </div>
          </div>
          <ProductManagementForm
            form={form}
            errors={{ form: formError }}
            isSubmitting={isSaving}
            onCancel={() => setEditingId(null)}
            onChange={updateField}
            onSubmit={saveProduct}
            submitLabel={editingId === 'new' ? t('addProduct') : t('saveChanges')}
          />
        </section>
      )}

      <div className="supplier-product-shell">
        <aside className="supplier-product-categories">
          <h2>Categories</h2>
          {categories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </aside>

        <div className="supplier-product-results">
          <div className="supplier-product-toolbar">
            <label className="supplier-search-field">
              <span aria-hidden="true">⌕</span>
              <input onChange={(event) => setQuery(event.target.value)} placeholder={t('searchProducts')} type="search" value={query} />
            </label>

            <label className="supplier-filter-field">
              <span className="sr-only">Sort products</span>
              <select onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
                <option value="popular">Popular</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </label>

            <button
              className="supplier-clear-button"
              onClick={() => {
                setQuery('')
                setActiveCategory('All categories')
                setSortBy('popular')
              }}
              type="button"
            >
              Clear
            </button>
          </div>

          <div className="supplier-product-results-head">
            <h2>{visibleProducts.length} products</h2>
            <span>{query ? `Filtered by “${query}”` : 'Showing all products'}</span>
          </div>

          {visibleProducts.length ? (
            <div className="supplier-product-grid">
              {visibleProducts.map((product) => (
                <article className={`supplier-product-card${product.isActive ? '' : ' inactive'}`} key={product.id}>
                  <ProductImage
                    alt={`${product.name} product`}
                    aria-hidden="true"
                    className="supplier-product-art"
                    fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()}
                    src={product.imageUrl || ''}
                  />

                  <div className="supplier-product-body">
                    <div className="supplier-product-topline">
                      <span className="supplier-product-category">{product.category || 'General'}</span>
                      <span className={`active-status ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>

                    <h3>{product.name}</h3>
                    <p className="supplier-product-brand">{product.brand} · {product.packSize}</p>
                    <div className="supplier-product-meta">
                      <span>Min qty: {product.minimumQuantity}</span>
                      <span>{product.isActive ? 'Live' : 'Hidden'}</span>
                    </div>
                    <strong className="supplier-product-price">{formatPrice(product.price)}</strong>

                    <div className="supplier-product-actions">
                      <button className="button secondary" onClick={() => startEdit(product)} type="button">{t('edit')}</button>
                      {product.isActive && (
                        <button className="text-action" onClick={() => deactivateProduct(product)} type="button">{t('deactivate')}</button>
                      )}
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
