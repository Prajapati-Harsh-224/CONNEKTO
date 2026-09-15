import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'

export default function MetricCard({ label, value, detail, accent = '', icon, actionText, actionTo }) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-card-icon" aria-hidden="true">{icon || '•'}</div>
      <div className="metric-card-content">
        <span>{label}</span>
        <strong className="num-font">{value}</strong>
        <small>{detail}</small>
      </div>
      {actionTo && (
        <Link className="metric-card-action" to={actionTo} aria-label={`Open ${label}`}>
          {actionText || <FiChevronRight size={18} />}
        </Link>
      )}
    </article>
  )
}

