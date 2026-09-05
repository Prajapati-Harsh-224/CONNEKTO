import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import ProductManagementForm from '../components/ProductManagementForm.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { createSupplierProduct, deactivateSupplierProduct, getSupplierProducts, updateSupplierProduct } from '../services/supplierProductService.js'

const emptyForm = { name: '', brand: '', category: '', packSize: '', price: '', minimumQuantity: '1', imageUrl: '' }

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

  useEffect(() => {
    getSupplierProducts().then((response) => setProducts(response.data.products)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  function startAdd() {
    setEditingId('new')
    setForm(emptyForm)
    setFormError('')
    setFeedback('')
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({ name: product.name, brand: product.brand, category: product.category, packSize: product.packSize, price: String(product.price), minimumQuantity: String(product.minimumQuantity), imageUrl: product.imageUrl || '' })
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
      setProducts((current) => editingId === 'new' ? [...current, response.data.product] : current.map((product) => product.id === editingId ? response.data.product : product))
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
  if (error && !products.length) return <section className="management-page"><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{t('productsUnavailable')}</h1><p className="form-message error" role="alert">{error}</p></section>

  return <section className="management-page"><div className="management-heading"><div><div className="eyebrow">{t('supplierWorkspace')}</div><h1>{t('yourProducts')}</h1><p className="muted">{t('manageCatalogVisible')}</p></div><button className="button primary" onClick={startAdd} type="button">{t('addProduct')}</button></div>{feedback && <p className="form-message success" role="status">{feedback}</p>}{editingId && <section className="management-form-panel"><div className="section-heading"><div><span className="section-kicker">{editingId === 'new' ? t('newListing') : t('editListing')}</span><h2>{editingId === 'new' ? t('addAProduct') : t('updateProduct')}</h2></div></div><ProductManagementForm form={form} errors={{ form: formError }} isSubmitting={isSaving} onCancel={() => setEditingId(null)} onChange={updateField} onSubmit={saveProduct} submitLabel={editingId === 'new' ? t('addProduct') : t('saveChanges')} /></section>}{products.length ? <div className="managed-product-list">{products.map((product) => <article className={`managed-product${product.isActive ? '' : ' inactive'}`} key={product.id}><ProductImage alt={`${product.name} product`} aria-hidden="true" className="managed-product-image" fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()} src={product.imageUrl || ''} /><div className="managed-product-info"><div className="managed-product-title"><div><span className="product-category">{product.category}</span><h2>{product.name}</h2></div><span className={`active-status ${product.isActive ? 'active' : 'inactive'}`}>{product.isActive ? t('active') : t('inactive')}</span></div><p>{product.brand} · {product.packSize}</p><span className="managed-product-meta">Rs {Number(product.price).toLocaleString('en-IN')} · {t('minimumQuantity')} {product.minimumQuantity}</span></div><div className="managed-product-actions"><button className="button secondary" onClick={() => startEdit(product)} type="button">{t('edit')}</button>{product.isActive && <button className="text-action" onClick={() => deactivateProduct(product)} type="button">{t('deactivate')}</button>}</div></article>)}</div> : <EmptyState title="No products yet" message="Add your first product listing to start building your catalog." />}</section>
}
