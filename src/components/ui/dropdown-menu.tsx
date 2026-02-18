'use client'

import * as React from 'react'

type DropdownContextValue = { open: boolean; setOpen: (v: boolean) => void; triggerRef: React.RefObject<HTMLButtonElement | null> }

const DropdownContext = React.createContext<DropdownContextValue | null>(null)

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className = '', asChild, children, ...props }, ref) => {
  const ctx = React.useContext(DropdownContext)
  if (!ctx) return null
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    ctx.setOpen(!ctx.open)
    ;(props as React.ButtonHTMLAttributes<HTMLButtonElement>).onClick?.(e)
  }
  const setRef = (r: HTMLButtonElement | null) => {
    ctx.triggerRef.current = r
    if (typeof ref === 'function') ref(r)
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = r
  }
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void; ref?: React.Ref<HTMLButtonElement> }>, {
      ref: setRef,
      onClick: handleClick,
    })
  }
  return (
    <button ref={setRef} type="button" className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }
>(({ className = '', align = 'end', children, ...props }, ref) => {
  const ctx = React.useContext(DropdownContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      const target = e.target as Node
      if (contentRef.current?.contains(target)) return
      if (ctx?.triggerRef.current?.contains(target)) return
      ctx?.setOpen(false)
    }
    if (ctx?.open) setTimeout(() => document.addEventListener('click', fn), 0)
    return () => document.removeEventListener('click', fn)
  }, [ctx?.open])
  if (!ctx || !ctx.open) return null
  return (
    <div
      ref={(r) => {
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = r
        if (typeof ref === 'function') ref(r)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = r
      }}
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md ${align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'} mt-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', onClick, ...props }, ref) => {
  const ctx = React.useContext(DropdownContext)
  return (
    <div
      ref={ref}
      role="menuitem"
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${className}`}
      onClick={(e) => {
        onClick?.(e)
        ctx?.setOpen(false)
      }}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`-mx-1 my-1 h-px bg-slate-100 ${className}`} {...props} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
