'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Film, Calendar } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import StatusDot from '@/components/ui/StatusDot'
import { getAgentReport, getRepoCommits } from '@/lib/api'
import type { AgentReport, GitCommit } from '@/lib/types'
import { differenceInDays } from 'date-fns'

// Safe metric accessor — avoids 'unknown' ReactNode errors
function m(metrics: Record<string, unknown> | undefined, key: string): string {
  const v = metrics?.[key];
  if (v === null || v === undefined) return 'N/A';
  return String(v);
}

const SAPP_REPO = 'emurp3/SAPP'
const ALBUM_DEADLINE = new Date('2024-06-19')

export default function SAPPPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [rep, com] = await Promise.allSettled([
        getAgentReport('sapp'),
        getRepoCommits(SAPP_REPO, 6),
      ])
      if (rep.status === 'fulfilled') setReport(rep.value)
      if (com.status === 'fulfilled') setCommits(com.value.commits)
      setLoading(false)
    }
    load()
  }, [])

  const daysToAlbum = differenceInDays(ALBUM_DEADLINE, new Date())

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple/10 border border-purple/30 flex items-center justify-center">
          <Music className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">SAPP</h1>
          <p className="text-xs font-mono text-gray-500">Creative Operations · Music + Film</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Album Deadline"
          value="Jun 19"
          sub={daysToAlbum > 0 ? `${daysToAlbum}d remaining` : 'Deadline passed'}
          accent={daysToAlbum > 30 ? 'success' : daysToAlbum > 7 ? 'warning' : 'danger'}
        />
        <MetricCard
          label="Tracks Complete"
          value={loading ? '—' : m(report?.metrics, 'tracks_complete')}
          accent="purple"
        />
        <MetricCard
          label="Movie Status"
          value={loading ? '—' : m(report?.metrics, 'movie_status')}
          accent="cyan"
          sub="Gabe's Return"
        />
        <MetricCard
          label="Content Pipeline"
          value={loading ? '—' : m(report?.metrics, 'pipeline_items')}
          accent="warning"
          sub="queued"
        />
      </div>

      {/* Deadline countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-glass rounded-xl border border-purple/30 p-5 flex items-center gap-4"
      >
        <Calendar className="h-8 w-8 text-purple-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Album Drop Countdown</p>
          <p className="text-2xl font-bold text-white">
            {daysToAlbum > 0 ? `${daysToAlbum} days` : 'Released'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">June 19 · S.A.P.P. album release deadline</p>
        </div>
      </motion.div>

      {/* Film panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card-glass rounded-xl border border-cyan/10 p-5 flex items-center gap-4"
      >
        <Film className="h-8 w-8 text-cyan flex-shrink-0" />
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Gabe's Return</p>
          <p className="text-sm text-gray-300">
            {loading ? '—' : (report?.metrics?.movie_summary as string ?? 'No movie update in latest report.')}
          </p>
        </div>
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
          <div className="px-4 py-3 border-b border-cyan/10">
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">{SAPP_REPO} — Recent Commits</h2>
          </div>
          {commits.map((c) => (
            <a
              key={c.sha}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-space-700/30 transition-colors"
            >
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
