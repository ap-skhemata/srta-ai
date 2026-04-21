'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Shield, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import type { Run } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ApprovalPanelProps {
  run: Run
  onApprove?: (comment: string) => void
  onReject?: (comment: string) => void
}

export function ApprovalPanel({ run, onApprove, onReject }: ApprovalPanelProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    setIsSubmitting(true)
    setSelectedAction('approve')
    await onApprove?.(comment)
    setIsSubmitting(false)
    setSelectedAction(null)
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    setSelectedAction('reject')
    await onReject?.(comment)
    setIsSubmitting(false)
    setSelectedAction(null)
  }

  if (run.status !== 'awaiting_approval') {
    return null
  }

  return (
    <Card className="relative overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/10">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 animate-pulse" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 ring-4 ring-amber-500/10">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-amber-100">Approval Required</CardTitle>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5">
                <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                <span className="text-xs font-medium text-amber-400">Waiting</span>
              </div>
            </div>
            <CardDescription className="mt-1 text-amber-200/70">
              Skhemata Runtime Triage Agent requires your approval before executing the following action
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
                Proposed Action
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {run.current_step}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />
        
        <div className="space-y-3">
          <label htmlFor="approval-comment" className="text-sm font-medium flex items-center gap-2">
            Feedback
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="approval-comment"
            placeholder="Add notes, instructions, or feedback for the agent..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-none bg-background/50 border-border/50 focus:border-amber-500/50 focus:ring-amber-500/20"
          />
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            size="lg"
            className={cn(
              'flex-1 h-12 text-base font-semibold transition-all',
              'bg-emerald-600 hover:bg-emerald-500 text-white',
              'shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40',
              'border border-emerald-500/50',
              selectedAction === 'approve' && 'scale-[0.98]'
            )}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {isSubmitting && selectedAction === 'approve' ? 'Approving...' : 'Approve Action'}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            size="lg"
            variant="outline"
            className={cn(
              'flex-1 h-12 text-base font-semibold transition-all',
              'border-2 border-red-500/50 text-red-400',
              'hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/70',
              selectedAction === 'reject' && 'scale-[0.98]'
            )}
          >
            <XCircle className="h-5 w-5 mr-2" />
            {isSubmitting && selectedAction === 'reject' ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-1">
          Review the proposed action carefully before making a decision
        </p>
      </CardContent>
    </Card>
  )
}
