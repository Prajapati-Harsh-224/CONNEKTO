const statuses = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered']

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = statuses.indexOf(currentStatus)
  const isCancelled = currentStatus === 'Cancelled'

  return (
    <ol className="relative pl-7 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200" aria-label="Order status timeline">
      {statuses.map((status, index) => {
        const isDone = !isCancelled && index <= currentIndex
        const isCurrent = status === currentStatus

        return (
          <li className="relative flex items-start gap-3" key={status}>
            <span 
              className={`absolute -left-7 sm:-left-8 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ring-4 ring-white shrink-0 ${
                isDone 
                  ? 'bg-brand-orange text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-400 border border-slate-300/80'
              }`} 
              aria-hidden="true"
            >
              {isDone ? '✓' : index + 1}
            </span>
            <div className="flex flex-col min-w-0">
              <strong className={`text-xs sm:text-sm font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                {status}
              </strong>
              {isCurrent && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange mt-0.5">
                  Current status
                </span>
              )}
            </div>
          </li>
        )
      })}
      {isCancelled && (
        <li className="relative flex items-start gap-3">
          <span 
            className="absolute -left-7 sm:-left-8 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shrink-0" 
            aria-hidden="true"
          >
            !
          </span>
          <div className="flex flex-col min-w-0">
            <strong className="text-xs sm:text-sm font-bold text-rose-600">Cancelled</strong>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mt-0.5">
              Current status
            </span>
          </div>
        </li>
      )}
    </ol>
  )
}
