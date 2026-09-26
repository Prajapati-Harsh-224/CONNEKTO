import * as React from 'react'

export const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={`flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/30 focus-visible:border-brand-orange disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      {...props}
    />
  )
})
Input.displayName = 'Input'
