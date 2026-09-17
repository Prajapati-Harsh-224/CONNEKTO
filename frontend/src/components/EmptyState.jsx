export default function EmptyState({ title, message, icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 my-4">
      {icon ? <span className="text-3xl mb-2 text-slate-400" aria-hidden="true">{icon}</span> : null}
      <strong className="text-base font-bold text-slate-800">{title}</strong>
      <span className="text-xs text-slate-500 max-w-sm mt-1">{message}</span>
    </div>
  )
}


