import { Mail, Shield, User } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDataset } from '../context/DatasetContext'
import { Card } from '../components/ui/Card'

export function ProfilePage() {
  const { t } = useLanguage()
  const { selectedHospital, visits } = useDataset()

  return (
    <div className="space-y-6 max-w-[600px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('profile.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('profile.subtitle')}</p>
      </header>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="font-semibold text-lg">{t('header.drAdmin')}</p>
            <p className="text-sm text-slate-500">{t('header.erAdmin')}</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary" />
            <dt className="text-slate-500 w-28">{t('profile.email')}</dt>
            <dd>admin@hospital.local</dd>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-success" />
            <dt className="text-slate-500 w-28">{t('profile.hospital')}</dt>
            <dd className="truncate">{selectedHospital}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-secondary" />
            <dt className="text-slate-500 w-28">{t('profile.access')}</dt>
            <dd>{t('profile.fullAccess')}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-400">
          {t('profile.datasetAccess', { count: visits.length.toLocaleString() })}
        </p>
      </Card>
    </div>
  )
}
