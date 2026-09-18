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

  if (!cart.length) {
    return (
      <section className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t('shopOwner')}</span>
          <span aria-hidden="true">›</span>
          <span className="text-slate-700">{t('cart')}</span>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('cartEmpty')}</h1>
          <EmptyState title={t('noItemsAdded')} message={t('browseCatalogToStart')} />
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
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>{t('shopOwner')}</span>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('cart')}</span>
      </div>

      <div className="pb-2 border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{t('yourCart')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('cartReview')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          {groups.map((group) => {
            const isCollapsed = collapsedSuppliers[group.supplierId]
            return (
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" key={group.supplierId}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm shadow-xs" aria-hidden="true">
                      {getInitials(group.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">{group.name}</h2>
                        {group.verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            ● {t('verified')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                        <span>{group.location}</span>
                        {group.category && <span>• {group.category}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">{t('supplierSubtotal')}</span>
                      <strong className="text-base sm:text-lg font-black text-slate-900">{formatPrice(group.subtotal)}</strong>
                    </div>
                    <button 
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition-colors cursor-pointer text-xs font-bold" 
                      type="button" 
                      aria-label={isCollapsed ? t('expandSupplier', { supplier: group.name }) : t('collapseSupplier', { supplier: group.name })} 
                      aria-expanded={!isCollapsed} 
                      onClick={() => setCollapsedSuppliers((current) => ({ ...current, [group.supplierId]: !current[group.supplierId] }))}
                    >
                      {isCollapsed ? '▼' : '▲'}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 p-4 sm:p-5">
                    {group.items.map((item) => {
                      const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
                      const boxes = Number(item.boxes || Math.max(1, Math.round(Number(item.quantity || unitsPerBox) / unitsPerBox)))
                      return (
                        <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={`${item.supplierId}-${item.productId}`}>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <ProductImage 
                              alt={`${item.name} cart item`} 
                              aria-hidden="true" 
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100" 
                              fallbackText={(item.name || 'P').slice(0, 1).toUpperCase()} 
                              src={item.imageUrl || item.imageLabel || ''} 
                            />
                            <div className="flex flex-col min-w-0">
                              <strong className="text-sm sm:text-base font-bold text-slate-900 truncate">{item.name}</strong>
                              <span className="text-xs text-slate-400 font-medium">{item.packSize} • {item.brand}</span>
                              <div className="text-xs text-emerald-700 font-semibold mt-1">
                                1 {t('box')} = {unitsPerBox} {t('packetsShort')} ({formatPrice(parsePrice(item.unitPrice) * unitsPerBox)}/box)
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
                                {formatPrice(parsePrice(item.unitPrice) * Number(item.quantity))}
                              </strong>
                              <span className="text-[11px] text-slate-400">{item.quantity} {t('packetsShort')}</span>
                            </div>
                            <button 
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-lg font-bold" 
                              onClick={() => removeItem(item)} 
                              type="button" 
                              aria-label={`Remove ${item.name}`}
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
                  <button className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer" type="button" onClick={() => group.items.forEach(removeItem)}>
                    {t('clearSupplierCart')}
                  </button>
                </div>
              </section>
            )
          })}
        </div>

        <aside className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4 xl:sticky xl:top-20">
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

          <Link 
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-sm shadow-xs hover:shadow transition-all" 
            to="/dashboard/shop-owner/checkout"
          >
            {t('continueToCheckout')} <span aria-hidden="true">→</span>
          </Link>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-0.5">
            <strong className="font-bold text-slate-700 block">{t('secureSplitPayments')}</strong>
            <span>{t('secureSplitPaymentsDescription')}</span>
          </div>

          <Link 
            className="block text-center text-xs font-bold text-brand-orange hover:text-brand-orange-dark transition-colors pt-1" 
            to="/dashboard/shop-owner/suppliers"
          >
            ← {t('continueShopping')}
          </Link>
        </aside>
      </div>
    </section>
  )
}
