import { FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'

const statusLabels = {
  New: 'new',
  Pending: 'pending',
  Confirmed: 'confirmed',
  Processing: 'processing',
  Ready: 'ready',
  Accepted: 'accepted',
  Preparing: 'preparing',
  'Out for Delivery': 'outForDelivery',
  'On the way': 'onTheWay',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
}

function StatusIcon({ status }) {
  const norm = String(status).toLowerCase()
  if (norm === 'pending' || norm === 'new') return <FiClock className="shrink-0" />
  if (norm === 'accepted' || norm === 'confirmed' || norm === 'delivered') return <FiCheckCircle className="shrink-0" />
  if (norm === 'preparing' || norm === 'processing') return <FiPackage className="shrink-0" />
  if (norm === 'out for delivery' || norm === 'on the way') return <FiTruck className="shrink-0" />
  if (norm === 'cancelled') return <FiXCircle className="shrink-0" />
  return null
}

export default function StatusBadge({ status }) {
  const { t } = useLocale()
  const labelKey = statusLabels[status] || status

  const statusStyles = {
    new: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    preparing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ready: 'bg-teal-50 text-teal-700 border-teal-200',
    'out-for-delivery': 'bg-purple-50 text-purple-700 border-purple-200',
    'on-the-way': 'bg-purple-50 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  const norm = String(status).toLowerCase().replaceAll(' ', '-')
  const styleClass = statusStyles[norm] || 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold tracking-wide border whitespace-nowrap shrink-0 ${styleClass}`}>
      <StatusIcon status={status} />
      <span>{t(labelKey)}</span>
    </span>
  )
}

