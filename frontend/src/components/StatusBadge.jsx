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
  if (norm === 'pending' || norm === 'new') return <FiClock style={{ marginRight: '4px' }} />
  if (norm === 'accepted' || norm === 'confirmed' || norm === 'delivered') return <FiCheckCircle style={{ marginRight: '4px' }} />
  if (norm === 'preparing' || norm === 'processing') return <FiPackage style={{ marginRight: '4px' }} />
  if (norm === 'out for delivery' || norm === 'on the way') return <FiTruck style={{ marginRight: '4px' }} />
  if (norm === 'cancelled') return <FiXCircle style={{ marginRight: '4px' }} />
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${styleClass}`}>
      <StatusIcon status={status} />
      <span>{t(labelKey)}</span>
    </span>
  )
}

