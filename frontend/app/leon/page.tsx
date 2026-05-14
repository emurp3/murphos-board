'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Package, GitCommit } from 'lucide-react'
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

const LEON_REPO = 'emurp3/leon-commerce'

export default function LeonPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [rep, com] = await Promise.allSettled([
        getAgentReport('leon'),
        getRepoCommits(LEON_REPO, 6),
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
        <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Leon</h1>
          <p className="text-xs font-mono text-gray-500">E-Commerce · Etsy / Gumroad / Printful</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Active Listings" value={loading ? '—' : m(report?.metrics, 'active_listings')} accent="warning" />
        <MetricCard label="Orders Today" value={loading ? '—' : m(report?.metrics, 'orders_today')} accent="success" />
        <MetricCard label="Shirts in Pipeline" value={loading ? '—' : m(report?.metrics, 'shirts_pipeline')} accent="cyan" />
        <MetricCard label="Revenue (MTD)" value={loading ? '—' : m(report?.metrics, 'revenue_mtd')} accent="success" />
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Etsy', 'Gumroad', 'Printful'].map((platform) => (
          <motion.div
            key={platform}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass rounded-xl border border-warning/15 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-gray-200">{platform}</p>
            </div>
            <p className="text-xs text-gray-500">
              {loading ? 'Loading…' : (report?.metrics?.[platform.toLowerCase() as never] as string ?? 'No data')}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Latest report */}
      {report && (
        <div className="card-glass rounded-xl border border-warning/20 p-5">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Agent Report — {report.period}</h2>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* Commits */}
      {commits.length > 0 && (
        <div className="card-glass rounded-xl border border-cyan/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan/10 flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-cyan" />
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Recent Commits</h2>
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
