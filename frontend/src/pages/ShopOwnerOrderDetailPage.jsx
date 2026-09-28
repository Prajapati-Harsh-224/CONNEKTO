import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrder } from '../services/orderService.js'
import { getItemUnitLabel } from '../utils/cartStorage.js'

export default function ShopOwnerOrderDetailPage() {
  const { orderId } = useParams()
  const { t } = useLocale()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrder(orderId).then((response) => setOrder(response.data.order)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) return <LoadingState message={t('loadingOrders')} />
  if (error) {
    return (
      <section className="space-y-4 w-full min-w-0 max-w-full">
        <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">{error}</p>
        <Link className="inline-block px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all" to="/dashboard/shop-owner/orders">
          {t('backToOrders')}
        </Link>
      </section>
    )
  }
  if (!order) return <EmptyState title={t('orderNotFound')} message={t('orderUnavailable')} />

  const paymentLabels = {
    CASH_ON_DELIVERY: t('cashOnDelivery'),
    PAY_LATER: t('payLater'),
    REQUEST_ORDER: t('requestOrder')
  }

  return (
    <section className="space-y-6 sm:space-y-8 w-full min-w-0 max-w-full">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link className="hover:text-slate-600 transition-colors" to="/dashboard/shop-owner/orders">{t('orders')}</Link>
        <span aria-hidden="true">›</span>
        <span className="text-slate-700">{t('supplierOrder')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('supplierOrder')}</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-0.5">{order.supplierName}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold font-mono">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('orderDate')}</span>
          <strong className="block text-sm sm:text-base font-bold text-slate-900 mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </strong>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('subtotal')}</span>
          <strong className="block text-sm sm:text-base font-bold text-slate-900 mt-1">
            Rs {Number(order.subtotal).toLocaleString('en-IN')}
          </strong>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('deliveryArea')}</span>
          <strong className="block text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
            {order.serviceArea || '—'}
          </strong>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('paymentMethod')}</span>
          <strong className="block text-sm sm:text-base font-bold text-slate-900 mt-1">
            {paymentLabels[order.paymentMethod] || t('requestOrder')}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start w-full min-w-0 max-w-full">
        <main className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-6 w-full min-w-0 max-w-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('productsLabel')}</span>
              <h2 className="text-lg font-black text-slate-900">{t('supplierOrderDetails')}</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {order.items.length} {order.items.length === 1 ? t('itemCount') : t('itemsCount')}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => {
              const unitsPerBox = Number(item.unitsPerBoxSnapshot || item.unitsPerBox || item.minimumQuantity || item.minimum_quantity || 1)
              const isBox = unitsPerBox > 1
              const boxes = item.boxes || (isBox ? Math.floor(item.quantity / unitsPerBox) : item.quantity)
              const unitPrice = Number(String(item.unitPriceSnapshot || item.unitPrice || 0).replace(/[^0-9.]/g, ''))
              const unitLabel = getItemUnitLabel(item, item.quantity)
              const unitSingular = getItemUnitLabel(item, 1)
              return (
                <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={item.productId}>
                  <div className="flex flex-col min-w-0">
                    <strong className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {item.productNameSnapshot || item.name}
                    </strong>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {isBox
                        ? `${boxes} ${boxes === 1 ? t('boxSingular') : t('boxPlural')} (${item.quantity} ${unitLabel}) × Rs ${unitPrice.toLocaleString('en-IN')}/${unitSingular}`
                        : `${item.quantity} ${unitLabel} × Rs ${unitPrice.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <strong className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
                    Rs {Number(item.lineTotal).toLocaleString('en-IN')}
                  </strong>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-600">{t('supplierSubtotal')}</span>
            <strong className="text-lg font-black text-slate-900">Rs {Number(order.subtotal).toLocaleString('en-IN')}</strong>
          </div>
        </main>

        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('statusTimeline')}</span>
                <h2 className="text-base font-bold text-slate-900">{t('orderProgress')}</h2>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <StatusTimeline currentStatus={order.status} />
          </section>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
            <strong className="font-bold block">{t('orderUpdates')}</strong>
            <p className="text-amber-800">{t('statusUpdatesManagedLater')}</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
