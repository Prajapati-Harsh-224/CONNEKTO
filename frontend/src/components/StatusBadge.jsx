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
  return (
    <span className={`status-badge status-${String(status).toLowerCase().replaceAll(' ', '-')}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <StatusIcon status={status} />
      {t(labelKey)}
    </span>
  )
}

