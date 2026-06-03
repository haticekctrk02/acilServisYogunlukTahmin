import {
  Activity,
  AlertTriangle,
  BedDouble,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { kpiTitleKey } from '../../i18n/helpers'
import type { CrowdLevel, KpiData } from '../../types'
import { Sparkline } from './Sparkline'

const icons = {
  activity: Activity,
  trending: TrendingUp,
  clock: Clock,
  alert: AlertTriangle,
  bed: BedDouble,
  users: Users,
}

interface KpiCardProps {
  data: KpiData
}

export function KpiCard({ data }: KpiCardProps) {
  const { t } = useLanguage()
  const Icon = icons[data.icon as keyof typeof icons] ?? Activity
  const isUp = data.trend === 'up'
  const changeColor =
    data.id === 'waiting'
      ? isUp
        ? 'text-critical'
        : 'text-success'
      : isUp
        ? 'text-warning'
        : 'text-success'

  const displayValue =
    data.id === 'risk' && typeof data.value === 'string'
      ? t(`crowd.${data.value as CrowdLevel}`)
      : data.value

  const unitLabel =
    data.unit === 'patients'
      ? t('common.patients')
      : data.unit === 'min'
        ? t('common.min')
        : data.unit

  return (
    <article className="rounded-2xl bg-card dark:bg-dark-card p-5 shadow-soft border border-slate-100 dark:border-slate-700/80 hover:shadow-glass transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${data.color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color: data.color }} aria-hidden />
        </div>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${changeColor}`}>
          {data.change > 0 ? '+' : ''}
          {data.change}%
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t(kpiTitleKey(data.id))}</p>
      <p className="text-2xl md:text-3xl font-bold text-ink dark:text-white tracking-tight">
        {displayValue}
        {unitLabel && <span className="text-base font-medium text-slate-400 ml-1">{unitLabel}</span>}
      </p>
      <div className="mt-3 h-10">
        <Sparkline data={data.sparkline} color={data.color} />
      </div>
    </article>
  )
}
