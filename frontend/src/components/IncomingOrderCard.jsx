import StatusBadge from './StatusBadge.jsx'
import { Link } from 'react-router-dom'

export default function IncomingOrderCard({ order, linkTo }) {
  const amount = Number(order.amount ?? order.subtotal ?? 0)
  const customer = order.shopOwner || order.shopOwnerId || 'Shop owner'
  const date = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '')
  const card = <article className="order-card"><div><strong>{order.id}</strong><span>{customer}</span></div><div className="order-card-meta"><strong>Rs {amount.toLocaleString('en-IN')}</strong><StatusBadge status={order.status} /></div><small>{date}</small></article>
  return linkTo ? <Link className="order-link" to={linkTo}>{card}</Link> : card
}
