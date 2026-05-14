// ─────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type AgentStatus = 'online' | 'idle' | 'warning' | 'offline'
export type AlertLevel = 'info' | 'warning' | 'critical'
export type DeployState = 'live' | 'build_in_progress' | 'deactivated' | 'failed' | 'unknown'

// ─────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────

export interface AgentInfo {
  id: string
  name: string
  domain: string
  status: AgentStatus
  last_activity: string | null
  active_tasks: number
  description: string
}

export interface AgentReport {
  id: string
  agent_id: string
  period: string
  summary: string
  metrics: Record<string, unknown>
  created_at: string
}

// ─────────────────────────────────────────────
// Task
// ─────────────────────────────────────────────

export interface Task {
  id: string
  agent_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  agent_id: string
  title: string
  description?: string
  priority?: TaskPriority
}

// ─────────────────────────────────────────────
// Memory
// ─────────────────────────────────────────────

export interface MemoryEntry {
  id: string
  category: string
  content: string
  tags: string[]
  created_at: string
}

export interface MemoryEntryCreate {
  category: string
  content: string
  tags?: string[]
}

// ─────────────────────────────────────────────
// Deployments
// ─────────────────────────────────────────────

export interface DeploymentStatus {
  service_id: string
  service_name: string
  state: DeployState
  url: string | null
  last_deploy_at: string | null
  checked_at: string
}

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────

export interface AlertItem {
  id: string
  level: AlertLevel
  message: string
  source: string
  resolved: boolean
  created_at: string
}

// ─────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────

export interface DailyBrief {
  generated_at: string
  summary: string
  agent_highlights: Array<{ id: string; name: string; status: AgentStatus; active_tasks: number }>
  active_alerts: number
  open_tasks: number
  deployments_healthy: number
  deployments_degraded: number
}

export interface EcosystemReport {
  generated_at: string
  agents: AgentInfo[]
  deployments: DeploymentStatus[]
  alerts: AlertItem[]
  open_tasks: number
  summary: string | null
}

// ─────────────────────────────────────────────
// Command Overview
// ─────────────────────────────────────────────

export interface CommandOverview {
  agents: AgentInfo[]
  open_tasks: number
  deployments: {
    total: number
    healthy: number
    degraded: number
    services: DeploymentStatus[]
  }
  checked_at: string
}

// ─────────────────────────────────────────────
// GitHub
// ─────────────────────────────────────────────

export interface GitCommit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

export interface GitIssue {
  number: number
  title: string
  state: string
  labels: string[]
  created_at: string
  url: string
}

// ─────────────────────────────────────────────
// API error shape
// ─────────────────────────────────────────────

export interface APIError {
  error: string
  detail?: string
  code: number
}
