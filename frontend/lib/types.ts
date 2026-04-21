export type RunStatus = 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled'

export type EventType = 'observation' | 'hypothesis' | 'tool_execution' | 'approval_request' | 'status_change'

export interface TimelineEvent {
  id: string
  timestamp: string
  type: EventType
  title: string
  description: string
  metadata?: Record<string, unknown>
}

export interface Observation {
  id: string
  timestamp: string
  source: string
  content: string
  severity: 'info' | 'warning' | 'critical'
}

export interface Hypothesis {
  id: string
  timestamp: string
  description: string
  confidence: number
  supporting_evidence: string[]
  status: 'proposed' | 'investigating' | 'confirmed' | 'rejected'
}

export interface ToolOutput {
  id: string
  timestamp: string
  tool_name: string
  input: Record<string, unknown>
  output: string
  status: 'success' | 'error'
  duration_ms: number
}

export interface Run {
  id: string
  tenant: string
  region: string
  goal?: string
  problem_description: string
  status: RunStatus
  current_step: string
  scenario?: string
  approval_state?: 'not_required' | 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  timeline: TimelineEvent[]
  observations: Observation[]
  hypotheses: Hypothesis[]
  tool_outputs: ToolOutput[]
  proposed_actions?: ProposedAction[]
  checkpoints?: Record<string, unknown>[]
  errors?: string[]
  final_summary?: string | null
}

export interface ProposedAction {
  id: string
  type: string
  label: string
  risk: string
  params: Record<string, unknown>
  status: 'proposed' | 'approved' | 'rejected' | 'executed'
  created_at: string
}
