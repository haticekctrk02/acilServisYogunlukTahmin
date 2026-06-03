import { Bell, Globe, Shield, Palette } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../context/LanguageContext'
import { useAppSettings } from '../hooks/useAppSettings'
import { useTheme } from '../hooks/useTheme'
import type { Locale } from '../i18n/translations'

export function SettingsPage() {
  const { dark, setDark } = useTheme()
  const { locale, setLocale, t } = useLanguage()
  const { settings, update } = useAppSettings()

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('settings.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
      </header>

      <Card title={t('settings.appearance')}>
        <div className="flex items-center gap-4">
          <Palette className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">{t('settings.darkMode')}</p>
            <p className="text-sm text-slate-500">{t('settings.darkModeDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={() => setDark(!dark)}
            className={`w-12 h-7 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-slate-300'}`}
          >
            <span
              className={`block w-5 h-5 mt-1 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </Card>

      <Card title={t('settings.notifications')}>
        <label className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Bell className="w-5 h-5 text-warning" />
          <span className="flex-1 text-sm">{t('settings.criticalAlerts')}</span>
          <input
            type="checkbox"
            checked={settings.criticalAlerts}
            onChange={(e) => update({ criticalAlerts: e.target.checked })}
            className="w-5 h-5 rounded accent-primary"
          />
        </label>
        <label className="flex items-center gap-4 py-3">
          <Bell className="w-5 h-5 text-secondary" />
          <span className="flex-1 text-sm">{t('settings.hourlySummary')}</span>
          <input
            type="checkbox"
            checked={settings.hourlySummary}
            onChange={(e) => update({ hourlySummary: e.target.checked })}
            className="w-5 h-5 rounded accent-primary"
          />
        </label>
      </Card>

      <Card title={t('settings.regional')}>
        <div className="flex items-center gap-4">
          <Globe className="w-5 h-5 text-primary" />
          <label className="flex-1">
            <span className="sr-only">{t('settings.language')}</span>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="tr">{t('settings.turkish')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
          </label>
        </div>
      </Card>

      <Card title={t('settings.security')}>
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <Shield className="w-5 h-5 text-success" />
          <p>{t('settings.securityDesc')}</p>
        </div>
      </Card>
    </div>
  )
}
