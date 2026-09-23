export default function LoadingState({ message = 'Loading your workspace...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 text-sm gap-3" role="status">
      <span className="w-8 h-8 rounded-full border-2 border-brand-orange-light border-t-brand-orange animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
