import { Badge } from '@/components/ui/badge'
import type { RunStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<RunStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
  running: {
    label: 'Running',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
}

interface StatusBadgeProps {
  status: RunStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
