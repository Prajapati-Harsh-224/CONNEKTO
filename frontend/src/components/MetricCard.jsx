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

  return (
    <article className="relative flex items-center justify-between gap-3.5 min-w-0 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-slate-300/80 transition-all duration-200">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl border text-xl font-bold shrink-0 ${iconTheme}`} aria-hidden="true">
          {icon || '•'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-semibold text-slate-500 tracking-wide truncate">{label}</span>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight truncate tabular-nums">{value}</strong>
          {detail && <small className="text-xs text-slate-500 font-medium truncate">{detail}</small>}
        </div>
      </div>
      {actionTo && (
        <Link 
          className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 hover:border-brand-orange hover:bg-brand-orange-light hover:text-brand-orange text-slate-500 transition-all shrink-0 ml-1.5" 
          to={actionTo} 
          aria-label={`Open ${label}`}
        >
          {actionText || <FiChevronRight size={18} />}
        </Link>
      )}
    </article>
  )
}

