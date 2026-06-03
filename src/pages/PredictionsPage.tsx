import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { PredictionForm } from '../components/prediction/PredictionForm'
import { PredictionResults } from '../components/prediction/PredictionResults'
import { EmptyState } from '../components/ui/EmptyState'
import type { PredictionResult } from '../types'

export function PredictionsPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const { t } = useLanguage()

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('predictions.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('predictions.subtitle')}</p>
      </header>

      <PredictionForm onPredict={setPrediction} />

      {prediction ? (
        <PredictionResults result={prediction} />
      ) : (
        <div className="rounded-2xl bg-card dark:bg-dark-card shadow-soft border border-slate-100 dark:border-slate-700">
          <EmptyState
            icon={Sparkles}
            title={t('predictions.emptyTitle')}
            description={t('predictions.emptyDesc')}
          />
        </div>
      )}
    </div>
  )
}
