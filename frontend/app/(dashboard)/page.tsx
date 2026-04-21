import Link from 'next/link'
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  PlayCircle,
  XCircle 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { listRuns } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const runs = await listRuns().catch(() => [])
  const stats = {
    total: runs.length,
    running: runs.filter(r => r.status === 'running').length,
    awaiting: runs.filter(r => r.status === 'awaiting_approval').length,
    completed: runs.filter(r => r.status === 'completed').length,
    failed: runs.filter(r => r.status === 'failed').length,
  }

  const recentRuns = runs.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of Skhemata Runtime Triage Agent
          </p>
        </div>
        <Button asChild>
          <Link href="/runs/new">
            <PlayCircle className="h-4 w-4 mr-2" />
            New Run
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.running}</div>
            <p className="text-xs text-muted-foreground">Active investigations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.awaiting}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>Latest incident triage activities</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/runs">
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {run.tenant}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {run.region}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {run.problem_description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
            {recentRuns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No runs yet. Start the backend and create a new run.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {stats.awaiting > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              Action Required
            </CardTitle>
            <CardDescription>
              {stats.awaiting} run{stats.awaiting > 1 ? 's' : ''} awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/runs?status=awaiting_approval">
                Review Pending Approvals
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
