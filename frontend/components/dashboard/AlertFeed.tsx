'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { getAlerts } from '@/lib/api'
import type { AlertItem } from '@/lib/types'

const LEVEL_CONFIG = {
  info:     { icon: Info,          color: 'text-cyan',    bg: 'bg-cyan/10',    border: 'border-cyan/20'    },
  warning:  { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  critical: { icon: AlertCircle,   color: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/20'  },
}

export default function AlertFeed() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setError(null)
      const data = await getAlerts()
      setAlerts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const id = setInterval(fetchAlerts, 20_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card-glass rounded-xl border border-cyan/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan/10">
        <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Alert Feed</h2>
        <button
          onClick={fetchAlerts}
          className="text-gray-500 hover:text-cyan transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-space-700 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="p-4 text-xs text-danger font-mono">{error}</p>
        )}

        {!loading && !error && alerts.length === 0 && (
          <p className="p-4 text-xs text-gray-500 font-mono text-center">
            ✓ No active alerts
          </p>
        )}

        <AnimatePresence initial={false}>
          {!loading && !error &&
            alerts.map((alert) => {
              const cfg = LEVEL_CONFIG[alert.level] ?? LEVEL_CONFIG.info
              const Icon = cfg.icon
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className={clsx(
                    'flex items-start gap-3 px-4 py-3 border-b border-white/5',
                    cfg.bg
                  )}
                >
                  <Icon className={clsx('h-3.5 w-3.5 mt-0.5 flex-shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-600">{alert.source}</span>
                      {alert.created_at && (
                        <span className="text-[10px] text-gray-600">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
        </AnimatePresence>
      </div>
    </div>
  )
}
