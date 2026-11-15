export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-600 text-sm gap-3.5 bg-white"
      role="status"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shadow-xs">
          <span className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" aria-hidden="true" />
        </div>
      </div>
      <span className="font-semibold text-slate-700 tracking-tight">{message}</span>
    </div>
  )
}
