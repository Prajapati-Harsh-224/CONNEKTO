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

export default function StatusBadge({ status }) {
  const { t } = useLocale()
  const labelKey = statusLabels[status] || status
  return <span className={`status-badge status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{t(labelKey)}</span>
}
