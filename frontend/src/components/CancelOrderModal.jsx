import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiClock, FiX } from 'react-icons/fi'
import { cancelOrder } from '../services/orderService.js'
import { getOrderCancellationStatus, formatOrderDateTime } from '../utils/orderCancellation.js'

const REASON_PRESETS = [
  'Ordered by mistake',
  'Need to modify items or quantities',
  'Found alternative / better price',
  'Expected earlier delivery time',
  'Duplicate order placed',
]

export default function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onOrderCancelled,
  currentTime = Date.now(),
}) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [modalTime, setModalTime] = useState(Date.now)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setErrorMessage('')
      setModalTime(Date.now())
    }
  }, [isOpen, order?.id])

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => setModalTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen || !order) return null

  const effectiveTime = currentTime && Math.abs(currentTime - modalTime) < 5000 ? currentTime : modalTime
  const cancelStatus = getOrderCancellationStatus(order, effectiveTime)
  const isPreparing = order.status === 'Preparing'
  const isExpired = isPreparing && !cancelStatus.canCancel

  async function handleConfirm() {
    if (isExpired) {
      setErrorMessage('Cancellation window has expired for this order. It can no longer be cancelled.')
      return
    }

    const cancelReason = reason.trim() || 'Cancelled by shop owner'
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await cancelOrder(order.id, cancelReason)
      const updatedOrder = response?.data?.order || {
        ...order,
        status: 'Cancelled',
        cancellationReason: cancelReason,
      }
      if (onOrderCancelled) {
        onOrderCancelled(updatedOrder)
      }
      onClose()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel the order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cancel-order-title" className="text-base sm:text-lg font-bold text-slate-900">
                Cancel Order
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Order #{String(order.id).slice(-8).toUpperCase()} • {order.supplierName} • {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Status Window Banner */}
        {isPreparing ? (
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <FiClock className="w-4 h-4" />
                <span>
                  {isExpired ? '2-Minute Cancellation Window Expired' : 'Preparation Grace Period Active'}
                </span>
              </div>
              <span
                className={`font-mono font-black text-sm px-2 py-0.5 rounded-md border ${
                  isExpired
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-white text-amber-800 border-amber-300 shadow-2xs'
                }`}
              >
                {cancelStatus.formattedTime}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {isExpired
                ? 'The supplier has started packaging your items. Cancellation is no longer permitted.'
                : 'You have a 2-minute window to cancel after an order starts preparing. Timer counts down live.'}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <span>✓</span>
            <span>
              This order is currently <strong>{order.status}</strong> and can be cancelled immediately.
            </span>
          </div>
        )}

        {/* Reason Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Select Cancellation Reason
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  reason === preset
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
            placeholder="Or type a custom reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || isExpired}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Cancelling...</span>
            ) : isExpired ? (
              <span>Window Expired</span>
            ) : (
              <>
                <span>Confirm Cancel</span>
                {isPreparing && (
                  <span className="font-mono text-[11px] opacity-90">({cancelStatus.formattedTime})</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
