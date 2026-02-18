import * as React from 'react'

const buttonVariants = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'hover:bg-slate-100',
  link: 'text-slate-900 underline-offset-4 hover:underline',
}

const buttonSizes = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-8',
  icon: 'h-9 w-9',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
        {...(Comp === 'button' ? props : {})}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
