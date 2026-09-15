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
  const [boxes, setBoxes] = useState(1)
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
        if (nextProduct) {
          const upb = Math.max(1, Number(nextProduct.unitsPerBox || 1))
          const minQty = Math.max(1, Number(nextProduct.minimumQuantity || 1))
          const minB = Math.ceil(minQty / upb)
          setBoxes(minB)
        }
      })
      .catch((requestError) => {
        setSupplier(null)
        setProduct(null)
        if (requestError.status !== 404) setError(requestError.message)
      })
      .finally(() => setIsLoading(false))
  }, [productId, supplierId])

  if (isLoading) return <LoadingState message={t('loadingProductDetails')} />
  if (error) return <section className="product-detail-page"><p className="form-message error" role="alert">{error}</p></section>
  if (!supplier || !product) return <EmptyState title={t('productUnavailable')} message={t('productUnavailableMessage')} />

  const unitsPerBox = Math.max(1, Number(product.unitsPerBox || 1))
  const isBox = unitsPerBox > 1
  const minQty = Math.max(1, Number(product.minimumQuantity || 1))
  const minBoxes = Math.ceil(minQty / unitsPerBox)
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox
  const totalQuantity = boxes * unitsPerBox

  function updateBoxes(nextValue) {
    const numericBoxes = Number(nextValue)
    setSuccessMessage('')
    if (!Number.isInteger(numericBoxes) || numericBoxes < minBoxes) {
      setBoxes(nextValue)
      setQuantityError(
        isBox
          ? `Minimum order is ${minBoxes} ${minBoxes === 1 ? 'box' : 'boxes'} (${minQty} packets)`
          : t('wholeNumberAtLeast', { minimum: minQty })
      )
      return
    }
    setBoxes(numericBoxes)
    setQuantityError('')
  }

  function handleAddToCart() {
    if (!Number.isInteger(Number(boxes)) || Number(boxes) < minBoxes) {
      setQuantityError(
        isBox
          ? `Minimum order is ${minBoxes} ${minBoxes === 1 ? 'box' : 'boxes'} (${minQty} packets)`
          : t('wholeNumberAtLeast', { minimum: minQty })
      )
      return
    }
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
      boxes: Number(boxes),
      quantity: totalQuantity,
      unitPrice: unitPrice
    })
    window.dispatchEvent(new Event('connecto-cart-updated'))
    setSuccessMessage(
      isBox
        ? `${product.name} added to cart (${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} = ${totalQuantity} packets)`
        : t('addedToCartMessage', { product: product.name })
    )
  }

  return <section className="product-detail-page">
    <Link className="back-link" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>{t('backToCatalog', { supplier: supplier.name })}</Link>
    <div className="product-detail-layout">
      <ProductImage alt={`${product.name} product`} className="product-detail-image" fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'} src={product.imageUrl || product.imageLabel} />
      <div className="product-detail-content">
        <div className="eyebrow">{t('productDetails')}</div>
        <span className="product-category">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="product-detail-brand">{product.brand}</p>
        <div className="detail-spec-grid">
          <div><span>{t('packSize')}</span><strong>{product.packSize}</strong></div>
          <div><span>{t('minimumQuantity')}</span><strong>{isBox ? `${minBoxes} ${minBoxes === 1 ? 'Box' : 'Boxes'} (${minQty} pkts)` : `${minQty} units`}</strong></div>
          {isBox && <div><span>Packaging</span><strong>1 Box = {unitsPerBox} packets</strong></div>}
        </div>
        <div style={{ margin: '0.75rem 0' }}>
          <strong className="detail-price">Rs {unitPrice.toLocaleString('en-IN')} <small style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#6b7280' }}>/ packet</small></strong>
          {isBox && <div style={{ color: '#047857', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.2rem' }}>Rs {boxPrice.toLocaleString('en-IN')} / box</div>}
        </div>
        <QuantitySelector error={quantityError} minimum={minBoxes} onChange={updateBoxes} value={boxes} />
        {isBox && <div style={{ fontSize: '0.85rem', color: '#4b5563', margin: '0.4rem 0' }}>Total: {totalQuantity} packets (Rs {(boxPrice * boxes).toLocaleString('en-IN')})</div>}
        {successMessage && <p className="form-message success" role="status">{successMessage}</p>}
        <button className="button primary detail-cart-button" onClick={handleAddToCart} type="button">{t('addToCart')}</button>
      </div>
    </div>
  </section>
}
