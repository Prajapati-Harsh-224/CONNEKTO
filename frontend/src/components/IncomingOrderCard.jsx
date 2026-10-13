import StatusBadge from './StatusBadge.jsx'
import { Link } from 'react-router-dom'
import { formatOrderDateTime } from '../utils/orderCancellation.js'

export default function IncomingOrderCard({ order, linkTo }) {
  const amount = Number(order.amount ?? order.subtotal ?? 0)
  const customer = order.shopOwner || order.shopOwnerId || 'Shop owner'
  const date = order.date || (order.createdAt ? formatOrderDateTime(order.createdAt) : '')

  const card = (
    <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
      <div>
        <strong className="block text-sm font-semibold text-slate-800">{order.id}</strong>
        <span className="text-xs text-slate-500">{customer}</span>
      </div>
      <div className="flex items-center gap-3">
        <strong className="text-sm font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</strong>
        <StatusBadge status={order.status} />
      </div>
      <small className="text-xs text-slate-400">{date}</small>
    </article>
  )

  return linkTo ? <Link className="block no-underline text-inherit" to={linkTo}>{card}</Link> : card
}
