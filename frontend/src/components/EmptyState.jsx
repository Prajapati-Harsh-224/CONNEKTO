export default function EmptyState({ title, message }) {
  return <div className="empty-state"><span className="empty-state-mark" aria-hidden="true">-</span><strong>{title}</strong><span>{message}</span></div>
}
