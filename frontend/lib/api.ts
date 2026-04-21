import type { Run, TimelineEvent } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `API request failed: ${response.status}`)
  }

  return response.json()
}

export async function listRuns(): Promise<Run[]> {
  return apiFetch<Run[]>('/api/runs')
}

export async function getRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}`)
}

export async function getRunEvents(id: string): Promise<TimelineEvent[]> {
  return apiFetch<TimelineEvent[]>(`/api/runs/${id}/events`)
}

export async function createRun(input: {
  tenant: string
  region: string
  problem_description: string
}): Promise<Run> {
  return apiFetch<Run>('/api/runs', {
    method: 'POST',
    body: JSON.stringify({
      tenant: input.tenant,
      region: input.region,
      goal: input.problem_description,
      problem_description: input.problem_description,
    }),
  })
}

export async function approveRun(id: string, comment: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
}

export async function rejectRun(id: string, comment: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
}

export async function resumeRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}/resume`, { method: 'POST' })
}

export async function cancelRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}/cancel`, { method: 'POST' })
}
