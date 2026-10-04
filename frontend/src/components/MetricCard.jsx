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
      {/* Mobile view (< sm): Compact row with icon + stacked label + value */}
      <div className="flex sm:hidden items-center gap-2 min-w-0 w-full">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-bold shrink-0 ${iconTheme}`} aria-hidden="true">
          {icon || '•'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-semibold text-slate-500 tracking-tight block leading-[1.15]">
            {typeof label === 'string' && label.includes(' ') ? (
              label.split(' ').map((word, index) => (
                <span key={index} className="block">
                  {word}
                </span>
              ))
            ) : (
              label
            )}
          </span>
          <strong className="text-xs font-extrabold text-slate-900 tracking-tight leading-tight truncate tabular-nums block mt-0.5">
            {value}
          </strong>
        </div>
      </div>

      {/* Desktop & Tablet view (sm: and above): Full-width stacked card */}
      <div className="hidden sm:flex flex-col justify-between w-full h-full min-w-0">
        {/* Top row: Icon on left, Action chevron on right */}
        <div className="flex items-center justify-between w-full">
          <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-xl border text-base md:text-lg lg:text-xl font-bold shrink-0 ${iconTheme}`} aria-hidden="true">
            {icon || '•'}
          </div>
          {actionTo && (
            <span 
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 group-hover:border-brand-orange group-hover:bg-brand-orange-light group-hover:text-brand-orange text-slate-400 group-hover:text-brand-orange transition-all shrink-0" 
              aria-hidden="true"
            >
              {actionText || <FiChevronRight size={15} />}
            </span>
          )}
        </div>

        {/* Bottom section: Full width for label, value, detail - NEVER truncated or awkwardly broken */}
        <div className="flex flex-col min-w-0 mt-2.5 sm:mt-3 lg:mt-3.5">
          <span 
            className="text-[11px] sm:text-xs lg:text-[13px] font-semibold text-slate-500 tracking-wide block leading-snug break-normal"
            title={typeof label === 'string' ? label : undefined}
          >
            {label}
          </span>
          <strong className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight tabular-nums block mt-0.5">
            {value}
          </strong>
          {detail && (
            <small 
              className="text-[10px] sm:text-[11px] lg:text-xs text-slate-400 font-medium block leading-normal mt-1 break-normal"
              title={typeof detail === 'string' ? detail : undefined}
            >
              {detail}
            </small>
          )}
        </div>
      </div>
    </>
  )

  const cardClasses = "group relative flex flex-col justify-between w-full h-full min-w-0 p-2 sm:p-3 md:p-3.5 lg:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-slate-300/80 transition-all duration-200"

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

