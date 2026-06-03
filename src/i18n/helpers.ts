import { TxKey } from './translations'

export function kpiTitleKey(id: string): TxKey {
  return `kpi.${id}.title` as TxKey
}

export function mlMetricKey(key: string): TxKey {
  return `ml.${key}` as TxKey
}

export function featureKey(name: string): TxKey {
  return `features.${name}` as TxKey
}

export function dayKey(day: string): TxKey {
  return `days.${day}` as TxKey
}

export function seasonKey(season: string): TxKey {
  return `seasons.${season}` as TxKey
}

export function timeKey(time: string): TxKey {
  return `times.${time}` as TxKey
}

export function urgencyKey(level: string): TxKey {
  return `urgency.${level}` as TxKey
}

export function regionKey(region: string): TxKey {
  return `regions.${region}` as TxKey
}

export function staffingKey(level: string): TxKey {
  const map: Record<string, TxKey> = {
    CRITICAL: 'staffing.critical',
    HIGH: 'staffing.high',
    MEDIUM: 'staffing.medium',
    LOW: 'staffing.low',
  }
  return map[level] ?? 'staffing.low'
}

export const riskLevels = ['normal', 'monitoring', 'staff', 'critical'] as const

export function riskKeys(): { key: typeof riskLevels[number]; min: number; color: string }[] {
  return [
    { key: 'normal', min: 0, color: '#22C55E' },
    { key: 'monitoring', min: 40, color: '#0EA5E9' },
    { key: 'staff', min: 65, color: '#F59E0B' },
    { key: 'critical', min: 85, color: '#EF4444' },
  ]
}
