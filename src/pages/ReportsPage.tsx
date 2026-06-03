import { Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import { useLanguage } from '../context/LanguageContext'
import {
  exportHistoricalExcel,
  exportHistoricalPdf,
  exportWeeklyReport,
} from '../services/exportService'
import { Card } from '../components/ui/Card'

const reports = [
  { id: 'weekly', titleKey: 'reports.weekly' as const, descKey: 'reports.weeklyDesc' as const, icon: Calendar },
  { id: 'monthly', titleKey: 'reports.monthly' as const, descKey: 'reports.monthlyDesc' as const, icon: Calendar },
  { id: 'performance', titleKey: 'reports.performance' as const, descKey: 'reports.performanceDesc' as const, icon: FileText },
  { id: 'capacity', titleKey: 'reports.capacity' as const, descKey: 'reports.capacityDesc' as const, icon: FileText },
]

export function ReportsPage() {
  const { historicalRecords, aggregates, selectedHospital } = useDataset()
  const { t } = useLanguage()

  const headers = [
    t('historical.colDate'),
    t('historical.colTime'),
    t('historical.colPredicted'),
    t('historical.colActual'),
    t('historical.colAccuracy'),
    t('historical.colRisk'),
    t('historical.colWait'),
  ]

  const handlePdf = () => {
    exportHistoricalPdf(historicalRecords, t('historical.title'), headers)
  }

  const handleExcel = () => {
    exportHistoricalExcel(historicalRecords, 'ER History')
  }

  const handleReport = (id: string) => {
    if (!aggregates) return
    if (id === 'weekly' || id === 'monthly') {
      exportWeeklyReport(aggregates, selectedHospital, {
        title: t(reports.find((r) => r.id === id)!.titleKey),
        kpi: t('header.hospital'),
        admissions: t('analytics.visits'),
      })
    } else {
      handlePdf()
    }
  }

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('reports.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('reports.subtitle')}</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title={t('reports.quickExport')}>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePdf}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-critical/10 text-critical font-semibold text-sm hover:bg-critical/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('reports.exportPdf')}
            </button>
            <button
              type="button"
              onClick={handleExcel}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-success/10 text-success font-semibold text-sm hover:bg-success/20 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('reports.exportExcel')}
            </button>
          </div>
        </Card>

        <Card title={t('reports.scheduled')}>
          <p className="text-sm text-slate-500">{t('reports.scheduledDesc')}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reports.map(({ id, titleKey, descKey, icon: Icon }) => (
          <article
            key={id}
            className="rounded-2xl bg-card dark:bg-dark-card p-6 shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col"
          >
            <Icon className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg">{t(titleKey)}</h3>
            <p className="text-sm text-slate-500 mt-2 flex-1">{t(descKey)}</p>
            <button
              type="button"
              onClick={() => handleReport(id)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Download className="w-4 h-4" />
              {t('common.generate')}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
