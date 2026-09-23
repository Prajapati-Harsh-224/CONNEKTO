import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplierOrder, updateSupplierOrderStatus } from '../services/supplierOrderService.js'

const statusTransitions = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
}

const paymentLabels = {
  CASH_ON_DELIVERY: 'cashOnDelivery',
  PAY_LATER: 'payLater',
  REQUEST_ORDER: 'requestOrder',
}

function normalizeOrder(order) {
  return {
    ...order,
    customer: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    shopOwner: order.shopOwnerName || order.shopOwnerId || 'Shop owner',
    phone: order.shopOwnerPhone || '',
    address: order.shopAddress || '',
    date: order.createdAt,
    subtotal: Number(order.subtotal || 0),
    total: Number(order.subtotal || 0),
    items: (order.items || []).map((item) => ({
      ...item,
      product: item.productNameSnapshot || item.name || 'Product',
      sku: item.productId,
      unitPrice: item.unitPriceSnapshot,
      total: item.lineTotal,
    })),
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function SupplierIncomingOrderDetailPage() {
  const { orderId } = useParams()
  const { t } = useLocale()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')
    setStatusError('')
    setOrder(null)

    getSupplierOrder(orderId)
      .then((response) => {
        if (isMounted) setOrder(response?.data?.order ? normalizeOrder(response.data.order) : null)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [orderId])

  const items = useMemo(() => order?.items || [], [order])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.total || item.unitPrice * item.quantity || 0), 0), [items])
  const total = Number(order?.total ?? order?.subtotal ?? subtotal ?? 0)

  async function updateStatus(event) {
    const nextStatus = event.target.value
    if (!nextStatus || !order) return
    setStatusError('')
    setIsUpdating(true)

    try {
      const response = await updateSupplierOrderStatus(order.id, nextStatus)
      setOrder(normalizeOrder(response?.data?.order || { ...order, status: nextStatus }))
    } catch (requestError) {
      setStatusError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingIncomingOrders')} />
  if (error) return <section className="space-y-4 p-4"><p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p><Link className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold text-slate-700" to="/dashboard/supplier/orders">{t('backToIncomingOrders')}</Link></section>
  if (!order) return <EmptyState title={t('orderNotFound')} message={t('orderUnavailable')} />

  const customerName = order.customer || order.shopOwner || 'Shop owner'
  const orderItemLabel = items.length === 1 ? t('itemCount') : t('itemsCount')
  const paymentLabelKey = paymentLabels[order.paymentMethod] || 'cashOnDelivery'

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link className="hover:text-slate-800" to="/dashboard/supplier/orders">{t('orders')}</Link>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-slate-800">{t('orderNumber', { id: order.id || order.orderId })}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t('supplierOrder')}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">{t('orderNumber', { id: order.id || order.orderId })}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('customerColon')} <strong className="text-slate-700 font-semibold">{customerName}</strong></p>
        </div>
        <div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('orderDate')}</span>
          <strong className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 block">{formatDate(order.date)}</strong>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('totalAmount')}</span>
          <strong className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block tabular-nums">{formatCurrency(total)}</strong>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('deliveryArea')}</span>
          <strong className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 block">{order.area || order.serviceArea || '—'}</strong>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('paymentMethod')}</span>
          <strong className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 block">{t(paymentLabelKey)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <main className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">{t('productsLabel')}</span>
                <h2 className="text-lg font-bold text-slate-900 font-serif">{t('orderItems')}</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {items.length} {orderItemLabel}
              </span>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_auto] text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
              <span>{t('product')}</span>
              <span>{t('amount')}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || 1)
                const isBox = unitsPerBox > 1
                const boxes = item.boxes || (isBox ? Math.floor(item.quantity / unitsPerBox) : item.quantity)
                const unitPrice = Number(String(item.unitPriceSnapshot || item.unitPrice || 0).replace(/[^0-9.]/g, ''))
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 text-xs" key={`${item.sku || item.product}-${index}`}>
                    <div>
                      <strong className="font-semibold text-slate-800 text-sm block">{item.product || item.name || t('product')}</strong>
                      <span className="text-slate-400 text-xs mt-0.5 block">
                        {isBox
                          ? `${boxes} ${boxes === 1 ? t('boxSingular') : t('boxPlural')} (${item.quantity} ${item.quantity === 1 ? t('packetSingular') : t('packetPlural')}) × ${formatCurrency(unitPrice)}/${t('packetSingular')}`
                          : `${item.quantity} ${item.quantity === 1 ? t('unitSingular') : t('unitsPlural')} × ${formatCurrency(unitPrice)}`}
                      </span>
                    </div>
                    <strong className="font-bold text-slate-900 text-sm tabular-nums self-end sm:self-center">{formatCurrency(item.total || unitPrice * (item.quantity || 1))}</strong>
                  </div>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1 text-sm">
              <div className="flex justify-between items-center text-slate-600 text-xs">
                <span>{t('supplierSubtotal')}</span>
                <strong className="font-semibold text-slate-900 tabular-nums">{formatCurrency(subtotal)}</strong>
              </div>
              {total !== subtotal && (
                <div className="flex justify-between items-center text-slate-600 text-xs">
                  <span>{t('totalAmount')}</span>
                  <strong className="font-bold text-slate-900 text-base tabular-nums">{formatCurrency(total)}</strong>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">{t('customerInformation')}</span>
              <h2 className="text-lg font-bold text-slate-900 font-serif">{t('customerDeliveryDetails')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <label className="text-slate-400 font-medium block">{t('shopCustomer')}</label>
                <strong className="font-bold text-slate-800 text-sm block mt-0.5">{customerName}</strong>
                <small className="text-slate-400">{order.area || order.serviceArea || '—'}</small>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <label className="text-slate-400 font-medium block">{t('shopOwner')}</label>
                <strong className="font-bold text-slate-800 text-sm block mt-0.5">{order.shopOwner || customerName}</strong>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <label className="text-slate-400 font-medium block">{t('phoneNumber')}</label>
                <strong className="font-bold text-slate-800 text-sm block mt-0.5">{order.phone || '—'}</strong>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <label className="text-slate-400 font-medium block">{t('deliveryAddress')}</label>
                <strong className="font-bold text-slate-800 text-sm block mt-0.5">{order.address || order.area || '—'}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {order.phone && (
                <a
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                  href={`tel:${order.phone}`}
                >
                  {t('callCustomer')}
                </a>
              )}
              <Link
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                to="/dashboard/supplier/customers"
              >
                {t('viewCustomers')}
              </Link>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">{t('statusTimeline')}</span>
                <h2 className="text-base font-bold text-slate-900 font-serif">{t('orderProgress')}</h2>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <StatusTimeline currentStatus={order.status} />
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">{t('actionRequired')}</span>
              <h2 className="text-base font-bold text-slate-900 font-serif">{t('supplierActions')}</h2>
            </div>

            {(statusTransitions[order.status] || []).length > 0 ? (
              <div className="flex flex-col gap-4 pt-1">
                {(statusTransitions[order.status] || []).map((nextStatus) => {
                  const isDestructive = nextStatus === 'Cancelled'
                  const label = nextStatus === 'Accepted'
                    ? t('acceptOrder')
                    : nextStatus === 'Preparing'
                      ? t('markAsPreparing')
                      : nextStatus === 'Out for Delivery'
                        ? t('markAsOutForDelivery')
                        : nextStatus === 'Delivered'
                          ? t('markAsDelivered')
                          : t('cancelOrder')

                  return (
                    <button
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isDestructive
                          ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 mt-1.5'
                          : 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-600/20'
                      }`}
                      disabled={isUpdating}
                      key={nextStatus}
                      onClick={() => updateStatus({ target: { value: nextStatus } })}
                      type="button"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-500">
                <strong className="font-bold text-slate-700 block">{t('noActionsNeededText')}</strong>
                <p className="mt-0.5">{t('orderCurrentlyStatusMessage', { status: order.status?.toLowerCase() })}</p>
              </div>
            )}

            {statusError && (
              <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">
                {statusError}
              </p>
            )}
          </section>
        </aside>
      </div>

      <div className="pt-2">
        <Link className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1" to="/dashboard/supplier/orders">
          ← {t('backToIncomingOrders')}
        </Link>
      </div>
    </section>
  )
}
