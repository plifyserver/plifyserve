'use client'

import * as React from 'react'

interface SelectContextValue {
  value: string
  onValueChange: (v: string) => void
  open: boolean
  setOpen: (v: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

const Select = ({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
}) => {
  const [internalValue, setInternalValue] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const value_ = value ?? internalValue
  const setValue = (v: string) => {
    if (value === undefined) setInternalValue(v)
    onValueChange?.(v)
    setOpen(false)
  }
  return (
    <SelectContext.Provider value={{ value: value_, onValueChange: setValue, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className = '', children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={`flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null
  return <span>{ctx.value || placeholder}</span>
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) ctx?.setOpen(false)
    }
    if (ctx?.open) document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [ctx?.open])
  if (!ctx || !ctx.open) return null
  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = 'SelectContent'

const SelectItem = ({
  value,
  children,
  className = '',
}: {
  value: string
  children: React.ReactNode
  className?: string
}) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null
  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${className}`}
      onClick={() => ctx.onValueChange(value)}
      onKeyDown={(e) => e.key === 'Enter' && ctx.onValueChange(value)}
    >
      {children}
    </div>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectLabel = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`} {...props} />
)
const SelectSeparator = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`-mx-1 my-1 h-px bg-slate-100 ${className}`} {...props} />
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
