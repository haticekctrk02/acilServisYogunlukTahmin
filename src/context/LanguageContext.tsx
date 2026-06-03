import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { Locale, translations, TxKey } from '../i18n/translations'

type Params = Record<string, string | number>

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TxKey, params?: Params) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'tr'
    const saved = localStorage.getItem('locale') as Locale | null
    return saved === 'en' || saved === 'tr' ? saved : 'tr'
  })

  const t = useCallback(
    (key: TxKey, params?: Params): string => {
      let text = getNested(translations[locale] as Record<string, unknown>, key)
        ?? getNested(translations.en as Record<string, unknown>, key)
        ?? key

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
        })
      }
      return text
    },
    [locale]
  )

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
    document.title = t('app.pageTitle')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('app.fullTagline'))
  }, [locale, t])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
