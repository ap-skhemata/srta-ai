import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Lightbulb, Search, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Hypothesis } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig = {
  proposed: {
    icon: Lightbulb,
    label: 'Proposed',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
  investigating: {
    icon: Search,
    label: 'Investigating',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

interface HypothesesPanelProps {
  hypotheses: Hypothesis[]
}

export function HypothesesPanel({ hypotheses }: HypothesesPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          Hypotheses
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {hypotheses.length} items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-4 pb-4">
          {hypotheses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hypotheses generated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hypotheses.map((hyp) => {
                const config = statusConfig[hyp.status]
                return (
                  <div
                    key={hyp.id}
                    className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className={cn(config.className)}>
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(hyp.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{hyp.description}</p>
                    <Progress value={hyp.confidence * 100} className="h-1.5 mb-2" />
                    {hyp.supporting_evidence.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Supporting Evidence
                        </p>
                        <ul className="space-y-1">
                          {hyp.supporting_evidence.map((evidence, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex gap-1">
                              <span className="text-emerald-400">•</span>
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <time className="mt-2 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(hyp.timestamp), { addSuffix: true })}
                    </time>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
