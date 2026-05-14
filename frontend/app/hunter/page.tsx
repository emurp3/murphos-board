'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, GitCommit, AlertCircle } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import StatusDot from '@/components/ui/StatusDot'
import { getAgentReport, getRepoCommits, getRepoIssues } from '@/lib/api'
import type { AgentReport, GitCommit as Commit, GitIssue } from '@/lib/types'

const HUNTER_REPO = 'emurp3/Hunter-AutoTrader'

export default function HunterPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [issues, setIssues] = useState<GitIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [rep, com, iss] = await Promise.allSettled([
          getAgentReport('hunter'),
          getRepoCommits(HUNTER_REPO, 8),
          getRepoIssues(HUNTER_REPO),
        ])
        if (rep.status === 'fulfilled') setReport(rep.value)
        if (com.status === 'fulfilled') setCommits(com.value.commits)
        if (iss.status === 'fulfilled') setIssues(iss.value.issues)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load Hunter data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-success" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Hunter</h1>
          <p className="text-xs font-mono text-gray-500">Automated Trading · Revenue Engine</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {error && <p className="text-xs text-danger font-mono">{error}</p>}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Active Strategies" value={loading ? '—' : (report?.metrics?.active_strategies as string ?? 'N/A')} accent="success" />
        <MetricCard label="Open Positions" value={loading ? '—' : (report?.metrics?.open_positions as string ?? 'N/A')} accent="cyan" />
        <MetricCard label="Today P&L" value={loading ? '—' : (report?.metrics?.daily_pnl as string ?? 'N/A')} accent="success" />
        <MetricCard label="Congress Signals" value={loading ? '—' : (report?.metrics?.congress_signals as string ?? 'N/A')} accent="warning" />
      </div>

      {/* Latest Report */}
      {report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-xl border border-success/20 p-5">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Latest Agent Report — {report.period}</h2>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
        </motion.div>
      )}

      {/* Commits */}
      <div className="card-glass rounded-xl border border-cyan/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-cyan/10 flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-cyan" />
          <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Recent Commits — {HUNTER_REPO}</h2>
        </div>
        <div>
          {loading && (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-space-700 rounded animate-pulse" />)}
            </div>
          )}
          {!loading && commits.length === 0 && (
            <p className="p-4 text-xs text-gray-500 font-mono">No commits found — check GITHUB_TOKEN</p>
          )}
          {commits.map((c) => (
            <a
              key={c.sha}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-space-700/30 transition-colors"
            >
              <span className="font-mono text-[10px] text-cyan mt-0.5 flex-shrink-0">{c.sha}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 truncate">{c.message}</p>
                <p className="text-[10px] text-gray-600">{c.author} · {new Date(c.date).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="card-glass rounded-xl border border-warning/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-warning/10 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Open Issues</h2>
          </div>
          {issues.map((issue) => (
            <a
              key={issue.number}
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-space-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-gray-600">#{issue.number}</span>
                <span className="text-xs text-gray-200">{issue.title}</span>
              </div>
              <div className="flex gap-1">
                {issue.labels.map((l) => (
                  <span key={l} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-warning/10 text-warning">{l}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
