'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

type DropdownContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

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
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className = '', asChild, children, onClick, ...props }, ref) => {
  const ctx = React.useContext(DropdownContext)
  if (!ctx) return null
  const { triggerRef } = ctx

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    ctx.setOpen(!ctx.open)
    onClick?.(e)
  }

  const setRef = (r: HTMLButtonElement | null) => {
    triggerRef.current = r

    if (typeof ref === 'function') {
      ref(r)
    } else if (ref) {
      ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = r
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
        ref?: React.Ref<HTMLButtonElement>
      }>,
      {
        ref: setRef,
        onClick: handleClick,
      }
    )
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
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end'
  }
>(({ className = '', align = 'end', children, ...props }, ref) => {
  const ctx = React.useContext(DropdownContext)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [pos, setPos] = React.useState({ top: 0, left: 0, right: 0, width: 0 })

  React.useEffect(() => setMounted(true), [])

  const updatePosition = React.useCallback(() => {
    if (!ctx?.triggerRef.current) return
    const rect = ctx.triggerRef.current.getBoundingClientRect()
    const gap = 4
    if (align === 'end') {
      setPos({
        top: rect.bottom + gap,
        left: 0,
        right: typeof window !== 'undefined' ? window.innerWidth - rect.right : 0,
        width: 0,
      })
    } else if (align === 'start') {
      setPos({
        top: rect.bottom + gap,
        left: rect.left,
        right: 0,
        width: 0,
      })
    } else {
      setPos({
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        right: 0,
        width: 0,
      })
    }
  }, [ctx?.triggerRef, align])

  React.useLayoutEffect(() => {
    if (!ctx?.open) return
    updatePosition()
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [ctx?.open, updatePosition])

  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      const target = e.target as Node

      if (contentRef.current?.contains(target)) return
      if (ctx?.triggerRef.current?.contains(target)) return

      ctx?.setOpen(false)
    }

    if (ctx?.open) {
      setTimeout(() => {
        document.addEventListener('click', fn)
      }, 0)
    }

    return () => {
      document.removeEventListener('click', fn)
    }
  }, [ctx?.open])

  if (!ctx || !ctx.open || !mounted) return null

  const style: React.CSSProperties =
    align === 'end'
      ? { position: 'fixed', top: pos.top, right: pos.right, zIndex: 10000 }
      : align === 'start'
        ? { position: 'fixed', top: pos.top, left: pos.left, zIndex: 10000 }
        : { position: 'fixed', top: pos.top, left: pos.left, zIndex: 10000, transform: 'translateX(-50%)' }

  const menu = (
    <div
      ref={(r) => {
        contentRef.current = r

        if (typeof ref === 'function') {
          ref(r)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = r
        }
      }}
      style={style}
      className={`min-w-[10rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )

  return createPortal(menu, document.body)
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
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-inherit outline-none hover:bg-slate-100 focus:bg-slate-100 ${className}`}
      onClick={(e) => {
        onClick?.(e)
        ctx?.setOpen(false)
      }}
      {...props}
    />
  )
})

DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`-mx-1 my-1 h-px bg-slate-100 ${className}`} {...props} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
