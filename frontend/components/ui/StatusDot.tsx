'use client'

import clsx from 'clsx'
import type { AgentStatus } from '@/lib/types'

interface StatusDotProps {
  status: AgentStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const STATUS_CONFIG: Record<AgentStatus, { color: string; ping: string; label: string }> = {
  online:  { color: 'bg-success',  ping: 'bg-success',  label: 'Online'  },
  idle:    { color: 'bg-cyan',     ping: 'bg-cyan',     label: 'Idle'    },
  warning: { color: 'bg-warning',  ping: 'bg-warning',  label: 'Warning' },
  offline: { color: 'bg-gray-600', ping: 'bg-gray-600', label: 'Offline' },
}

const SIZE_MAP = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

export default function StatusDot({ status, size = 'md', showLabel = false }: StatusDotProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline
  const sizeClass = SIZE_MAP[size]
  const isAnimated = status !== 'offline'

  return (
    <span className="relative inline-flex items-center gap-2">
      <span className={clsx('relative inline-flex', sizeClass)}>
        {isAnimated && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
              cfg.ping
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full', sizeClass, cfg.color)} />
      </span>
      {showLabel && (
        <span className="text-xs font-mono text-gray-400 capitalize">{cfg.label}</span>
      )}
    </span>
  )
}
