import {
  Bell,
  Building2,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../../context/DatasetContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAppSettings } from '../../hooks/useAppSettings'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useClock } from '../../hooks/useClock'
import { urgencyKey } from '../../i18n/helpers'

interface HeaderProps {
  onMenuClick: () => void
  dark: boolean
  onToggleTheme: () => void
}

export function Header({ onMenuClick, dark, onToggleTheme }: HeaderProps) {
  const { time, date } = useClock()
  const { aggregates, selectedHospital, setSelectedHospital, search, notifications } = useDataset()
  const { settings } = useAppSettings()
  const { t } = useLanguage()
  const visibleNotifications = notifications.filter(
    (n) =>
      (n.type === 'warning' || n.type === 'critical' ? settings.criticalAlerts : true) &&
      (n.type === 'info' ? settings.hourlySummary : true)
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [hospitalOpen, setHospitalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [signedOut, setSignedOut] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const hospitalRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickOutside(searchRef, () => setSearchOpen(false))
  useClickOutside(hospitalRef, () => setHospitalOpen(false))
  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  const hospitals = aggregates?.hospitals ?? []
  const results = searchQuery.length >= 2 ? search(searchQuery) : []

  useEffect(() => {
    if (!searchQuery) setSearchOpen(false)
  }, [searchQuery])

  if (signedOut) {
    return (
      <header className="sticky top-0 z-30 glass-card border-b px-6 py-4 flex items-center justify-center gap-4">
        <span className="text-sm text-slate-500">{t('header.signOut')}</span>
        <button
          type="button"
          onClick={() => setSignedOut(false)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('header.signInAgain')}
        </button>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-slate-200/60 dark:border-slate-700/60 px-4 md:px-6 py-3">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={t('header.openMenu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div ref={searchRef} className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
          <input
            type="search"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={t('header.search')}
          />
          {searchOpen && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-dark-card shadow-glass border border-slate-200 dark:border-slate-600 z-50">
              {results.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">{t('header.noResults')}</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.visitId}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    onClick={() => {
                      setSelectedHospital(r.hospitalName)
                      setSearchQuery('')
                      setSearchOpen(false)
                    }}
                  >
                    <span className="font-medium">{r.visitId}</span>
                    <span className="text-slate-500 block text-xs">
                      {r.hospitalName} · {t(urgencyKey(r.urgencyLevel))} · {r.totalWaitTime}
                      {t('common.min')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="hidden md:block text-right text-xs text-slate-500 dark:text-slate-400">
          <p className="font-mono font-semibold text-ink dark:text-white text-sm">{time}</p>
          <p>{date}</p>
        </div>

        <div ref={hospitalRef} className="relative">
          <button
            type="button"
            onClick={() => setHospitalOpen(!hospitalOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
          >
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline max-w-[180px] truncate">{selectedHospital || t('header.hospital')}</span>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </button>
          {hospitalOpen && hospitals.length > 0 && (
            <ul className="absolute right-0 mt-1 w-72 py-1 rounded-xl bg-white dark:bg-dark-card shadow-glass border border-slate-200 dark:border-slate-600 z-50 max-h-64 overflow-y-auto">
              {hospitals.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => {
                      setSelectedHospital(h)
                      setHospitalOpen(false)
                    }}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={t('header.notifications')}
          >
            <Bell className="w-5 h-5" />
            {visibleNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full animate-pulse-soft" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-dark-card shadow-glass border border-slate-200 dark:border-slate-600 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-sm">{t('header.notifications')}</span>
                <button type="button" onClick={() => setNotifOpen(false)} aria-label={t('nav.closeMenu')}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {visibleNotifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">{t('header.noResults')}</p>
              ) : (
                visibleNotifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 text-sm">
                    <p className="font-medium">{t(n.titleKey as Parameters<typeof t>[0], n.params)}</p>
                    <p className="text-xs text-slate-500 mt-1">{t(n.messageKey as Parameters<typeof t>[0], n.params)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={dark ? t('header.lightMode') : t('header.darkMode')}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-medium">{t('header.drAdmin')}</span>
            <ChevronDown className="w-4 h-4 hidden sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-1 w-48 py-2 rounded-xl bg-white dark:bg-dark-card shadow-glass border border-slate-200 dark:border-slate-600 z-50">
              <p className="px-4 py-2 text-xs text-slate-500">{t('header.erAdmin')}</p>
              <Link
                to="/profile"
                className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => setProfileOpen(false)}
              >
                {t('header.profile')}
              </Link>
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => {
                  setSignedOut(true)
                  setProfileOpen(false)
                }}
              >
                {t('header.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
