/**
 * Typed API client for the S.A. backend.
 * All functions throw on non-2xx responses with a structured error.
 */

import type {
  AgentInfo,
  AgentReport,
  AlertItem,
  CommandOverview,
  DailyBrief,
  DeploymentStatus,
  EcosystemReport,
  GitCommit,
  GitIssue,
  MemoryEntry,
  MemoryEntryCreate,
  Task,
  TaskCreate,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ─────────────────────────────────────────────
// Fetch helper
// ─────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 0 }, // always fresh — this is a live ops dashboard
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body?.detail ?? body?.error ?? detail
    } catch {
      // ignore parse failure
    }
    throw new Error(`API ${res.status}: ${detail}`)
  }
  return res.json() as Promise<T>
}

// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────

export const getHealth = () => apiFetch<{ status: string; timestamp: string; version: string }>('/health')

// ─────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────

export const getCommandOverview = () => apiFetch<CommandOverview>('/api/command/overview')
export const getAlerts = () => apiFetch<AlertItem[]>('/api/command/alerts')
export const createTask = (body: TaskCreate) =>
  apiFetch<Task>('/api/command/task', { method: 'POST', body: JSON.stringify(body) })

// ─────────────────────────────────────────────
// Deployments
// ─────────────────────────────────────────────

export const getDeploymentStatus = () => apiFetch<DeploymentStatus[]>('/api/deployments/status')
export const getGitHubDeploymentSummary = () =>
  apiFetch<{ repos: Array<{ repo: string; commits: GitCommit[]; error?: string }> }>(
    '/api/deployments/github'
  )
export const checkService = (service_id: string) =>
  apiFetch<DeploymentStatus>('/api/deployments/check', {
    method: 'POST',
    body: JSON.stringify({ service_id }),
  })

// ─────────────────────────────────────────────
// Agents
// ─────────────────────────────────────────────

export const getAgents = () => apiFetch<AgentInfo[]>('/api/agents')
export const delegateTask = (agentId: string, body: { title: string; description?: string; priority?: string }) =>
  apiFetch<Task>(`/api/agents/${agentId}/task`, { method: 'POST', body: JSON.stringify(body) })
export const getAgentReport = (agentId: string) =>
  apiFetch<AgentReport | null>(`/api/agents/${agentId}/report`)

// ─────────────────────────────────────────────
// Memory
// ─────────────────────────────────────────────

export const getMemory = (category?: string) =>
  apiFetch<MemoryEntry[]>(`/api/memory${category ? `?category=${encodeURIComponent(category)}` : ''}`)
export const createMemory = (body: MemoryEntryCreate) =>
  apiFetch<MemoryEntry>('/api/memory', { method: 'POST', body: JSON.stringify(body) })
export const searchMemory = (q: string) =>
  apiFetch<MemoryEntry[]>(`/api/memory/search?q=${encodeURIComponent(q)}`)

// ─────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────

export const getDailyBrief = () => apiFetch<DailyBrief>('/api/reports/daily')
export const getEcosystemReport = () => apiFetch<EcosystemReport>('/api/reports/ecosystem')
export const triggerReport = (report_type: 'daily' | 'ecosystem') =>
  apiFetch<{ report_id: string; status: string; type: string }>('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ report_type }),
  })

// ─────────────────────────────────────────────
// GitHub
// ─────────────────────────────────────────────

export const getMonitoredRepos = () => apiFetch<{ repos: string[] }>('/api/github/repos')
export const getRepoCommits = (repo: string, perPage = 10) =>
  apiFetch<{ repo: string; commits: GitCommit[] }>(
    `/api/github/commits/${encodeURIComponent(repo)}?per_page=${perPage}`
  )
export const getRepoIssues = (repo: string, state = 'open') =>
  apiFetch<{ repo: string; issues: GitIssue[] }>(
    `/api/github/issues/${encodeURIComponent(repo)}?state=${state}`
  )
