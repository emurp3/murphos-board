'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sword, Search, FileText, AlertCircle } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import StatusDot from '@/components/ui/StatusDot'
import { getAgentReport, delegateTask } from '@/lib/api'
import type { AgentReport } from '@/lib/types'
import clsx from 'clsx'

export default function NinjaPage() {
  const [report, setReport] = useState<AgentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [caseTitle, setCaseTitle] = useState('')
  const [caseDesc, setCaseDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const rep = await getAgentReport('ninja')
        setReport(rep)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseTitle.trim()) return
    setSubmitting(true)
    try {
      const task = await delegateTask('ninja', { title: caseTitle, description: caseDesc, priority: 'high' })
      setSubmitted(`Case #${task.id.slice(0, 8)} opened and routed to Ninja Squad.`)
      setCaseTitle('')
      setCaseDesc('')
    } catch (err) {
      setSubmitted(err instanceof Error ? err.message : 'Failed to open case')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center">
          <Sword className="h-5 w-5 text-danger" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Ninja Squad</h1>
          <p className="text-xs font-mono text-gray-500">Investigations · Active Cases · Intelligence</p>
        </div>
        <StatusDot status="idle" size="lg" showLabel />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Open Cases" value={loading ? '—' : (report?.metrics?.open_cases as string ?? 'N/A')} accent="danger" />
        <MetricCard label="Closed Cases" value={loading ? '—' : (report?.metrics?.closed_cases as string ?? 'N/A')} accent="success" />
        <MetricCard label="Leads Active" value={loading ? '—' : (report?.metrics?.active_leads as string ?? 'N/A')} accent="warning" />
        <MetricCard label="Intel Reports" value={loading ? '—' : (report?.metrics?.intel_reports as string ?? 'N/A')} accent="cyan" />
      </div>

      {/* Open new case */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={submitCase}
        className="card-glass rounded-xl border border-danger/20 p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-danger" />
          <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Open New Case</h2>
        </div>
        <input
          value={caseTitle}
          onChange={(e) => setCaseTitle(e.target.value)}
          placeholder="Case title / investigation target…"
          required
          className="w-full bg-space-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-danger/40 transition-colors"
        />
        <textarea
          value={caseDesc}
          onChange={(e) => setCaseDesc(e.target.value)}
          rows={3}
          placeholder="Case brief / initial intel…"
          className="w-full bg-space-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-danger/40 transition-colors resize-none"
        />
        {submitted && (
          <p className={clsx('text-xs font-mono', submitted.includes('opened') ? 'text-success' : 'text-danger')}>
            {submitted}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !caseTitle.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-medium hover:bg-danger/20 transition-all disabled:opacity-40"
        >
          <Search className="h-3.5 w-3.5" />
          {submitting ? 'Opening…' : 'Open Case'}
        </button>
      </motion.form>

      {/* Investigation Log */}
      {report && (
        <div className="card-glass rounded-xl border border-danger/15 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-danger" />
            <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Investigation Log — {report.period}</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
          {(report.metrics as any)?.active_case_titles && (
            <div className="mt-4 space-y-2">
              {((report.metrics as any).active_case_titles as string[]).map((title, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <span className="text-danger">▶</span>
                  {title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <p className="text-xs text-gray-500 font-mono">No intelligence report found. Reports are generated daily at 6 AM ET.</p>
      )}
    </div>
  )
}
