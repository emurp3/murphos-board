'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Plus, Send } from 'lucide-react'
import { getAgents, createTask } from '@/lib/api'
import type { AgentInfo, Task, TaskPriority } from '@/lib/types'
import StatusDot from '@/components/ui/StatusDot'
import clsx from 'clsx'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: 'text-gray-400' },
  { value: 'medium',   label: 'Medium',   color: 'text-cyan'    },
  { value: 'high',     label: 'High',     color: 'text-warning' },
  { value: 'critical', label: 'Critical', color: 'text-danger'  },
]

export default function CommandPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [agentId, setAgentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAgents()
        setAgents(data)
        if (data.length > 0) setAgentId(data[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load agents')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !agentId) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const task = await createTask({ agent_id: agentId, title, description, priority })
      setTasks((prev) => [task, ...prev])
      setTitle('')
      setDescription('')
      setSuccess(`Task created and routed to ${agentId.toUpperCase()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
          <Terminal className="h-5 w-5 text-cyan" />
          Task Queue
        </h1>
        <p className="text-xs font-mono text-gray-500 mt-0.5">Route tasks to agents</p>
      </motion.div>

      {/* Create task form */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="card-glass rounded-xl border border-cyan/20 p-5 space-y-4"
      >
        <h2 className="text-xs font-mono text-cyan uppercase tracking-widest flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Task
        </h2>

        {/* Agent selector */}
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
            Route to Agent
          </label>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setAgentId(agent.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  agentId === agent.id
                    ? 'bg-cyan/10 border-cyan/40 text-cyan'
                    : 'bg-space-700/40 border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                <StatusDot status={agent.status} size="sm" />
                {agent.name}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
            Task Title *
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe the task…"
            className="w-full bg-space-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan/40 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Additional context…"
            className="w-full bg-space-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan/40 transition-colors resize-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
            Priority
          </label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                  priority === opt.value
                    ? `${opt.color} bg-space-600 border-current/40`
                    : 'text-gray-500 border-white/10 hover:border-white/20'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {error && <p className="text-xs text-danger font-mono">{error}</p>}
        {success && <p className="text-xs text-success font-mono">✓ {success}</p>}

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Routing…' : 'Route Task'}
        </button>
      </motion.form>

      {/* Task history */}
      {tasks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
            Session Tasks ({tasks.length})
          </h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="card-glass rounded-lg px-4 py-3 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-200">{task.title}</p>
                  <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                    → {task.agent_id.toUpperCase()} · {task.priority}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-600 uppercase">{task.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
