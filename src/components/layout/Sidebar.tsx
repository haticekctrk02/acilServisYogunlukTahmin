import {
  Activity,
  BarChart3,
  Brain,
  ChevronLeft,
  FileText,
  History,
  LayoutDashboard,
  Radio,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { TxKey } from '../../i18n/translations'

const navItems: { to: string; icon: typeof LayoutDashboard; labelKey: TxKey }[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/predictions', icon: Sparkles, labelKey: 'nav.predictions' },
  { to: '/live', icon: Radio, labelKey: 'nav.live' },
  { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { to: '/historical', icon: History, labelKey: 'nav.historical' },
  { to: '/reports', icon: FileText, labelKey: 'nav.reports' },
  { to: '/ml-insights', icon: Brain, labelKey: 'nav.mlInsights' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { t } = useLanguage()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-ink/40 z-40 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`p-4 border-b border-slate-100 dark:border-slate-700 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm text-ink dark:text-white leading-tight truncate">{t('app.name')}</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{t('app.tagline')}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={t('nav.closeMenu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label={t('nav.mainNav')}>
          {navItems.map(({ to, icon: Icon, labelKey }) => {
            const label = t(labelKey)
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex m-3 p-2 rounded-xl border border-slate-200 dark:border-slate-600 items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  )
}
