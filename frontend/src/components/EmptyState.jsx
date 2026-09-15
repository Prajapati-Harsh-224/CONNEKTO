export default function EmptyState({ title, message, icon = null }) {
  return (
    <div className="empty-state">
      {icon ? <span className="empty-state-mark" aria-hidden="true">{icon}</span> : null}
      <strong>{title}</strong><br /><span>{message}</span>
    </div>
  )
}


