import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'


const accentStyles = {
  'metric-primary': 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
  'metric-success': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'metric-warning': 'bg-amber-50 text-amber-800 border-amber-200',
  'metric-neutral': 'bg-blue-50 text-blue-700 border-blue-200',
  'metric-spending': 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function MetricCard({ label, value, detail, accent = '', icon, actionText, actionTo }) {
  const iconTheme = accentStyles[accent] || 'bg-brand-orange-light text-brand-orange border-brand-orange/20'

  const content = (
    <>
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
        <div className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border text-sm sm:text-xl font-bold shrink-0 ${iconTheme}`} aria-hidden="true">
          {icon || '•'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] sm:text-[13px] font-semibold text-slate-500 tracking-wide truncate">{label}</span>
          <strong className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight truncate tabular-nums">{value}</strong>
          {detail && <small className="text-[9px] sm:text-xs text-slate-400 font-medium truncate hidden sm:inline">{detail}</small>}
        </div>
      </div>
      {actionTo && (
        <span 
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 group-hover:border-brand-orange group-hover:bg-brand-orange-light group-hover:text-brand-orange text-slate-500 transition-all shrink-0 ml-1.5" 
          aria-hidden="true"
        >
          {actionText || <FiChevronRight size={18} />}
        </span>
      )}
    </>
  )

  const cardClasses = "group relative flex items-center justify-between gap-2 sm:gap-3.5 min-w-0 p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-slate-300/80 transition-all duration-200"

  if (actionTo) {
    return (
      <Link to={actionTo} className={cardClasses} aria-label={`Open ${label}`}>
        {content}
      </Link>
    )
  }

  return (
    <article className={cardClasses}>
      {content}
    </article>
  )
}

