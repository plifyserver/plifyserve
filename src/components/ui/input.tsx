import * as React from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => (
    <input
      type={type}
      className={`flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-base text-slate-900 shadow-sm transition-colors caret-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:caret-slate-50 dark:placeholder:text-slate-400 ${className}`}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
