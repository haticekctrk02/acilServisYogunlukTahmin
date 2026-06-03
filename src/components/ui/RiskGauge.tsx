import { useLanguage } from '../../context/LanguageContext'

interface RiskGaugeProps {
  score: number
  max?: number
}

export function RiskGauge({ score, max = 100 }: RiskGaugeProps) {
  const { t } = useLanguage()
  const pct = Math.min(100, (score / max) * 100)
  const rotation = (pct / 100) * 180 - 90

  const color =
    pct < 40 ? '#22C55E' : pct < 65 ? '#F59E0B' : pct < 85 ? '#F97316' : '#EF4444'

  return (
    <div
      className="relative w-48 h-28 mx-auto"
      role="img"
      aria-label={t('riskGauge.label', { score })}
    >
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-slate-200 dark:text-slate-700"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${(pct / 100) * 251} 251`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute bottom-2 left-1/2 w-3 h-14 origin-bottom -translate-x-1/2 rounded-full bg-ink dark:bg-white transition-transform duration-700"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl font-bold" style={{ color }}>
        {score}%
      </p>
    </div>
  )
}
