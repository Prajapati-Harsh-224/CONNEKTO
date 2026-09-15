import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getCart, removeFromCart, updateCartItem } from '../utils/cartStorage.js'

function parsePrice(value) {
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
    serviceAreas: [],
    verified: false,
  }
}

export default function ShopOwnerCartPage() {
  const { t } = useLocale()
  const [cart, setCart] = useState(getCart)
  const [quantityErrors, setQuantityErrors] = useState({})
  const [collapsedSuppliers, setCollapsedSuppliers] = useState({})

  const groups = useMemo(() => cart.reduce((supplierGroups, item) => {
    const details = { ...getSupplierDetails(item.supplierName), category: item.category || '', location: item.serviceArea || '' }
    const group = supplierGroups.find((entry) => entry.supplierId === item.supplierId)
    if (group) {
      group.items.push(item)
      group.subtotal += parsePrice(item.unitPrice) * Number(item.quantity)
      group.itemQuantity += Number(item.quantity)
    } else {
      supplierGroups.push({ supplierId: item.supplierId, ...details, items: [item], subtotal: parsePrice(item.unitPrice) * Number(item.quantity), itemQuantity: Number(item.quantity) })
    }
    return supplierGroups
  }, []), [cart])

  const total = cart.reduce((sum, item) => sum + parsePrice(item.unitPrice) * Number(item.quantity), 0)
  const totalBoxes = cart.reduce((sum, item) => sum + Number(item.boxes || 1), 0)

  function notifyCartUpdated() {
    window.dispatchEvent(new Event('connecto-cart-updated'))
  }

  function changeQuantity(item, nextValue) {
    const numericValue = Number(nextValue)
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

  if (!cart.length) return <section className="cart-page cart-empty-page"><div className="cart-breadcrumb">{t('shopOwner')} <span>›</span> {t('cart')}</div><h1 className="cart-empty-heading">{t('cartEmpty')}</h1><EmptyState title={t('noItemsAdded')} message={t('browseCatalogToStart')} /><Link className="button primary" to="/dashboard/shop-owner/suppliers">{t('browseSuppliers')}</Link></section>

  return (
    <section className="cart-page">
      <div className="cart-breadcrumb"><span>{t('shopOwner')}</span><span>›</span><span>{t('cart')}</span></div>
      <div className="cart-heading"><div><h1>{t('yourCart')}</h1><p>{t('cartReview')}</p></div></div>
      <div className="cart-layout">
        <div className="cart-groups">
          {groups.map((group) => {
            const isCollapsed = collapsedSuppliers[group.supplierId]
            return <section className="cart-supplier-group" key={group.supplierId}>
              <div className="cart-group-heading">
                <div className="cart-supplier-identity"><div className="cart-supplier-avatar" aria-hidden="true">{getInitials(group.name)}</div><div><div className="cart-supplier-name-row"><h2>{group.name}</h2>{group.verified && <span className="cart-verified">● Verified Supplier</span>}</div><div className="cart-supplier-meta"><span>{group.location}</span><span>|</span><span>{group.category}</span></div></div></div>
                <div className="cart-group-summary"><span>{t('supplierSubtotal')}</span><strong>{formatPrice(group.subtotal)}</strong></div>
                <button className="cart-collapse-button" type="button" aria-label={isCollapsed ? `Expand ${group.name}` : `Collapse ${group.name}`} aria-expanded={!isCollapsed} onClick={() => setCollapsedSuppliers((current) => ({ ...current, [group.supplierId]: !current[group.supplierId] }))}>{isCollapsed ? '⌄' : '⌃'}</button>
              </div>
              {!isCollapsed && <div className="cart-group-items">{group.items.map((item) => {
                const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
                const boxes = Number(item.boxes || Math.max(1, Math.round(Number(item.quantity || unitsPerBox) / unitsPerBox)))
                return (
                  <article className="cart-item" key={`${item.supplierId}-${item.productId}`}>
                    <ProductImage alt={`${item.name} cart item`} aria-hidden="true" className="cart-item-art" fallbackText={(item.name || 'P').slice(0, 1).toUpperCase()} src={item.imageUrl || item.imageLabel || ''} />
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.packSize} <b>|</b> {item.brand}</span>
                      <small>
                        {formatPrice(parsePrice(item.unitPrice))}/packet
                        <span style={{ display: 'block', color: '#047857', fontWeight: '600' }}>1 Box = {unitsPerBox} packets ({formatPrice(parsePrice(item.unitPrice) * unitsPerBox)}/box)</span>
                      </small>
                      <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '0.25rem', fontWeight: '500' }}>{item.quantity} packets</div>
                    </div>
                    <QuantitySelector
                      error={quantityErrors[item.productId]}
                      isBox={true}
                      minimum={1}
                      onChange={(val) => changeQuantity(item, val)}
                      value={boxes}
                    />
                    <strong className="cart-item-subtotal">{formatPrice(parsePrice(item.unitPrice) * Number(item.quantity))}</strong>
                    <button className="remove-item" onClick={() => removeItem(item)} type="button" aria-label={`Remove ${item.name}`}>×</button>
                  </article>
                )
              })}</div>}
              <div className="cart-group-footer"><span>{group.items.length} {group.items.length === 1 ? t('itemCount') : t('itemsCount')}</span><button type="button" onClick={() => group.items.forEach(removeItem)}>Clear supplier cart</button></div>
            </section>
          })}
        </div>
        <aside className="cart-total-panel"><div className="cart-summary-heading"><span className="cart-summary-icon" aria-hidden="true">▣</span><h2>{t('orderSummary')}</h2></div><div className="cart-summary-stat"><span>Total Suppliers</span><strong>{groups.length}</strong></div><div className="cart-summary-stat"><span>Total Boxes</span><strong>{totalBoxes}</strong></div><div className="cart-summary-total"><span>Total Amount</span><strong>{formatPrice(total)}</strong></div><Link className="button primary" to="/dashboard/shop-owner/checkout">{t('continueToCheckout')} <span aria-hidden="true">→</span></Link><div className="cart-trust-note"><strong>Secure & split payments</strong><span>Your payment will be securely processed for each supplier.</span></div><Link className="cart-continue-shopping" to="/dashboard/shop-owner/suppliers">‹&nbsp; Continue Shopping</Link></aside>
      </div>
    </section>
  )
}
