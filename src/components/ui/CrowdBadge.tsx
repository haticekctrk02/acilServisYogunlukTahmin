import { useLanguage } from '../../context/LanguageContext'
import type { CrowdLevel } from '../../types'

const styles: Record<CrowdLevel, string> = {
  LOW: 'bg-success/15 text-success border-success/30',
  MEDIUM: 'bg-warning/15 text-warning border-warning/30',
  HIGH: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  CRITICAL: 'bg-critical/15 text-critical border-critical/30',
}

export function CrowdBadge({ level }: { level: CrowdLevel }) {
  const { t } = useLanguage()
  return (
    <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-bold border ${styles[level]}`}>
      {t(`crowd.${level}`)}
    </span>
  )
}
