import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { createCheckoutRequest } from '../services/checkoutService.js'
import { getCart, clearCart } from '../utils/cartStorage.js'
import { findSupplier } from '../utils/supplierDemoData.js'

function priceValue(value) {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0
}
function formatPrice(value) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function CheckoutPage() {
  const { t } = useLocale()
  const [cart] = useState(getCart)
  const [paymentMethod, setPaymentMethod] = useState('REQUEST_ORDER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkout, setCheckout] = useState(null)
  const methods = [
    { value: 'CASH_ON_DELIVERY', label: t('cashOnDelivery'), description: t('payWhenSupplierDelivers') },
    { value: 'PAY_LATER', label: t('payLater'), description: t('requestAgreedSupplierTerms') },
    { value: 'REQUEST_ORDER', label: t('requestOrder'), description: t('sendOrderRequestWithoutPayment') },
  ]
  const groups = useMemo(() => cart.reduce((result, item) => {
    const group = result.find((entry) => entry.supplierId === item.supplierId)
    if (group) group.items.push(item)
    else result.push({ supplierId: item.supplierId, supplierName: item.supplierName || findSupplier(item.supplierId)?.name || t('supplier'), items: [item] })
    return result
  }, []), [cart, t])
  const total = cart.reduce((sum, item) => sum + priceValue(item.unitPrice) * item.quantity, 0)

  async function submitRequest(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await createCheckoutRequest(paymentMethod, cart)
      setCheckout(response.data.checkout)
      clearCart()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkout) return <section className="checkout-page confirmation-page"><div className="confirmation-mark" aria-hidden="true">OK</div><div className="eyebrow">{t('orderRequestCreated')}</div><h1>{t('requestReceived', { id: checkout.id })}</h1><p className="muted">{t('prototypeOrderRequest')}</p><div className="supplier-order-list">{checkout.supplierOrders.map((order) => <div className="supplier-order-row" key={order.id}><span>{order.supplierName}</span><strong>{order.id}</strong><small>{formatPrice(order.subtotal)} · {order.status}</small></div>)}</div><Link className="button primary" to="/dashboard/shop-owner">{t('backToDashboard')}</Link></section>
  if (!cart.length) return <section className="checkout-page"><EmptyState title={t('cartEmpty')} message={t('addProductsBeforeOrder')} /><Link className="button primary" to="/dashboard/shop-owner/suppliers">{t('browseSuppliers')}</Link></section>

  return <section className="checkout-page"><Link className="back-link" to="/dashboard/shop-owner/cart">← {t('backToCart')}</Link><div className="checkout-heading"><div><div className="eyebrow">{t('orderRequest')}</div><h1>{t('checkoutReview')}</h1><p className="muted">{t('checkoutDescription')}</p></div><span className="summary-period">{cart.length} {t('itemsCount')}</span></div><div className="checkout-layout"><div className="checkout-breakdown">{groups.map((group) => <section className="checkout-supplier" key={group.supplierId}><div className="section-heading"><div><span className="section-kicker">{t('supplierOrder')}</span><h2>{group.supplierName}</h2></div><strong>{formatPrice(group.items.reduce((sum, item) => sum + priceValue(item.unitPrice) * item.quantity, 0))}</strong></div>{group.items.map((item) => <div className="checkout-item" key={`${item.supplierId}-${item.productId}`}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(priceValue(item.unitPrice) * item.quantity)}</strong></div>)}</section>)}</div><form className="checkout-form" onSubmit={submitRequest}><span className="section-kicker">{t('orderMethod')}</span><h2>{t('howHandleIt')}</h2><div className="method-list">{methods.map((method) => <label className={`method-option${paymentMethod === method.value ? ' selected' : ''}`} key={method.value}><input checked={paymentMethod === method.value} name="paymentMethod" onChange={() => setPaymentMethod(method.value)} type="radio" value={method.value} /><span><strong>{method.label}</strong><small>{method.description}</small></span></label>)}</div><div className="checkout-total"><span>{t('estimatedTotal')}</span><strong>{formatPrice(total)}</strong></div>{error && <p className="form-message error" role="alert">{error}</p>}<button className="button primary form-submit" disabled={isSubmitting} type="submit">{isSubmitting ? t('sendingRequest') : t('placeOrderRequest')}</button><small className="prototype-note">{t('noPaymentInPrototype')}</small></form></div></section>
}
