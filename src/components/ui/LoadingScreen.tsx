import { Activity } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export function LoadingScreen({ message }: { message?: string }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface dark:bg-dark-bg gap-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Activity className="w-7 h-7 text-primary animate-pulse" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message ?? t('common.loadingDataset')}</p>
      <p className="text-xs text-slate-400">{t('common.loadingRecords')}</p>
    </div>
  )
}
