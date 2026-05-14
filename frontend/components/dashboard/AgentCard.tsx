'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import StatusDot from '@/components/ui/StatusDot'
import type { AgentInfo } from '@/lib/types'

interface AgentCardProps {
  agent: AgentInfo
  index?: number
}

const AGENT_ROUTE: Record<string, string> = {
  hunter: '/hunter',
  leon:   '/leon',
  sapp:   '/sapp',
  ao:     '/ao',
  optix:  '/optix',
  ninja:  '/ninja',
}

const DOMAIN_ACCENT: Record<string, string> = {
  'Automated Trading': 'border-success/30 hover:border-success/60',
  'E-Commerce':        'border-warning/30 hover:border-warning/60',
  'Creative':          'border-purple/30 hover:border-purple/60',
  'Career':            'border-cyan/30 hover:border-cyan/60',
  'Research':          'border-purple/30 hover:border-purple/60',
  'Investigations':    'border-danger/30 hover:border-danger/60',
}

export default function AgentCard({ agent, index = 0 }: AgentCardProps) {
  const route = AGENT_ROUTE[agent.id] ?? '/dashboard'
  const borderClass = DOMAIN_ACCENT[agent.domain] ?? 'border-cyan/20 hover:border-cyan/40'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Link href={route}>
        <div
          className={clsx(
            'card-glass rounded-xl p-4 border transition-all duration-200 cursor-pointer group',
            borderClass
          )}
        >
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-cyan transition-colors">
                {agent.name}
              </p>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                {agent.domain}
              </p>
            </div>
            <StatusDot status={agent.status} size="md" />
          </div>

          {/* Description */}
          <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
            {agent.description}
          </p>

          {/* Footer metrics */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-500">
              {agent.active_tasks > 0 ? (
                <span className="text-cyan">{agent.active_tasks} active task{agent.active_tasks !== 1 ? 's' : ''}</span>
              ) : (
                'No active tasks'
              )}
            </span>
            {agent.last_activity && (
              <span className="text-[10px] font-mono text-gray-600">
                {formatDistanceToNow(new Date(agent.last_activity), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
