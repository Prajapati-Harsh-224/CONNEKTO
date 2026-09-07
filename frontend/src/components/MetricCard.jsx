import { Link } from 'react-router-dom'

export default function MetricCard({ label, value, detail, accent = '', icon, actionText = '›', actionTo }) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-card-icon" aria-hidden="true">{icon || '•'}</div>
      <div className="metric-card-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <Link className="metric-card-action" to={actionTo} aria-label={`Open ${label}`}>
        {actionText}
      </Link>
    </article>
  )
}
