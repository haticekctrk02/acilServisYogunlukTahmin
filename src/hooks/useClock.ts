import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export function useClock() {
  const { locale } = useLanguage()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'

  return {
    time: now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  }
}
