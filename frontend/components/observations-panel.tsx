import { formatDistanceToNow } from 'date-fns'
import { Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SeverityBadge } from '@/components/severity-badge'
import type { Observation } from '@/lib/types'

interface ObservationsPanelProps {
  observations: Observation[]
}

export function ObservationsPanel({ observations }: ObservationsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-blue-400" />
          Observations
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {observations.length} items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-4 pb-4">
          {observations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Eye className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No observations collected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {obs.source}
                    </span>
                    <SeverityBadge severity={obs.severity} />
                  </div>
                  <p className="text-sm">{obs.content}</p>
                  <time className="mt-2 block text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(obs.timestamp), { addSuffix: true })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
