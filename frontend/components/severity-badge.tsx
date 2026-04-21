import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Severity = 'info' | 'warning' | 'critical'

const severityConfig: Record<Severity, { label: string; className: string }> = {
  info: {
    label: 'Info',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  warning: {
    label: 'Warning',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity]
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
