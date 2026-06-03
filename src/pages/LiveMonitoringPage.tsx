import { Ambulance, BedDouble, Clock, Heart, Stethoscope, UserCheck, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useLiveData } from '../hooks/useLiveData'
import { Card } from '../components/ui/Card'
import { TxKey } from '../i18n/translations'

const widgets: { key: keyof ReturnType<typeof useLiveData>; labelKey: TxKey; icon: typeof Users; color: string }[] = [
  { key: 'currentPatients', labelKey: 'live.currentPatients', icon: Users, color: '#2563EB' },
  { key: 'occupiedBeds', labelKey: 'live.occupiedBeds', icon: BedDouble, color: '#0EA5E9' },
  { key: 'availableBeds', labelKey: 'live.availableBeds', icon: BedDouble, color: '#22C55E' },
  { key: 'activeDoctors', labelKey: 'live.activeDoctors', icon: Stethoscope, color: '#8B5CF6' },
  { key: 'activeNurses', labelKey: 'live.activeNurses', icon: UserCheck, color: '#EC4899' },
  { key: 'ambulanceArrivals', labelKey: 'live.ambulanceArrivals', icon: Ambulance, color: '#EF4444' },
  { key: 'waitingPatients', labelKey: 'live.waitingPatients', icon: Clock, color: '#F59E0B' },
]

function SatisfactionWidget({ value }: { value: number }) {
  const { t } = useLanguage()
  return (
    <article className="rounded-2xl bg-card dark:bg-dark-card p-5 shadow-soft border border-slate-100 dark:border-slate-700">
      <Heart className="w-5 h-5 text-pink-500 mb-3" />
      <p className="text-sm text-slate-500">{t('live.avgSatisfaction')}</p>
      <p className="text-3xl font-bold mt-1">{value}/5</p>
    </article>
  )
}

export function LiveMonitoringPage() {
  const live = useLiveData()
  const { t } = useLanguage()

  const totalBeds = live.occupiedBeds + live.availableBeds
  const ambulanceText =
    live.ambulanceArrivals > 0 ? t('live.ambulance', { count: live.ambulanceArrivals }) : ''

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('live.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('live.subtitle')}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/15 text-success text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
          {t('common.liveBadge')}
        </span>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map(({ key, labelKey, icon: Icon, color }) => (
          <article
            key={key}
            className="rounded-2xl bg-card dark:bg-dark-card p-5 shadow-soft border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
            <p className="text-sm text-slate-500">{t(labelKey)}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{live[key]}</p>
          </article>
        ))}
        <SatisfactionWidget value={live.avgSatisfaction} />
      </div>

      <Card title={t('live.capacityTitle')} subtitle={t('live.capacitySubtitle')}>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-2">{t('live.bedUtil')}</p>
            <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(live.occupiedBeds / totalBeds) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-2 font-medium">
              {t('live.beds', { occupied: live.occupiedBeds, total: totalBeds })}
            </p>
          </div>
          <div className="md:col-span-2 text-sm text-slate-600 dark:text-slate-400">
            <p>
              {t('live.tracking', {
                patients: live.currentPatients,
                waiting: live.waitingPatients,
                ambulance: ambulanceText,
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
