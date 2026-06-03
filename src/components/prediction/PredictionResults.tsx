import { Brain, Clock, Users } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { dayKey, seasonKey, staffingKey, timeKey, urgencyKey } from '../../i18n/helpers'
import type { PredictionResult } from '../../types'
import { Card } from '../ui/Card'
import { CrowdBadge } from '../ui/CrowdBadge'
import { RiskGauge } from '../ui/RiskGauge'

const levelRisk: Record<string, number> = {
  LOW: 25,
  MEDIUM: 52,
  HIGH: 78,
  CRITICAL: 94,
}

export function PredictionResults({ result }: { result: PredictionResult | null }) {
  const { t } = useLanguage()
  if (!result) return null

  const riskScore = levelRisk[result.crowdLevel]
  const { meta } = result

  const explanation = t('predictionResults.explanation', {
    count: meta.sampleCount,
    hospital: meta.hospital,
    day: t(dayKey(meta.dayOfWeek)),
    hour: meta.hour,
    season: t(seasonKey(meta.season)),
    time: t(timeKey(meta.timeOfDay)),
    weather: t(`weather.${meta.weatherCondition}` as Parameters<typeof t>[0]),
    temp: Math.round(meta.temperature),
    wait: meta.avgWait,
    urgency: t(urgencyKey(meta.urgency)),
    prev: meta.previousHourCount,
  })

  const staffing = t(staffingKey(result.crowdLevel), {
    ratio: meta.avgNurse.toFixed(1),
  })

  return (
    <Card title={t('predictionResults.title')} className="border-2 border-primary/20">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">{t('predictionResults.patientCount')}</p>
            <p className="text-5xl font-bold text-primary">{result.patientCount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-2">{t('predictionResults.crowdLevel')}</p>
            <CrowdBadge level={result.crowdLevel} />
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Brain className="w-8 h-8 text-secondary shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('predictionResults.aiExplanation')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{explanation}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <RiskGauge score={riskScore} />
          <p className="text-sm text-slate-500">
            {t('common.confidence')}: <span className="font-bold text-ink dark:text-white">{result.confidence}%</span>
          </p>
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 text-center">
              <Clock className="w-5 h-5 mx-auto text-warning mb-2" />
              <p className="text-xs text-slate-500">{t('predictionResults.expectedWait')}</p>
              <p className="text-lg font-bold">
                {result.expectedWaitingTime} {t('common.min')}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 text-center">
              <Users className="w-5 h-5 mx-auto text-primary mb-2" />
              <p className="text-xs text-slate-500">{t('predictionResults.staffing')}</p>
              <p className="text-xs font-semibold mt-1">{staffing}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
