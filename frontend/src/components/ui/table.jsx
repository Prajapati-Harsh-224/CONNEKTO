import * as React from 'react'

export function Table({ className = '', containerClassName = '', ...props }) {
  return (
    <div className={`relative w-full max-w-full overflow-x-auto ${containerClassName}`}>
      <table
        className={`w-full caption-bottom text-sm border-separate border-spacing-0 ${className}`}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className = '', ...props }) {
  return <thead className={`bg-slate-50/80 [&_tr]:border-b ${className}`} {...props} />
}

export function TableBody({ className = '', ...props }) {
  return <tbody className={`[&_tr:last-child]:border-0 divide-y divide-slate-100 ${className}`} {...props} />
}

export function TableFooter({ className = '', ...props }) {
  return (
    <tfoot
      className={`border-t border-slate-200 bg-slate-50/50 font-medium [&>tr]:last:border-b-0 ${className}`}
      {...props}
    />
  )
}

export function TableRow({ className = '', ...props }) {
  return (
    <tr
      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 data-[state=selected]:bg-slate-100 ${className}`}
      {...props}
    />
  )
}

export function TableHead({ className = '', ...props }) {
  return (
    <th
      className={`h-10 px-3 text-left align-middle text-xs font-bold text-slate-500 uppercase tracking-wider ${className}`}
      {...props}
    />
  )
}

export function TableCell({ className = '', ...props }) {
  return (
    <td
      className={`p-3 align-middle text-slate-800 ${className}`}
      {...props}
    />
  )
}

export function TableCaption({ className = '', ...props }) {
  return (
    <caption
      className={`mt-4 text-xs text-slate-400 ${className}`}
      {...props}
    />
  )
}
