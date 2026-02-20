'use client'

import { CheckCircle, Clock, Send, FileEdit, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContractStatus = 'draft' | 'sent' | 'pending' | 'signed' | 'expired'

interface ContractStatusBadgeProps {
  status: ContractStatus | string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

const STATUS_CONFIG: Record<ContractStatus, {
  label: string
  icon: typeof CheckCircle
  className: string
}> = {
  draft: {
    label: 'Rascunho',
    icon: FileEdit,
    className: 'bg-slate-100 text-slate-600',
  },
  sent: {
    label: 'Enviado',
    icon: Send,
    className: 'bg-blue-100 text-blue-700',
  },
  pending: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700',
  },
  signed: {
    label: 'Assinado',
    icon: CheckCircle,
    className: 'bg-emerald-100 text-emerald-700',
  },
  expired: {
    label: 'Expirado',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700',
  },
}

export default function ContractStatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  className,
}: ContractStatusBadgeProps) {
  const config = STATUS_CONFIG[status as ContractStatus] || STATUS_CONFIG.draft
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg font-medium',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </span>
  )
}
