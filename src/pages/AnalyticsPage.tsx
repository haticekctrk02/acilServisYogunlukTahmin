import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDataset } from '../context/DatasetContext'
import { useLanguage } from '../context/LanguageContext'
import { dayKey, seasonKey, urgencyKey } from '../i18n/helpers'
import { chartColors, tooltipStyle } from '../components/charts/ChartTheme'
import { Card } from '../components/ui/Card'

const heatColors = ['#E0F2FE', '#7DD3FC', '#38BDF8', '#0284C7', '#1E40AF']

export function AnalyticsPage() {
  const { aggregates } = useDataset()
  const { t } = useLanguage()
  if (!aggregates) return null

  const {
    hourlyTrend,
    weeklyHeatmap,
    monthlyAdmissions,
    seasonalUsage,
    arrivalDistribution,
    predictionAccuracy,
    outcomeDistribution,
    satisfactionByUrgency,
    triageBreakdown,
  } = aggregates

  const seasonalChart = seasonalUsage.map((s) => ({
    ...s,
    label: t(seasonKey(s.season)),
  }))

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('analytics.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('analytics.subtitle')}</p>
      </header>

      <Card title={t('analytics.hourlyTrend')} subtitle={t('analytics.hourlySubtitle')}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrend}>
              <defs>
                <linearGradient id="patients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="patients" stroke={chartColors.primary} fill="url(#patients)" name={t('analytics.visits')} />
              <Line type="monotone" dataKey="predicted" stroke={chartColors.secondary} strokeDasharray="5 5" name={t('analytics.baseline')} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={t('analytics.heatmap')} subtitle={t('analytics.heatmapSubtitle')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">{t('analytics.day')}</th>
                  <th className="p-2">{t('analytics.night')}</th>
                  <th className="p-2">{t('analytics.morning')}</th>
                  <th className="p-2">{t('analytics.afternoon')}</th>
                  <th className="p-2">{t('analytics.evening')}</th>
                </tr>
              </thead>
              <tbody>
                {weeklyHeatmap.map((row) => (
                  <tr key={row.dayKey}>
                    <td className="p-2 font-medium">{t(dayKey(row.dayKey))}</td>
                    {[row.h0, row.h6, row.h12, row.h18].map((v, i) => (
                      <td key={i} className="p-2">
                        <div
                          className="h-8 rounded-lg"
                          style={{ backgroundColor: heatColors[Math.min(v - 1, 4)] ?? heatColors[0] }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('analytics.monthly')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="admissions" fill={chartColors.primary} radius={[8, 8, 0, 0]} name={t('analytics.visits')} />
                <Bar dataKey="capacity" fill={chartColors.grid} radius={[8, 8, 0, 0]} name={t('analytics.baseline')} opacity={0.4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('analytics.seasonal')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={seasonalChart} dataKey="usage" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {seasonalUsage.map((_, i) => (
                    <Cell key={i} fill={[chartColors.primary, chartColors.secondary, chartColors.warning, chartColors.critical][i % 4]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('analytics.waitDist')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrivalDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={60} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={chartColors.secondary} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('analytics.accuracy')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionAccuracy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[80, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accuracy" stroke={chartColors.success} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('analytics.outcomes')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={outcomeDistribution.map((o) => ({
                  ...o,
                  label: t(`outcomes.${o.outcome}` as Parameters<typeof t>[0]) || o.outcome,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={chartColors.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('analytics.satisfaction')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={satisfactionByUrgency.map((s) => ({
                  ...s,
                  label: t(urgencyKey(s.urgency)),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 5]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg" fill={chartColors.success} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('analytics.triageFlow')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={triageBreakdown.map((item) => ({
                  stage:
                    item.stage === 'registration'
                      ? t('analytics.registration')
                      : item.stage === 'triage'
                        ? t('analytics.triageStage')
                        : t('analytics.medical'),
                  minutes: item.minutes,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="minutes" fill={chartColors.warning} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={t('analytics.capacity')}>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { labelKey: 'analytics.triage' as const, value: Math.min(95, aggregates.riskScore), color: chartColors.primary },
            { labelKey: 'analytics.treatment' as const, value: Math.min(98, aggregates.riskScore + 8), color: chartColors.warning },
            { labelKey: 'analytics.observation' as const, value: Math.max(40, aggregates.riskScore - 15), color: chartColors.secondary },
            { labelKey: 'analytics.criticalTrack' as const, value: Math.min(90, Math.round(aggregates.riskScore * 0.7)), color: chartColors.critical },
          ].map((item) => (
            <div key={item.labelKey} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-500">{t(item.labelKey)}</p>
              <p className="text-2xl font-bold mt-1">{item.value}%</p>
              <div className="h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
