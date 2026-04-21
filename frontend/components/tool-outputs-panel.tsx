import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Terminal, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { ToolOutput } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ToolOutputsPanelProps {
  outputs: ToolOutput[]
}

export function ToolOutputsPanel({ outputs }: ToolOutputsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="h-4 w-4 text-emerald-400" />
          Tool Outputs
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {outputs.length} executions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-4 pb-4">
          {outputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Terminal className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tool executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {output.tool_name}
                      </code>
                      <Badge
                        variant="outline"
                        className={cn(
                          output.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        )}
                      >
                        {output.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {output.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {output.duration_ms}ms
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                    <pre className="rounded bg-muted p-2 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(output.input, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                    <pre className="rounded bg-muted p-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {output.output}
                    </pre>
                  </div>
                  
                  <time className="mt-2 block text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(output.timestamp), { addSuffix: true })}
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
