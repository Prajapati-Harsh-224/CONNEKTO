import * as React from 'react'

export function TabsList({ className = '', ...props }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 text-slate-600 max-w-full overflow-x-auto ${className}`}
      role="tablist"
      {...props}
    />
  )
}

export function TabsTrigger({ className = '', isActive = false, children, ...props }) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
        isActive
          ? 'bg-white text-slate-900 shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
