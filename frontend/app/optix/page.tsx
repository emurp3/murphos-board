'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, BookOpen, Microscope, GitCommit } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import StatusDot from '@/components/ui/StatusDot'
import { getAgentReport, getRepoCommits } from '@/lib/api'
import type { AgentReport, GitCommit as Commit } from '@/lib/types'

// Safe metric accessor — avoids 'unknown' ReactNode errors
function m(metrics: Record<string, unknown> | undefined, key: string): string {
  const v = metrics?.[key];
  if (v === null || v === undefined) return 'N/A';
  return String(v);
}

const OPTIX_REPO = 'emurp3/optix'

export default function OptixPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [rep, com] = await Promise.allSettled([
        getAgentReport('optix'),
        getRepoCommits(OPTIX_REPO, 6),
      ])
      if (rep.status === 'fulfilled') setReport(rep.value)
      if (com.status === 'fulfilled') setCommits(com.value.commits)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple/10 border border-purple/30 flex items-center justify-center">
          <Eye className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Optix</h1>
          <p className="text-xs font-mono text-gray-500">Research · Dissertation · Murphy Optics R&D</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Dissertation %" value={loading ? '—' : m(report?.metrics, 'dissertation_pct')} accent="purple" sub="complete" />
        <MetricCard label="Chapters Done" value={loading ? '—' : m(report?.metrics, 'chapters_done')} accent="cyan" />
        <MetricCard label="R&D Experiments" value={loading ? '—' : m(report?.metrics, 'rd_experiments')} accent="warning" />
        <MetricCard label="Papers in Review" value={loading ? '—' : m(report?.metrics, 'papers_in_review')} accent="success" />
      </div>

      {/* Dissertation progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-xl border border-purple/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-purple-400" />
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Dissertation Progress</h2>
        </div>
        <div className="h-3 rounded-full bg-space-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple to-cyan"
            initial={{ width: 0 }}
            animate={{
              width: loading
                ? '0%'
                : `${Math.min(100, parseInt(report?.metrics?.dissertation_pct as string ?? '0') || 0)}%`,
            }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-[10px] font-mono text-gray-600 mt-2">
          {loading ? 'Loading…' : (report?.metrics?.dissertation_status as string ?? 'No status available')}
        </p>
      </motion.div>

      {/* Murphy Optics R&D */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card-glass rounded-xl border border-cyan/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Microscope className="h-4 w-4 text-cyan" />
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Murphy Optics R&D</h2>
        </div>
        <p className="text-sm text-gray-300">
          {loading ? '—' : (report?.metrics?.rd_status as string ?? 'No R&D update in latest report.')}
        </p>
      </motion.div>

      {/* Latest report */}
      {report && (
        <div className="card-glass rounded-xl border border-purple/20 p-5">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Agent Report — {report.period}</h2>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* Commits */}
      {commits.length > 0 && (
        <div className="card-glass rounded-xl border border-cyan/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan/10 flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-cyan" />
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Recent Commits — {OPTIX_REPO}</h2>
          </div>
          {commits.map((c) => (
            <a key={c.sha} href={c.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-space-700/30 transition-colors">
              <span className="font-mono text-[10px] text-cyan mt-0.5 flex-shrink-0">{c.sha}</span>
              <div>
                <p className="text-xs text-gray-200">{c.message}</p>
                <p className="text-[10px] text-gray-600">{c.author} · {new Date(c.date).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
