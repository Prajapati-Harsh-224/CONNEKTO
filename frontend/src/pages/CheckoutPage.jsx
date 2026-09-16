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
  return `Rs ${value.toLocaleString('en-IN')}`
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
        [item.productId]: 'Minimum order is 1 box'
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
      <section className="confirmation-page">
        <div className="confirmation-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{confirmation.breadcrumb}</span></div>
        <div className="confirmation-layout">
          <main className="confirmation-main">
            <div className="confirmation-hero"><div className="confirmation-mark" aria-hidden="true">✓</div><div><span className="confirmation-badge">{confirmation.badge}</span><h1>{confirmation.heading}</h1><p>{confirmation.description}</p></div></div>
            <div className="confirmation-info-card"><span className="confirmation-info-icon" aria-hidden="true">✓</span><div><strong>{confirmation.sentTitle}</strong><p>{confirmation.sentDescription}</p><p>{t('confirmationTrackMessage')}</p></div></div>
            <div className="confirmation-orders-heading"><h2>{t('confirmationSupplierOrders')} <span>({checkoutOrders.length})</span></h2><Link to="/dashboard/shop-owner/orders">{t('confirmationViewOrders')} →</Link></div>
            <div className="supplier-order-list">{checkoutOrders.map((order) => {
              const orderItems = order.items || []
              const itemCount = orderItems.length
              const productNames = orderItems.map((item) => item.name).filter(Boolean).join(', ') || t('confirmationItemsPending')
              const orderConfirmation = getConfirmationContent(order.paymentMethod || order.payment_method || checkoutPaymentMethod, t, checkout.id)
              return <article className="supplier-order-row" key={order.id}><div className="confirmation-order-header"><div className="confirmation-order-identity"><span className="confirmation-order-avatar" aria-hidden="true">{getInitials(order.supplierName)}</span><div><div className="confirmation-order-name"><h3>{order.supplierName}</h3><span>{orderConfirmation.status}</span></div><p>{order.location} <b>|</b> {order.category}</p></div></div><div className="confirmation-order-total"><span>{order.id}</span><strong>{formatPrice(priceValue(order.subtotal))}</strong></div></div><div className="confirmation-order-details"><div><span>{t('confirmationItems')}</span><strong>{itemCount}</strong></div><div><span>{t('confirmationProducts')}</span><strong>{productNames}</strong></div><Link className="confirmation-view-order" to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`}>{t('confirmationViewOrder')} →</Link></div></article>
            })}</div>
            <Link className="confirmation-back-dashboard" to="/dashboard/shop-owner">← {t('backToDashboard')}</Link>
          </main>
          <aside className="confirmation-side-column"><section className="confirmation-summary-card"><div className="confirmation-side-title"><span aria-hidden="true">▣</span><h2>{confirmation.summary}</h2></div><div className="confirmation-summary-row"><span>{t('confirmationTotalSuppliers')}</span><strong>{checkoutOrders.length}</strong></div><div className="confirmation-summary-row"><span>{t('confirmationTotalItems')}</span><strong>{checkoutItemCount}</strong></div><div className="confirmation-summary-total"><span>{t('confirmationTotalAmount')}</span><strong>{formatPrice(checkoutTotal)}</strong></div></section><section className="confirmation-next-card"><h2>{t('confirmationWhatNext')}</h2><div className="confirmation-timeline"><div className="current"><span>●</span><div><strong>{confirmation.currentNext}</strong><small>{confirmation.sentDescription}</small></div></div><div><span>○</span><div><strong>{confirmation.suppliersNext}</strong><small>{confirmation.updatesNext}</small></div></div><div><span>○</span><div><strong>{t('confirmationTrackManage')}</strong><small>{t('confirmationTrackDetails')}</small></div></div></div></section><aside className="confirmation-note"><strong>{t('confirmationNote')}</strong><p>{confirmation.note}</p></aside></aside>
        </div>
      </section>
    )
  }
  if (!cart.length) return <section className="checkout-page checkout-empty"><div className="checkout-breadcrumb">{t('shopOwner')} <span>›</span> {t('checkout')}</div><EmptyState title={t('cartEmpty')} message={t('addProductsBeforeOrder')} /><Link className="button primary" to="/dashboard/shop-owner/suppliers">{t('browseSuppliers')}</Link></section>

  return (
    <section className="checkout-page">
      <div className="checkout-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{t('checkout')}</span></div>
      <div className="checkout-heading"><h1>{t('checkoutReview')}</h1><p>{t('checkoutDescription')}</p></div>
      <div className="checkout-multi-banner"><span className="checkout-banner-icon" aria-hidden="true">✓</span><div><strong>You're ordering from multiple suppliers</strong><span>This checkout will create separate orders for each supplier.</span></div></div>
      <div className="checkout-layout">
        <div className="checkout-breakdown"><h2 className="checkout-section-title">Order items by supplier</h2>{groups.map((group) => {
          const subtotal = group.items.reduce((sum, item) => sum + priceValue(item.unitPrice) * Number(item.quantity), 0)
          const collapsed = collapsedSuppliers[group.supplierId]
          return <section className="checkout-supplier" key={group.supplierId}>
            <div className="checkout-supplier-header"><div className="checkout-supplier-identity"><div className="checkout-supplier-avatar" aria-hidden="true">{getInitials(group.name)}</div><div><div className="checkout-supplier-name"><h3>{group.name}</h3>{group.verified && <span>● Verified Supplier</span>}</div><p>{group.location} <b>|</b> {group.category}</p></div></div><div className="checkout-supplier-total"><small>Supplier subtotal</small><strong>{formatPrice(subtotal)}</strong></div><button className="checkout-collapse" type="button" aria-label={collapsed ? `Expand ${group.name}` : `Collapse ${group.name}`} aria-expanded={!collapsed} onClick={() => setCollapsedSuppliers((current) => ({ ...current, [group.supplierId]: !current[group.supplierId] }))}>{collapsed ? '⌄' : '⌃'}</button></div>
            {!collapsed && <div className="checkout-supplier-items">{group.items.map((item) => {
              const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
              const boxes = Number(item.boxes || Math.max(1, Math.round(Number(item.quantity || unitsPerBox) / unitsPerBox)))
              const unitPrice = priceValue(item.unitPrice)
              const boxPrice = unitPrice * unitsPerBox

              return (
                <article className="checkout-item" key={`${item.supplierId}-${item.productId}`}>
                  <ProductImage alt={`${item.name} product`} className="checkout-item-image" fallbackText={(item.name || 'P').slice(0, 1).toUpperCase()} src={item.imageUrl || item.imageLabel || ''} />
                  <div className="checkout-item-info">
                    <strong>{item.name}</strong>
                    <span>{item.packSize} <b>|</b> {item.brand}</span>
                    <small>
                      {formatPrice(unitPrice)}/packet
                      <span style={{ display: 'block', color: '#047857', fontWeight: '600' }}>1 Box = {unitsPerBox} packets ({formatPrice(boxPrice)}/box)</span>
                    </small>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.2rem', fontWeight: '500' }}>{item.quantity} packets</div>
                  </div>
                  <QuantitySelector
                    error={quantityErrors[item.productId]}
                    isBox={true}
                    minimum={1}
                    onChange={(val) => changeQuantity(item, val)}
                    value={boxes}
                  />
                  <strong className="checkout-item-total">{formatPrice(unitPrice * Number(item.quantity))}</strong>
                  <button className="checkout-remove" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item)}>×</button>
                </article>
              )
            })}</div>}
            <div className="checkout-supplier-footer"><span>{group.items.length} {group.items.length === 1 ? t('itemCount') : t('itemsCount')}</span><button type="button" onClick={() => clearSupplier(group)}>Clear supplier items</button></div>
          </section>
        })}<Link className="checkout-back-link" to="/dashboard/shop-owner/cart">← {t('backToCart')}</Link></div>
        <div className="checkout-side-column"><form className="checkout-summary-card" onSubmit={submitRequest}><div className="checkout-card-title"><span aria-hidden="true">▣</span><h2>{t('orderSummary')}</h2></div><div className="checkout-summary-row"><span>Total Suppliers</span><strong>{groups.length}</strong></div><div className="checkout-summary-row"><span>Total Boxes</span><strong>{totalBoxes}</strong></div><div className="checkout-summary-total"><span>Total Amount</span><strong>{formatPrice(total)}</strong></div>{error && <p className="form-message error" role="alert">{error}</p>}<button className="checkout-place-order" disabled={isSubmitting} type="submit">{isSubmitting ? t('sendingRequest') : 'Place Order →'}</button><small className="checkout-prototype-note">This will create separate orders for each supplier.</small></form><div className="checkout-method-card"><h2>{t('howHandleIt')}</h2><div className="checkout-method-list">{methods.map((method) => <label className={`checkout-method${paymentMethod === method.value ? ' selected' : ''}`} key={method.value}><input checked={paymentMethod === method.value} name="paymentMethod" onChange={() => setPaymentMethod(method.value)} type="radio" value={method.value} /><span><strong>{method.label}</strong><small>{method.description}</small></span></label>)}</div><div className="checkout-secure-note"><span aria-hidden="true">✓</span><div><strong>Secure & split payments</strong><small>Your payment will be securely processed and split with each supplier.</small></div></div></div></div>
      </div>
    </section>
  )
}
