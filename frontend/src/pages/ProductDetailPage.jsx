import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { addToCart, getItemUnitLabel } from '../utils/cartStorage.js'
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
          setBoxes(1)
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

  const unitsPerBox = Math.max(1, Number(product.unitsPerBox || product.minimumQuantity || 1))
  const isBox = true
  const minBoxes = 1
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox
  const totalQuantity = boxes * unitsPerBox
  const unitPlural = getItemUnitLabel(product, unitsPerBox)
  const unitSingular = getItemUnitLabel(product, 1)
  const totalUnitLabel = getItemUnitLabel(product, totalQuantity)

  function updateBoxes(nextValue) {
    const numericBoxes = Number(nextValue)
    setSuccessMessage('')
    if (!Number.isInteger(numericBoxes) || numericBoxes < 1) {
      setBoxes(nextValue)
      setQuantityError(t('minimumOrderIsOneBox') || 'Minimum order is 1 box')
      return
    }
    setBoxes(numericBoxes)
    setQuantityError('')
  }

  function handleAddToCart() {
    if (!Number.isInteger(Number(boxes)) || Number(boxes) < 1) {
      setQuantityError(t('minimumOrderIsOneBox') || 'Minimum order is 1 box')
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
      minimumQuantity: unitsPerBox,
      unitsPerBox: unitsPerBox,
      boxQuantity: Number(boxes),
      boxes: Number(boxes),
      quantity: totalQuantity,
      unitPrice: unitPrice,
      price: unitPrice,
    })
    window.dispatchEvent(new Event('connecto-cart-updated'))
    setSuccessMessage(
      `${product.name} added to cart! (${boxes} ${boxes === 1 ? 'Box' : 'Boxes'} = ${totalQuantity} ${totalUnitLabel})`
    )
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
      <Link 
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" 
        to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}
      >
        ← {t('backToCatalog', { supplier: supplier.name })}
      </Link>

      <div className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-6">
            <ProductImage 
              alt={`${product.name} product`} 
              className="w-full h-full object-contain" 
              fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'} 
              src={product.imageUrl || product.imageLabel} 
            />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{product.category}</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">{product.name}</h1>
              <p className="text-xs sm:text-sm font-semibold text-brand-orange mt-1">{product.brand}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">{t('packSize')}</span>
                <strong className="font-bold text-slate-900 mt-0.5 block truncate">{product.packSize}</strong>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Min. order</span>
                <strong className="font-bold text-slate-900 mt-0.5 block truncate">1 Box</strong>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">{t('packaging')}</span>
                <strong className="font-bold text-slate-900 mt-0.5 block truncate">{unitsPerBox} {unitPlural}/Box</strong>
              </div>
            </div>

            <div className="py-3 border-y border-slate-100 space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{unitPrice.toLocaleString('en-IN')} <small className="text-xs font-normal text-slate-400">/ {unitSingular}</small>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                1 Box = {unitsPerBox} {unitPlural} (₹{boxPrice.toLocaleString('en-IN')} / Box)
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t('selectQuantity')}</label>
              <QuantitySelector error={quantityError} isBox={isBox} minimum={minBoxes} onChange={updateBoxes} value={boxes} />
              <div className="text-xs font-semibold text-slate-600">
                Total: {totalQuantity} {totalUnitLabel} (₹{(boxPrice * boxes).toLocaleString('en-IN')})
              </div>
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold" role="status">
                {successMessage}
              </div>
            )}

            <button 
              className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all cursor-pointer" 
              onClick={handleAddToCart} 
              type="button"
            >
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

