'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { getAlerts } from '@/lib/api'

export default function TopBar() {
  const [now, setNow] = useState<Date>(new Date())
  const [alertCount, setAlertCount] = useState<number>(0)
  const [connected, setConnected] = useState<boolean>(true)

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Alert badge
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await getAlerts()
        setAlertCount(alerts.filter((a) => !a.resolved).length)
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }
    fetchAlerts()
    const id = setInterval(fetchAlerts, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-14 bg-space-800 border-b border-cyan/10 flex items-center justify-between px-6 flex-shrink-0">
      {/* Title */}
      <div>
        <h1 className="text-sm font-mono font-semibold text-cyan tracking-[0.15em] uppercase">
          S.A. Executive Command
        </h1>
        <p className="text-[10px] font-mono text-gray-500 tracking-wider">MurphBoard Ecosystem</p>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* System clock */}
        <span className="font-mono text-xs text-gray-400 tabular-nums">
          {format(now, 'EEE MMM dd · HH:mm:ss')}
        </span>

        {/* Alert badge */}
        <div className="relative">
          <Bell className="h-4 w-4 text-gray-400" />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-danger" />
          )}
          <span
            className={`text-[10px] font-mono uppercase tracking-widest ${
              connected ? 'text-success' : 'text-danger'
            }`}
          >
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
