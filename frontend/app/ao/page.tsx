'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Send, CheckCircle, Clock } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import StatusDot from '@/components/ui/StatusDot'
import { getAgentReport } from '@/lib/api'
import type { AgentReport } from '@/lib/types'

export default function AOPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const rep = await getAgentReport('ao')
        setReport(rep)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = [
    { label: 'Applications Sent', key: 'applications_sent', icon: Send, accent: 'cyan' as const },
    { label: 'Interviews Pending', key: 'interviews_pending', icon: Clock, accent: 'warning' as const },
    { label: 'Offers Received', key: 'offers_received', icon: CheckCircle, accent: 'success' as const },
    { label: 'Active Pipelines', key: 'active_pipelines', icon: Briefcase, accent: 'purple' as const },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-cyan" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">AO</h1>
          <p className="text-xs font-mono text-gray-500">Career · Job Application Pipeline</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, key, accent }) => (
          <MetricCard
            key={key}
            label={label}
            value={loading ? '—' : (report?.metrics?.[key] as string ?? 'N/A')}
            accent={accent}
          />
        ))}
      </div>

      {/* Pipeline visualisation */}
      <div className="card-glass rounded-xl border border-cyan/10 p-5">
        <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Application Pipeline</h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-space-700 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {['Applied', 'Screening', 'Interview', 'Offer', 'Accepted'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-2 flex-1">
                <div className="flex-1 text-center">
                  <div className="h-2 rounded-full bg-cyan/20 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-cyan rounded-full"
                      style={{ width: `${Math.max(10, 100 - i * 20)}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-gray-600 mt-1 uppercase">{stage}</p>
                </div>
                {i < 4 && <div className="w-2 h-px bg-gray-700 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report */}
      {report && (
        <div className="card-glass rounded-xl border border-cyan/20 p-5">
          <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Agent Report — {report.period}</h2>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
        </div>
      )}

      {!report && !loading && (
        <p className="text-xs text-gray-500 font-mono">No report found for AO. Reports are generated daily at 6 AM ET.</p>
      )}
    </div>
  )
}
