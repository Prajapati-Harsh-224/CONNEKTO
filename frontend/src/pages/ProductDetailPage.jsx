import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { addToCart } from '../utils/cartStorage.js'
import { getSupplierProduct } from '../services/catalogService.js'

export default function ProductDetailPage() {
  const { supplierId, productId } = useParams()
  const { t } = useLocale()
  const [supplier, setSupplier] = useState(null)
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [quantityError, setQuantityError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')
    setSupplier(null)
    setProduct(null)
    getSupplierProduct(supplierId, productId)
      .then((response) => {
        const nextProduct = response.data?.product || null
        setSupplier(response.data?.supplier || null)
        setProduct(nextProduct)
        if (nextProduct) setQuantity(Number(nextProduct.minimumQuantity))
      })
      .catch((requestError) => {
        setSupplier(null)
        setProduct(null)
        if (requestError.status !== 404) setError(requestError.message)
      })
      .finally(() => setIsLoading(false))
  }, [productId, supplierId])

  function updateQuantity(nextQuantity) {
    const numericQuantity = Number(nextQuantity)
    setSuccessMessage('')
    if (!Number.isInteger(numericQuantity) || numericQuantity < Number(product.minimumQuantity)) {
      setQuantity(nextQuantity)
      setQuantityError(t('wholeNumberAtLeast', { minimum: product.minimumQuantity }))
      return
    }
    setQuantity(numericQuantity)
    setQuantityError('')
  }

  function handleAddToCart() {
    const minimumQuantity = Number(product.minimumQuantity)
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < minimumQuantity) {
      setQuantityError(t('wholeNumberAtLeast', { minimum: minimumQuantity }))
      return
    }
    addToCart({ productId: product.id, supplierId: supplier.id, supplierName: supplier.name, serviceArea: (supplier.serviceAreas || []).join(', '), category: product.category, name: product.name, brand: product.brand, packSize: product.packSize, imageUrl: product.imageUrl || '', minimumQuantity: minimumQuantity, quantity: Number(quantity), unitPrice: product.price })
    setSuccessMessage(t('addedToCartMessage', { product: product.name }))
  }

  if (isLoading) return <LoadingState message={t('loadingProductDetails')} />
  if (error) return <section className="product-detail-page"><p className="form-message error" role="alert">{error}</p></section>
  if (!supplier || !product) return <EmptyState title={t('productUnavailable')} message={t('productUnavailableMessage')} />

  return <section className="product-detail-page">
    <Link className="back-link" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>{t('backToCatalog', { supplier: supplier.name })}</Link>
    <div className="product-detail-layout">
      <ProductImage alt={`${product.name} product`} className="product-detail-image" fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'} src={product.imageUrl || product.imageLabel} />
      <div className="product-detail-content">
        <div className="eyebrow">{t('productDetails')}</div>
        <span className="product-category">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="product-detail-brand">{product.brand}</p>
        <div className="detail-spec-grid"><div><span>{t('packSize')}</span><strong>{product.packSize}</strong></div><div><span>{t('minimumQuantity')}</span><strong>{product.minimumQuantity}</strong></div></div>
        <strong className="detail-price">{product.price}</strong>
        <QuantitySelector error={quantityError} minimum={Number(product.minimumQuantity)} onChange={updateQuantity} value={quantity} />
        {successMessage && <p className="form-message success" role="status">{successMessage}</p>}
        <button className="button primary detail-cart-button" onClick={handleAddToCart} type="button">{t('addToCart')}</button>
      </div>
    </div>
  </section>
}
