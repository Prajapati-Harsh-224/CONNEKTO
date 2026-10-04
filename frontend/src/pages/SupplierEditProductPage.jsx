import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiBox, FiCheck, FiCheckCircle, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import ProductManagementForm from '../components/ProductManagementForm.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { normalizeImageUrl } from '../utils/imageUrl.js'
import {
  createSupplierProduct,
  deactivateSupplierProduct,
  deleteSupplierProduct,
  getSupplierProduct,
  getSupplierProducts,
  updateSupplierProduct,
} from '../services/supplierProductService.js'

const emptyForm = {
  name: '',
  brand: '',
  category: '',
  packSize: '',
  price: '',
  minimumQuantity: '1',
  availableStock: '0',
  imageUrl: '',
}

export default function SupplierEditProductPage() {
  const { productId } = useParams()
  const isNew = !productId || productId === 'new'
  const navigate = useNavigate()
  const { t } = useLocale()

  const [form, setForm] = useState(emptyForm)
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let isMounted = true

    // Fetch existing categories for the dropdown
    getSupplierProducts()
      .then((res) => {
        if (!isMounted) return
        const prods = res?.data?.products || []
        const uniqueCats = [...new Set(prods.map((p) => p.category).filter(Boolean))]
        setCategories(uniqueCats)
      })
      .catch(() => {})

    // If editing, fetch product details
    if (!isNew) {
      setIsLoading(true)
      getSupplierProduct(productId)
        .then((res) => {
          if (!isMounted) return
          const p = res?.data?.product
          if (p) {
            setProduct(p)
            setForm({
              name: p.name || '',
              brand: p.brand || '',
              category: p.category || '',
              packSize: p.packSize || '',
              price: String(p.price ?? ''),
              minimumQuantity: String(p.minimumQuantity ?? 1),
              availableStock: String(p.availableStock ?? 0),
              imageUrl: p.imageUrl || '',
            })
          } else {
            setError('Product not found')
          }
        })
        .catch((err) => {
          if (isMounted) setError(err.message || 'Failed to load product details')
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    }

    return () => {
      isMounted = false
    }
  }, [productId, isNew])

  function updateField(event) {
    const { name, value } = event.target
    if (name === 'availableStock') {
      const sanitized = value.replace(/\D/g, '')
      setForm((current) => ({ ...current, [name]: sanitized }))
      setFormError('')
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  async function handleSave(event) {
    event.preventDefault()
    setFormError('')
    setError('')
    setIsSaving(true)

    const cleanedImageUrl = normalizeImageUrl(form.imageUrl)
    const parsedStock = form.availableStock === '' ? 0 : parseInt(form.availableStock, 10)

    const payload = {
      ...form,
      imageUrl: cleanedImageUrl,
      price: Number(form.price || 0),
      minimumQuantity: Number(form.minimumQuantity || 1),
      availableStock: isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
    }

    try {
      if (isNew) {
        await createSupplierProduct(payload)
        navigate('/dashboard/supplier/products', {
          state: { feedback: t('productAdded') || 'Product added successfully' },
        })
      } else {
        await updateSupplierProduct(productId, payload)
        navigate('/dashboard/supplier/products', {
          state: { feedback: t('productUpdated') || 'Product updated successfully' },
        })
      }
    } catch (requestError) {
      setFormError(requestError.message || 'Failed to save product')
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!product) return
    setIsSaving(true)
    try {
      if (product.isActive) {
        await deactivateSupplierProduct(product.id)
        setProduct((prev) => ({ ...prev, isActive: false }))
        setFeedback(t('productDeactivatedMessage', { product: product.name }) || 'Product hidden from catalog')
      } else {
        await updateSupplierProduct(product.id, { ...product, isActive: true })
        setProduct((prev) => ({ ...prev, isActive: true }))
        setFeedback('Product is now active and visible to retailers')
      }
    } catch (err) {
      setError(err.message || 'Failed to update product status')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteProduct() {
    if (!product) return
    const confirmed = window.confirm(`Are you sure you want to remove "${product.name || 'this product'}"? This will delete the product permanently from your catalog.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteSupplierProduct(product.id)
      navigate('/dashboard/supplier/products', {
        state: { feedback: `Product "${product.name || ''}" removed successfully!` },
      })
    } catch (err) {
      setError(err.message || 'Failed to remove product')
      setIsDeleting(false)
    }
  }

  function handleDiscardNew() {
    const hasData = Boolean(form.name || form.brand || form.price || form.imageUrl)
    if (hasData) {
      const confirmed = window.confirm('Discard and remove this product draft?')
      if (!confirmed) return
    }
    navigate('/dashboard/supplier/products')
  }

  if (isLoading) {
    return <LoadingState message={t('loadingYourProducts') || 'Loading product details...'} />
  }

  if (error && !product && !isNew) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <FiAlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <p className="text-xs sm:text-sm">The product you are trying to edit could not be found or has been removed.</p>
          <div className="pt-2">
            <Link
              to="/dashboard/supplier/products"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors"
            >
              <FiArrowLeft /> {t('backToProducts') || 'Back to products'}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const pageTitle = isNew ? (t('addAProduct') || 'Add a product') : (t('updateProduct') || 'Edit product details')
  const productName = form.name || product?.name || 'Product'

  return (
    <section className="pb-32 sm:pb-12 space-y-6 sm:space-y-8 w-full min-w-0">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider" aria-label="Breadcrumb">
        <Link to="/dashboard/supplier/home" className="hover:text-slate-600 transition-colors">
          {t('supplierWorkspace')}
        </Link>
        <span aria-hidden="true">›</span>
        <Link to="/dashboard/supplier/products" className="hover:text-slate-600 transition-colors">
          {t('products')}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700 truncate max-w-[200px]">{isNew ? t('addProduct') : productName}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
            {isNew ? (t('newListing') || 'New Listing') : (t('editListing') || 'Edit Listing')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isNew
              ? 'Fill in the product details below to publish it to your retailer catalog.'
              : 'Modify price, stock, brand, and packaging details visible to ordering shops.'}
          </p>
        </div>

        <Link
          to="/dashboard/supplier/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <FiArrowLeft />
          <span>{t('backToProducts') || 'Back to products'}</span>
        </Link>
      </div>

      {/* ── Feedback Message ── */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs" role="status">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button className="text-emerald-700 hover:underline text-xs font-bold cursor-pointer" onClick={() => setFeedback('')} type="button">
            {t('dismiss') || 'Dismiss'}
          </button>
        </div>
      )}

      {/* ── Form Card ── */}
      <div className="p-5 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <ProductManagementForm
          categories={categories}
          errors={{ form: formError }}
          form={form}
          isSubmitting={isSaving}
          isDeleting={isDeleting}
          onCancel={() => navigate('/dashboard/supplier/products')}
          onChange={updateField}
          onDelete={!isNew ? handleDeleteProduct : undefined}
          deleteLabel={t('removeProduct') || 'Remove Product'}
          submitLabel={t('saveChanges') || 'Save Changes'}
        />
      </div>

      {/* ── Additional Product Status Controls (for existing products) ── */}
      {!isNew && product && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Catalog Visibility</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {product.isActive
                ? 'This product is active and visible to retailers in your supply desk.'
                : 'This product is currently hidden from retailers.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isSaving || isDeleting}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                product.isActive
                  ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {product.isActive ? (t('deactivate') || 'Deactivate Product') : 'Reactivate Product'}
            </button>
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Removing...' : (t('removeProduct') || 'Remove Product')}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
