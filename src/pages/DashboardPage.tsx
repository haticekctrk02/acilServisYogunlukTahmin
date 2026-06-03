import { Database, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext'
import { useLanguage } from '../context/LanguageContext'
import { PredictionForm } from '../components/prediction/PredictionForm'
import { PredictionResults } from '../components/prediction/PredictionResults'
import { RiskPanel } from '../components/risk/RiskPanel'
import { KpiCard } from '../components/ui/KpiCard'
import type { PredictionResult } from '../types'

export function DashboardPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const { aggregates, visits } = useDataset()
  const { t } = useLanguage()

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
          {t('app.fullTagline')}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            <Database className="w-3 h-3" />
            {t('common.datasetRecords', { count: visits.length.toLocaleString() })}
          </span>
        </p>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {aggregates?.kpiCards.map((kpi) => (
          <KpiCard key={kpi.id} data={kpi} />
        ))}
      </div>

      <PredictionForm onPredict={setPrediction} />
      {prediction ? (
        <PredictionResults result={prediction} />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <p className="font-medium text-slate-600 dark:text-slate-300">{t('predictions.emptyTitle')}</p>
          <p className="text-sm text-slate-500 mt-1">{t('predictions.emptyDescDashboard')}</p>
        </div>
      )}

      <RiskPanel score={aggregates?.riskScore ?? 50} />

      <div className="flex justify-end">
        <Link to="/live" className="text-sm font-medium text-primary hover:underline">
          {t('common.viewLive')}
        </Link>
      </div>
    </div>
  )
}
