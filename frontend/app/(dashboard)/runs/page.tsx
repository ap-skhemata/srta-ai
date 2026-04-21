import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, PlayCircle, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/status-badge'
import { listRuns } from '@/lib/api'

export default async function RunsPage() {
  const runs = await listRuns().catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
          <p className="text-muted-foreground">
            All incident triage runs
          </p>
        </div>
        <Button asChild>
          <Link href="/runs/new">
            <PlayCircle className="h-4 w-4 mr-2" />
            New Run
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search runs by tenant, region, or description..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Runs</CardTitle>
          <CardDescription>{runs.length} total runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{run.tenant}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {run.region}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {run.problem_description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <strong className="font-medium text-foreground">Current:</strong>{' '}
                      {run.current_step}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Created {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span>
                      Updated {formatDistanceToNow(new Date(run.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </Link>
            ))}
            {runs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No runs found. Create a run to start the local triage agent.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
