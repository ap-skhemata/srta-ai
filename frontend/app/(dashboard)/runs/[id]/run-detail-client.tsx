'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ElementType } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft, Clock, MapPin, Building, Activity, Timer, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { RunTimeline } from '@/components/run-timeline'
import { ObservationsPanel } from '@/components/observations-panel'
import { HypothesesPanel } from '@/components/hypotheses-panel'
import { ApprovalPanel } from '@/components/approval-panel'
import { approveRun, getRun, rejectRun } from '@/lib/api'
import type { Run } from '@/lib/types'

interface RunDetailClientProps {
  id: string
}

const terminalStatuses = new Set(['completed', 'failed', 'cancelled'])

export function RunDetailClient({ id }: RunDetailClientProps) {
  const [run, setRun] = useState<Run | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadRun = async () => {
    try {
      setRun(await getRun(id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load run')
    }
  }

  useEffect(() => {
    loadRun()
  }, [id])

  useEffect(() => {
    if (!run || terminalStatuses.has(run.status) || run.status === 'awaiting_approval') {
      return
    }

    const interval = window.setInterval(loadRun, 1200)
    return () => window.clearInterval(interval)
  }, [run?.status, id])

  const duration = useMemo(() => {
    if (!run) {
      return { minutes: 0, seconds: 0 }
    }
    const durationMs = new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()
    return {
      minutes: Math.floor(durationMs / 60000),
      seconds: Math.floor((durationMs % 60000) / 1000),
    }
  }, [run])

  const handleApprove = async (comment: string) => {
    const updated = await approveRun(id, comment)
    setRun(updated)
    window.setTimeout(loadRun, 500)
  }

  const handleReject = async (comment: string) => {
    setRun(await rejectRun(id, comment))
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/runs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to runs
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!run) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">Loading run...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
          <Link href="/runs">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to runs</span>
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">Run {run.id}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-2">{run.problem_description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Building} color="blue" label="Tenant" value={run.tenant} />
        <InfoCard icon={MapPin} color="emerald" label="Region" value={run.region} />
        <InfoCard icon={Clock} color="purple" label="Started" value={format(new Date(run.created_at), 'MMM d, HH:mm')} />
        <InfoCard
          icon={Timer}
          color="amber"
          label="Duration"
          value={`${duration.minutes > 0 ? `${duration.minutes}m ` : ''}${duration.seconds}s`}
        />
      </div>

      <Card className="bg-card/50 border-l-4 border-l-blue-500">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Current Step</p>
              <p className="text-sm font-medium">{run.current_step}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              Updated {formatDistanceToNow(new Date(run.updated_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {run.status === 'awaiting_approval' && (
        <ApprovalPanel run={run} onApprove={handleApprove} onReject={handleReject} />
      )}

      {run.final_summary && (
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Final Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{run.final_summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Event Timeline</CardTitle>
                <CardDescription>{run.timeline.length} events recorded</CardDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(run.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RunTimeline events={run.timeline} currentStep={run.current_step} runStatus={run.status} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6 min-w-0">
          <ObservationsPanel observations={run.observations} />
          <HypothesesPanel hypotheses={run.hypotheses} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Tool Outputs
            <span className="text-xs font-normal text-muted-foreground">
              {run.tool_outputs.length} executions
            </span>
          </CardTitle>
          <CardDescription>Results from automated mock tool executions</CardDescription>
        </CardHeader>
        <CardContent>
          {run.tool_outputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No tool executions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {run.tool_outputs.map((output) => (
                <div key={output.id} className="rounded-lg border p-4 space-y-3 bg-card/50">
                  <div className="flex items-center justify-between">
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">{output.tool_name}</code>
                    <div className="flex items-center gap-2">
                      <span className={output.status === 'success' ? 'text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400' : 'text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400'}>
                        {output.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{output.duration_ms}ms</span>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                      <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
                        {JSON.stringify(output.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                      <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                        {output.output}
                      </pre>
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(output.timestamp), 'HH:mm:ss')} ({formatDistanceToNow(new Date(output.timestamp), { addSuffix: true })})
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: ElementType
  color: 'blue' | 'emerald' | 'purple' | 'amber'
  label: string
  value: string
}) {
  const colorClass = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }[color]

  return (
    <Card className="bg-card/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
