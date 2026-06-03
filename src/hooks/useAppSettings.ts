import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../types'

const KEY = 'er-app-settings'
const defaults: AppSettings = { criticalAlerts: true, hourlySummary: true }

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return { settings, update }
}
