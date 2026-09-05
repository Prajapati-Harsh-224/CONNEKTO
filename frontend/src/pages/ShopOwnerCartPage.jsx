import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getCart, removeFromCart, updateCartItem } from '../utils/cartStorage.js'
import { findSupplier } from '../utils/supplierDemoData.js'

function parsePrice(value) {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0
}

function formatPrice(value) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function ShopOwnerCartPage() {
  const { t } = useLocale()
  const [cart, setCart] = useState(getCart)
  const [quantityErrors, setQuantityErrors] = useState({})

  const groups = useMemo(() => cart.reduce((supplierGroups, item) => {
    const supplierName = item.supplierName || findSupplier(item.supplierId)?.name || t('supplier')
    const group = supplierGroups.find((entry) => entry.supplierId === item.supplierId)
    if (group) {
      group.items.push(item)
      group.subtotal += parsePrice(item.unitPrice) * Number(item.quantity)
    } else {
      supplierGroups.push({ supplierId: item.supplierId, supplierName, items: [item], subtotal: parsePrice(item.unitPrice) * Number(item.quantity) })
    }
    return supplierGroups
  }, []), [cart, t])

  const total = cart.reduce((sum, item) => sum + parsePrice(item.unitPrice) * item.quantity, 0)

  function changeQuantity(item, nextQuantity) {
    const numericQuantity = Number(nextQuantity)
    const minimum = Number(item.minimumQuantity || 1)
    if (!Number.isInteger(numericQuantity) || numericQuantity < minimum) {
      setQuantityErrors((current) => ({ ...current, [item.productId]: t('wholeNumberAtLeast', { minimum }) }))
      return
    }
    setQuantityErrors((current) => ({ ...current, [item.productId]: '' }))
    setCart(updateCartItem(item.productId, item.supplierId, numericQuantity))
  }

  function removeItem(item) {
    setCart(removeFromCart(item.productId, item.supplierId))
  }

  if (!cart.length) return <section className="cart-page"><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('cartEmpty')}</h1><EmptyState title={t('noItemsAdded')} message={t('browseCatalogToStart')} /><Link className="button primary" to="/dashboard/shop-owner/suppliers">{t('browseSuppliers')}</Link></section>

  return <section className="cart-page">
    <div className="cart-heading"><div><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('yourCart')}</h1><p className="muted">{t('cartReview')}</p></div><span className="summary-period">{cart.length} {cart.length === 1 ? t('itemCount') : t('itemsCount')}</span></div>
    <div className="cart-layout"><div className="cart-groups">{groups.map((group) => <section className="cart-supplier-group" key={group.supplierId}><div className="cart-group-heading"><div><span className="section-kicker">{t('supplier')}</span><h2>{group.supplierName}</h2></div><div className="cart-group-summary"><span>{group.items.length} {group.items.length === 1 ? t('itemCount') : t('itemsCount')}</span><strong>{formatPrice(group.subtotal)}</strong><small>{t('supplierSubtotal')}</small></div></div>{group.items.map((item) => <article className="cart-item" key={`${item.supplierId}-${item.productId}`}><ProductImage alt={`${item.name} cart item`} aria-hidden="true" className="cart-item-art" fallbackText={(item.name || 'P').slice(0, 1).toUpperCase()} src={item.imageUrl || item.imageLabel || ''} /><div className="cart-item-info"><strong>{item.name}</strong><span>{item.brand} · {item.packSize}</span><small>{item.unitPrice} each</small></div><QuantitySelector error={quantityErrors[item.productId]} minimum={Number(item.minimumQuantity || 1)} onChange={(quantity) => changeQuantity(item, quantity)} value={item.quantity} /><strong className="cart-item-subtotal">{formatPrice(parsePrice(item.unitPrice) * item.quantity)}</strong><button className="remove-item" onClick={() => removeItem(item)} type="button">{t('remove')}</button></article>)}</section>)}</div><aside className="cart-total-panel"><span className="section-kicker">{t('cartTotal')}</span><h2>{formatPrice(total)}</h2><p className="muted">{t('supplierSubtotal')}</p><Link className="button primary" to="/dashboard/shop-owner/checkout">{t('continueToCheckout')}</Link></aside></div>
  </section>
}
