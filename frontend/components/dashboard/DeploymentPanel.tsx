'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, RefreshCw, Server } from 'lucide-react'
import clsx from 'clsx'
import { getDeploymentStatus } from '@/lib/api'
import type { DeploymentStatus } from '@/lib/types'

const STATE_CONFIG = {
  live:               { label: 'Live',         color: 'text-success', dot: 'bg-success' },
  build_in_progress:  { label: 'Building',     color: 'text-warning', dot: 'bg-warning' },
  deactivated:        { label: 'Deactivated',  color: 'text-gray-500', dot: 'bg-gray-600' },
  failed:             { label: 'Failed',       color: 'text-danger',  dot: 'bg-danger'  },
  unknown:            { label: 'Unknown',      color: 'text-gray-500', dot: 'bg-gray-600' },
}

export default function DeploymentPanel() {
  const [services, setServices] = useState<DeploymentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setError(null)
      const data = await getDeploymentStatus()
      setServices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deployment status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card-glass rounded-xl border border-cyan/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan/10">
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-cyan" />
          <h2 className="text-xs font-mono text-gray-300 uppercase tracking-widest">Deployments</h2>
        </div>
        <button
          onClick={fetchStatus}
          className="text-gray-500 hover:text-cyan transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div>
        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-space-700 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="p-4 text-xs text-warning font-mono">{error}</p>
        )}

        {!loading && !error && services.length === 0 && (
          <p className="p-4 text-xs text-gray-500 font-mono text-center">
            No services found — check RENDER_API_KEY
          </p>
        )}

        {!loading && !error && services.map((svc, i) => {
          const cfg = STATE_CONFIG[svc.state] ?? STATE_CONFIG.unknown
          return (
            <motion.div
              key={svc.service_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-space-700/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
                <div>
                  <p className="text-xs font-medium text-gray-200">{svc.service_name}</p>
                  {svc.last_deploy_at && (
                    <p className="text-[10px] font-mono text-gray-600">
                      {new Date(svc.last_deploy_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx('text-[10px] font-mono uppercase tracking-wider', cfg.color)}>
                  {cfg.label}
                </span>
                {svc.url && (
                  <a
                    href={svc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-cyan transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
