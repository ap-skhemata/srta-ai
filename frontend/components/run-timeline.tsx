'use client'

import { format, formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  Play,
  ShieldAlert,
  Terminal,
} from 'lucide-react'
import type { TimelineEvent, EventType, RunStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const eventConfig: Record<EventType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  observation: {
    icon: AlertCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  hypothesis: {
    icon: Lightbulb,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  tool_execution: {
    icon: Terminal,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
  },
  approval_request: {
    icon: ShieldAlert,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
  },
  status_change: {
    icon: Play,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/20',
    borderColor: 'border-zinc-500/50',
  },
}

interface RunTimelineProps {
  events: TimelineEvent[]
  currentStep: string
  runStatus: RunStatus
}

function getEventStatus(
  index: number,
  totalEvents: number,
  runStatus: RunStatus,
  eventType: EventType
): 'completed' | 'current' | 'pending' {
  const isLastEvent = index === totalEvents - 1
  
  if (runStatus === 'completed' || runStatus === 'failed') {
    return 'completed'
  }
  
  if (isLastEvent) {
    if (runStatus === 'awaiting_approval' && eventType === 'approval_request') {
      return 'current'
    }
    if (runStatus === 'running') {
      return 'current'
    }
    return 'current'
  }
  
  return 'completed'
}

function EventStatusIndicator({ 
  status, 
  eventType 
}: { 
  status: 'completed' | 'current' | 'pending'
  eventType: EventType 
}) {
  const config = eventConfig[eventType]
  const Icon = config.icon

  if (status === 'current') {
    return (
      <div className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
        config.bgColor,
        config.borderColor,
        'ring-4 ring-offset-2 ring-offset-background',
        eventType === 'approval_request' ? 'ring-purple-500/30' : 'ring-blue-500/30'
      )}>
        {eventType === 'approval_request' ? (
          <Icon className={cn('h-5 w-5', config.color)} />
        ) : (
          <Loader2 className={cn('h-5 w-5 animate-spin', config.color)} />
        )}
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        config.bgColor
      )}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
    )
  }

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
      <Clock className="h-5 w-5 text-muted-foreground" />
    </div>
  )
}

export function RunTimeline({ events, currentStep, runStatus }: RunTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No events yet</p>
        <p className="text-xs text-muted-foreground mt-1">Events will appear here as the run progresses</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const config = eventConfig[event.type]
        const eventStatus = getEventStatus(index, events.length, runStatus, event.type)
        const isLast = index === events.length - 1
        const isCurrent = eventStatus === 'current'

        return (
          <div key={event.id} className="relative flex gap-4">
            {!isLast && (
              <div 
                className={cn(
                  'absolute left-5 top-10 w-0.5 h-full -translate-x-1/2',
                  eventStatus === 'completed' ? 'bg-border' : 'bg-border/50'
                )}
                style={{ height: 'calc(100% - 2.5rem)' }}
              />
            )}
            
            <EventStatusIndicator status={eventStatus} eventType={event.type} />
            
            <div className={cn(
              'flex-1 pb-8 min-w-0',
              isLast && 'pb-0'
            )}>
              <div className={cn(
                'rounded-lg border p-4 transition-colors',
                isCurrent && 'border-2',
                isCurrent && event.type === 'approval_request' 
                  ? 'border-purple-500/50 bg-purple-500/5' 
                  : isCurrent 
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-border bg-card'
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-foreground' : 'text-foreground/90'
                    )}>
                      {event.title}
                    </h4>
                    {isCurrent && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-5',
                          event.type === 'approval_request'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        )}
                      >
                        {event.type === 'approval_request' ? 'Waiting' : 'In Progress'}
                      </Badge>
                    )}
                    {eventStatus === 'completed' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <time className="text-xs text-muted-foreground block">
                      {format(new Date(event.timestamp), 'HH:mm:ss')}
                    </time>
                    <time className="text-[10px] text-muted-foreground/70 block">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </time>
                  </div>
                </div>
                
                <p className={cn(
                  'text-sm',
                  isCurrent ? 'text-muted-foreground' : 'text-muted-foreground/80'
                )}>
                  {event.description}
                </p>

                {isCurrent && event.type === 'approval_request' && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-purple-400 font-medium">
                      Action Required: {currentStep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
