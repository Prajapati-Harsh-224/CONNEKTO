import * as React from 'react'

const buttonVariants = {
  default: 'bg-brand-orange text-white hover:bg-brand-orange-dark active:scale-[0.98] shadow-xs hover:shadow border-transparent',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98] border-transparent',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 active:scale-[0.98]',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-xs',
  link: 'text-brand-orange underline-offset-4 hover:underline p-0 h-auto',
}

const buttonSizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 rounded-lg px-3 text-xs',
  lg: 'h-12 rounded-xl px-6 text-base',
  icon: 'h-9 w-9 p-0',
}

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', type = 'button', disabled = false, ...props }, ref) => {
    const variantClass = buttonVariants[variant] || buttonVariants.default
    const sizeClass = buttonSizes[size] || buttonSizes.default

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none ${variantClass} ${sizeClass} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
