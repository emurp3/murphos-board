'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, AlertTriangle, Cpu } from 'lucide-react'
import AgentCard from '@/components/dashboard/AgentCard'
import AlertFeed from '@/components/dashboard/AlertFeed'
import DeploymentPanel from '@/components/dashboard/DeploymentPanel'
import MetricCard from '@/components/ui/MetricCard'
import { getCommandOverview, getDailyBrief } from '@/lib/api'
import type { CommandOverview, DailyBrief } from '@/lib/types'

export default function DashboardPage() {
  const [overview, setOverview] = useState<CommandOverview | null>(null)
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [briefError, setBriefError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const ov = await getCommandOverview()
        setOverview(ov)
      } catch (e) {
        setOverviewError(e instanceof Error ? e.message : 'Failed to load overview')
      }

      try {
        const br = await getDailyBrief()
        setBrief(br)
      } catch (e) {
        setBriefError(e instanceof Error ? e.message : 'Failed to load daily brief')
      }

      setLoading(false)
    }
    load()
  }, [])

  const agents = overview?.agents ?? []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Executive Command Center
        </h1>
        <p className="text-xs font-mono text-gray-500 mt-0.5">
          {overview?.checked_at
            ? `Last updated ${new Date(overview.checked_at).toLocaleTimeString()}`
            : 'Loading…'}
        </p>
      </motion.div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Open Tasks"
          value={loading ? '—' : (overview?.open_tasks ?? 0)}
          accent="cyan"
          sub="across all agents"
        />
        <MetricCard
          label="Active Alerts"
          value={loading ? '—' : (brief?.active_alerts ?? 0)}
          accent={brief && brief.active_alerts > 0 ? 'danger' : 'success'}
          sub="unresolved"
        />
        <MetricCard
          label="Healthy Services"
          value={loading ? '—' : (overview?.deployments.healthy ?? 0)}
          accent="success"
          sub={`of ${overview?.deployments.total ?? 0} total`}
        />
        <MetricCard
          label="Degraded"
          value={loading ? '—' : (overview?.deployments.degraded ?? 0)}
          accent={overview && overview.deployments.degraded > 0 ? 'warning' : 'success'}
          sub="services"
        />
      </div>

      {/* Daily Brief */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="card-glass rounded-xl border border-purple/20 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-purple" />
          <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">S.A. Daily Brief</h2>
        </div>

        {briefError && (
          <p className="text-xs text-danger font-mono">{briefError}</p>
        )}

        {!briefError && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {loading
              ? <span className="inline-block h-4 w-3/4 bg-space-700 rounded animate-pulse" />
              : (brief?.summary ?? 'No briefing available.')}
          </p>
        )}

        {brief && !loading && (
          <p className="text-[10px] font-mono text-gray-600 mt-2">
            Generated {new Date(brief.generated_at).toLocaleString()}
          </p>
        )}
      </motion.div>

      {/* Agent grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-cyan" />
          <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Agent Status</h2>
        </div>

        {overviewError && (
          <p className="text-xs text-danger font-mono mb-3">{overviewError}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-space-800 border border-cyan/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Lower panels: Deployments + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Deployment Health</h2>
          </div>
          <DeploymentPanel />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Live Alerts</h2>
          </div>
          <AlertFeed />
        </div>
      </div>
    </div>
  )
}
