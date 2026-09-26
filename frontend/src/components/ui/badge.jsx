import * as React from 'react'

const badgeVariants = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 border-transparent',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200',
  destructive: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
  outline: 'text-slate-800 border-slate-200 hover:bg-slate-50',
  success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
  brand: 'bg-brand-orange-light text-brand-orange hover:bg-orange-100 border-brand-orange/30',
  info: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
}

export function Badge({ className = '', variant = 'default', ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shrink-0 ${variantClass} ${className}`}
      {...props}
    />
  )
}
