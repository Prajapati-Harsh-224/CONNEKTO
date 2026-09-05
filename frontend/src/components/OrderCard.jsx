import StatusBadge from './StatusBadge.jsx'

export default function OrderCard({ order }) {
  return <article className="order-card"><div><strong>{order.id}</strong><span>{order.supplier}</span></div><div className="order-card-meta"><strong>{order.amount}</strong><StatusBadge status={order.status} /></div><small>{order.date}</small></article>
}
