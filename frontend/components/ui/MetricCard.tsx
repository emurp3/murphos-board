'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  accent?: 'cyan' | 'success' | 'warning' | 'danger' | 'purple'
  className?: string
}

const ACCENT_CLASSES: Record<string, string> = {
  cyan:    'border-cyan/30 text-cyan',
  success: 'border-success/30 text-success',
  warning: 'border-warning/30 text-warning',
  danger:  'border-danger/30 text-danger',
  purple:  'border-purple/30 text-purple',
}

export default function MetricCard({
  label,
  value,
  sub,
  trend,
  trendValue,
  accent = 'cyan',
  className,
}: MetricCardProps) {
  const accentClass = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.cyan

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx(
        'card-glass rounded-xl p-4 border',
        accentClass,
        className
      )}
    >
      <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={clsx('text-3xl font-bold', accentClass.split(' ')[1])}>{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={clsx('flex items-center gap-0.5 text-xs font-mono', {
                'text-success': trend === 'up',
                'text-danger':  trend === 'down',
                'text-gray-500': trend === 'flat',
              })}
            >
              {trend === 'up'   && <TrendingUp  className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'flat' && <Minus        className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </div>
      )}
    </motion.div>
  )
}
