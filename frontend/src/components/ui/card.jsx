import * as React from 'react'

export function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-xs transition-all ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-4 sm:p-6 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }) {
  return (
    <h3
      className={`text-base sm:text-lg font-bold leading-none tracking-tight text-slate-900 ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ className = '', ...props }) {
  return (
    <p
      className={`text-xs sm:text-sm text-slate-500 leading-relaxed ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-6 pt-0 ${className}`} {...props} />
  )
}

export function CardFooter({ className = '', ...props }) {
  return (
    <div
      className={`flex items-center p-4 sm:p-6 pt-0 ${className}`}
      {...props}
    />
  )
}
