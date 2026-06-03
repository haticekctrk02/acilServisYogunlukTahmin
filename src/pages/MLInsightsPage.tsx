import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDataset } from '../context/DatasetContext'
import { useLanguage } from '../context/LanguageContext'
import { featureKey, mlMetricKey } from '../i18n/helpers'
import { chartColors, tooltipStyle } from '../components/charts/ChartTheme'
import { Card } from '../components/ui/Card'

export function MLInsightsPage() {
  const { aggregates, visits } = useDataset()
  const { t } = useLanguage()
  if (!aggregates) return null

  const chartData = aggregates.featureImportance.map((f) => ({
    ...f,
    label: t(featureKey(f.feature)),
  }))

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('ml.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('ml.subtitle', { count: visits.length.toLocaleString() })}
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {aggregates.mlMetrics.map((m) => (
          <div
            key={m.key}
            className="rounded-2xl bg-card dark:bg-dark-card p-5 border border-slate-100 dark:border-slate-700 shadow-soft text-center"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide">{t(mlMetricKey(m.key))}</p>
            <p className="text-2xl font-bold mt-2" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <Card title={t('ml.featureTitle')} subtitle={t('ml.featureSubtitle')}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="importance" fill={chartColors.primary} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
          <li>{t('ml.hint1', { values: aggregates.timesOfDay.map((x) => t(`times.${x}` as Parameters<typeof t>[0])).join(', ') })}</li>
          <li>{t('ml.hint2')}</li>
          <li>{t('ml.hint3', { values: aggregates.urgencyLevels.map((x) => t(`urgency.${x}` as Parameters<typeof t>[0])).join(', ') })}</li>
          <li>{t('ml.hint4', { values: aggregates.seasons.map((x) => t(`seasons.${x}` as Parameters<typeof t>[0])).join(', ') })}</li>
          <li>{t('ml.hint5')}</li>
          <li>{t('ml.hint6', { values: aggregates.regions.map((x) => t(`regions.${x}` as Parameters<typeof t>[0])).join(', ') })}</li>
        </ul>
      </Card>
    </div>
  )
}
