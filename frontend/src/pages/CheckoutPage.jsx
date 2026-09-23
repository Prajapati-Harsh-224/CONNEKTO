import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { createCheckoutRequest } from '../services/checkoutService.js'
import { getCart, clearCart, removeFromCart, updateCartItem } from '../utils/cartStorage.js'

function priceValue(value) {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0
}

function formatPrice(value) {
  return `Rs\u00A0${Number(value || 0).toLocaleString('en-IN')}`
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function getSupplierDetails(fallbackName) {
  return {
    name: fallbackName || 'Supplier',
    category: '',
    location: '',
    verified: false,
  }
}

function normalizePaymentMethod(value) {
  const normalized = String(value || '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
  return ['CASH_ON_DELIVERY', 'PAY_LATER', 'REQUEST_ORDER'].includes(normalized) ? normalized : ''
}

function getCheckoutPaymentMethod(checkout) {
  const candidates = [
    checkout.paymentMethod,
    checkout.payment_method,
    ...(checkout.supplierOrders || []).flatMap((order) => [order.paymentMethod, order.payment_method]),
  ]
  return candidates.map(normalizePaymentMethod).find(Boolean) || ''
}

function getConfirmationContent(paymentMethod, t, orderId) {
  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod)
  if (normalizedPaymentMethod === 'CASH_ON_DELIVERY' || normalizedPaymentMethod === 'PAY_LATER') {
    const isCashOnDelivery = normalizedPaymentMethod === 'CASH_ON_DELIVERY'
    return {
      breadcrumb: t('order'),
      badge: t('orderPlacedSuccessfully'),
      heading: t('orderPlaced', { id: orderId }),
      description: isCashOnDelivery ? t('cashOnDeliveryConfirmation') : t('payLaterConfirmation'),
      sentTitle: t('orderConfirmationTitle'),
      sentDescription: isCashOnDelivery ? t('cashOnDeliveryConfirmationDescription') : t('payLaterConfirmationDescription'),
      status: t('orderPlacedStatus'),
      summary: t('orderSummary'),
      currentNext: t('orderPlacedStatus'),
      suppliersNext: t('confirmationSuppliersPrepare'),
      updatesNext: t('confirmationDeliveryUpdates'),
      note: t('orderConfirmationNote'),
    }
  }

  return {
    breadcrumb: t('orderRequest'),
    badge: t('orderRequestCreated'),
    heading: t('requestReceived', { id: orderId }),
    description: t('prototypeOrderRequest'),
    sentTitle: t('confirmationSentTitle'),
    sentDescription: t('confirmationSentDescription'),
    status: t('confirmationRequestSent'),
    summary: t('requestSummary'),
    currentNext: t('confirmationRequestSent'),
    suppliersNext: t('confirmationSuppliersReview'),
    updatesNext: t('confirmationUpdatesOrders'),
    note: t('confirmationPrototypeNote'),
  }
}

export default function CheckoutPage() {
  const { t } = useLocale()
  const [cart, setCart] = useState(getCart)
  const [paymentMethod, setPaymentMethod] = useState('REQUEST_ORDER')
  const [quantityErrors, setQuantityErrors] = useState({})
  const [collapsedSuppliers, setCollapsedSuppliers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkout, setCheckout] = useState(null)
  const [checkoutRequestKey] = useState(() => globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const methods = [
    { value: 'CASH_ON_DELIVERY', label: t('cashOnDelivery'), description: t('payWhenSupplierDelivers') },
    { value: 'PAY_LATER', label: t('payLater'), description: t('requestAgreedSupplierTerms') },
    { value: 'REQUEST_ORDER', label: t('requestOrder'), description: t('sendOrderRequestWithoutPayment') },
  ]

  const groups = useMemo(() => cart.reduce((result, item) => {
    const details = { ...getSupplierDetails(item.supplierName), category: item.category || '', location: item.serviceArea || '' }
    const group = result.find((entry) => entry.supplierId === item.supplierId)
    if (group) group.items.push(item)
    else result.push({ supplierId: item.supplierId, ...details, items: [item] })
    return result
  }, []), [cart])
  const total = cart.reduce((sum, item) => sum + priceValue(item.unitPrice) * Number(item.quantity), 0)
  const totalBoxes = cart.reduce((sum, item) => sum + Number(item.boxes || 1), 0)

  function notifyCartUpdated() {
    window.dispatchEvent(new Event('connecto-cart-updated'))
  }

  function changeQuantity(item, nextBoxesOrQuantity) {
    const numericValue = Number(nextBoxesOrQuantity)
    if (!Number.isInteger(numericValue) || numericValue < 1) {
      setQuantityErrors((current) => ({
        ...current,
        [item.productId]: t('minimumOrderIsOneBox')
      }))
      return
    }
    setQuantityErrors((current) => ({ ...current, [item.productId]: '' }))
    setCart(updateCartItem(item.productId, item.supplierId, numericValue))
    notifyCartUpdated()
  }

  function removeItem(item) {
    setCart(removeFromCart(item.productId, item.supplierId))
    notifyCartUpdated()
  }

  function clearSupplier(group) {
    setCart(group.items.reduce((currentCart, item) => removeFromCart(item.productId, item.supplierId), getCart()))
    notifyCartUpdated()
  }

  async function submitRequest(event) {
    event.preventDefault()
    setError('')
    if (!cart.length) return
    setIsSubmitting(true)
    try {
      const response = await createCheckoutRequest(paymentMethod, cart, checkoutRequestKey)
      const createdCheckout = response.data.checkout
      setCheckout(createdCheckout)
      clearCart()
      notifyCartUpdated()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkout) {
    const checkoutPaymentMethod = getCheckoutPaymentMethod(checkout)
    const confirmation = getConfirmationContent(checkoutPaymentMethod, t, checkout.id)
    const checkoutOrders = checkout.supplierOrders || []
    const checkoutTotal = checkoutOrders.reduce((sum, order) => sum + priceValue(order.subtotal), 0)
    const checkoutItemCount = checkoutOrders.reduce((sum, order) => sum + (order.items || []).length, 0)

    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{confirmation.breadcrumb}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <main className="space-y-6">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-xl shrink-0 shadow-xs" aria-hidden="true">
                ✓
              </div>
              <div className="space-y-1">
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  {confirmation.badge}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{confirmation.heading}</h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{confirmation.description}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <strong className="text-sm font-bold text-slate-900 block">{confirmation.sentTitle}</strong>
              <p className="text-xs text-slate-500 leading-relaxed">{confirmation.sentDescription}</p>
              <p className="text-xs text-slate-500">{t('confirmationTrackMessage')}</p>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('confirmationSupplierOrders')} <span className="text-xs font-normal text-slate-500">({checkoutOrders.length})</span>
              </h2>
              <Link className="text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner/orders">
                {t('confirmationViewOrders')} →
              </Link>
            </div>

            <div className="space-y-4">
              {checkoutOrders.map((order) => {
                const orderItems = order.items || []
                const itemCount = orderItems.length
                const productNames = orderItems.map((item) => item.name).filter(Boolean).join(', ') || t('confirmationItemsPending')
                const orderConfirmation = getConfirmationContent(order.paymentMethod || order.payment_method || checkoutPaymentMethod, t, checkout.id)

                return (
                  <article className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3" key={order.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs shrink-0 shadow-xs">
                          {getInitials(order.supplierName)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{order.supplierName}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                              {orderConfirmation.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{order.location} • {order.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-500 block">{order.id}</span>
                        <strong className="text-sm sm:text-base font-black text-slate-900">{formatPrice(priceValue(order.subtotal))}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div>
                        <span>{t('confirmationItems')}: </span>
                        <strong className="text-slate-800 font-semibold">{itemCount}</strong>
                        <span className="mx-1">•</span>
                        <span className="truncate max-w-[200px] inline-block align-bottom">{productNames}</span>
                      </div>
                      <Link className="font-bold text-brand-orange hover:underline whitespace-nowrap shrink-0" to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}>
                        {t('confirmationViewOrder')} →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            <Link className="inline-block text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner">
              ← {t('backToDashboard')}
            </Link>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-20">
            <section className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">{confirmation.summary}</h2>
              <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                <span>{t('confirmationTotalSuppliers')}</span>
                <strong className="font-bold text-slate-900">{checkoutOrders.length}</strong>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                <span>{t('confirmationTotalItems')}</span>
                <strong className="font-bold text-slate-900">{checkoutItemCount}</strong>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>{t('confirmationTotalAmount')}</span>
                <span>{formatPrice(checkoutTotal)}</span>
              </div>
            </section>

            <section className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">{t('confirmationWhatNext')}</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-brand-orange font-black">●</span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">{confirmation.currentNext}</strong>
                    <small className="text-slate-500">{confirmation.sentDescription}</small>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-300 font-black">○</span>
                  <div>
                    <strong className="text-slate-700 block font-semibold">{confirmation.suppliersNext}</strong>
                    <small className="text-slate-500">{confirmation.updatesNext}</small>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-300 font-black">○</span>
                  <div>
                    <strong className="text-slate-700 block font-semibold">{t('confirmationTrackManage')}</strong>
                    <small className="text-slate-500">{t('confirmationTrackDetails')}</small>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    )
  }

  if (!cart.length) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{t('checkout')}</span>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <EmptyState title={t('cartEmpty')} message={t('addProductsBeforeOrder')} />
          <Link 
            className="inline-block px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm shadow-xs hover:shadow transition-all" 
            to="/dashboard/shop-owner/suppliers"
          >
            {t('browseSuppliers')}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>{t('shopOwner')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('checkout')}</span>
      </div>

      <div className="pb-2 border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('checkoutReview')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('checkoutDescription')}</p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-950">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">✓</span>
        <div className="text-xs sm:text-sm">
          <strong className="font-bold block">{t('orderingFromMultipleSuppliers')}</strong>
          <span className="text-blue-700">{t('checkoutSeparateOrdersNote')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900">{t('orderItemsBySupplier')}</h2>
          {groups.map((group) => {
            const subtotal = group.items.reduce((sum, item) => sum + priceValue(item.unitPrice) * Number(item.quantity), 0)
            const collapsed = collapsedSuppliers[group.supplierId]
            return (
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" key={group.supplierId}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm shadow-xs" aria-hidden="true">
                      {getInitials(group.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{group.name}</h3>
                        {group.verified && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">● {t('verified')}</span>}
                      </div>
                      <p className="text-xs text-slate-500">{group.location} • {group.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <small className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{t('supplierSubtotal')}</small>
                      <strong className="text-base sm:text-lg font-black text-slate-900">{formatPrice(subtotal)}</strong>
                    </div>
                    <button 
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition-colors cursor-pointer text-xs font-bold" 
                      type="button" 
                      aria-label={collapsed ? t('expandSupplier', { supplier: group.name }) : t('collapseSupplier', { supplier: group.name })} 
                      aria-expanded={!collapsed} 
                      onClick={() => setCollapsedSuppliers((current) => ({ ...current, [group.supplierId]: !current[group.supplierId] }))}
                    >
                      {collapsed ? '▼' : '▲'}
                    </button>
                  </div>
                </div>

                {!collapsed && (
                  <div className="divide-y divide-slate-100 p-4 sm:p-5">
                    {group.items.map((item) => {
                      const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
                      const boxes = Number(item.boxes || Math.max(1, Math.round(Number(item.quantity || unitsPerBox) / unitsPerBox)))
                      const unitPrice = priceValue(item.unitPrice)
                      const boxPrice = unitPrice * unitsPerBox

                      return (
                        <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={`${item.supplierId}-${item.productId}`}>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <ProductImage 
                              alt={`${item.name} product`} 
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100" 
                              fallbackText={(item.name || 'P').slice(0, 1).toUpperCase()} 
                              src={item.imageUrl || item.imageLabel || ''} 
                            />
                            <div className="flex flex-col min-w-0">
                              <strong className="text-sm sm:text-base font-bold text-slate-900 truncate">{item.name}</strong>
                              <span className="text-xs text-slate-400 font-medium">{item.packSize} • {item.brand}</span>
                              <div className="text-xs text-emerald-700 font-semibold mt-1">
                                {unitsPerBox > 1
                                  ? `1 ${t('box')} = ${unitsPerBox} ${t('packetsShort')} (${formatPrice(boxPrice)}/${t('box')})`
                                  : `${formatPrice(boxPrice)} / ${t('unit') || 'unit'}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <QuantitySelector
                              error={quantityErrors[item.productId]}
                              isBox={true}
                              minimum={1}
                              onChange={(val) => changeQuantity(item, val)}
                              value={boxes}
                            />
                            <div className="text-right min-w-[90px]">
                              <strong className="text-sm sm:text-base font-black text-slate-900 block">
                                {formatPrice(unitPrice * Number(item.quantity))}
                              </strong>
                              <span className="text-[11px] text-slate-400">{item.quantity} {t('packetsShort')}</span>
                            </div>
                            <button 
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-lg font-bold" 
                              type="button" 
                              aria-label={`Remove ${item.name}`} 
                              onClick={() => removeItem(item)}
                            >
                              ×
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <span>{group.items.length} {group.items.length === 1 ? t('itemCount') : t('itemsCount')}</span>
                  <button className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer" type="button" onClick={() => clearSupplier(group)}>
                    {t('clearSupplierCart')}
                  </button>
                </div>
              </section>
            )
          })}
          <Link className="inline-block text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors" to="/dashboard/shop-owner/cart">
            ← {t('backToCart')}
          </Link>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <form className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4" onSubmit={submitRequest}>
            <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">{t('orderSummary')}</h2>
            
            <div className="space-y-2 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>{t('totalSuppliers')}</span>
                <strong className="font-bold text-slate-800">{groups.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('totalBoxes')}</span>
                <strong className="font-bold text-slate-800">{totalBoxes}</strong>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>{t('totalAmount')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium" role="alert">{error}</p>}

            <button 
              className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer" 
              disabled={isSubmitting} 
              type="submit"
            >
              {isSubmitting ? t('sendingRequest') : `${t('placeOrder')} →`}
            </button>
            <small className="block text-[11px] text-slate-400 text-center">{t('checkoutSeparateOrdersNote')}</small>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">{t('howHandleIt')}</h2>
            <div className="space-y-2.5">
              {methods.map((method) => (
                <label 
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === method.value 
                      ? 'bg-orange-50/50 border-brand-orange ring-1 ring-brand-orange' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`} 
                  key={method.value}
                >
                  <input 
                    checked={paymentMethod === method.value} 
                    className="mt-1 accent-brand-orange" 
                    name="paymentMethod" 
                    onChange={() => setPaymentMethod(method.value)} 
                    type="radio" 
                    value={method.value} 
                  />
                  <div className="flex flex-col">
                    <strong className="text-xs sm:text-sm font-bold text-slate-900">{method.label}</strong>
                    <small className="text-[11px] text-slate-400 font-medium">{method.description}</small>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong className="text-slate-700 block font-semibold">{t('secureSplitPayments')}</strong>
                <small className="text-slate-400">{t('secureSplitPaymentsDescription')}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
