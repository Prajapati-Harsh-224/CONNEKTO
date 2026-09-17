import StatusBadge from './StatusBadge.jsx'

export default function OrderCard({ order }) {
  return (
    <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
      <div>
        <strong className="block text-sm font-semibold text-slate-800">{order.id}</strong>
        <span className="text-xs text-slate-500">{order.supplier}</span>
      </div>
      <div className="flex items-center gap-3">
        <strong className="text-sm font-bold text-slate-900">{order.amount}</strong>
        <StatusBadge status={order.status} />
      </div>
      <small className="text-xs text-slate-400">{order.date}</small>
    </article>
  )
}
