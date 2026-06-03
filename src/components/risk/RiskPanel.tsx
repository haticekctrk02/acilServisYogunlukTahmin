import { ShieldAlert } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { riskKeys } from '../../i18n/helpers'
import { Card } from '../ui/Card'
import { RiskGauge } from '../ui/RiskGauge'

export function RiskPanel({ score = 72 }: { score?: number }) {
  const { t } = useLanguage()
  const classifications = riskKeys().map((c) => ({
    ...c,
    label: t(`risk.${c.key}`),
    recommendation: t(`risk.${c.key}Rec`),
  }))

  const active =
    [...classifications].reverse().find((c) => score >= c.min) ?? classifications[0]

  return (
    <Card title={t('risk.title')} subtitle={t('risk.subtitle')}>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <RiskGauge score={score} />
          <p className="mt-4 text-lg font-bold" style={{ color: active.color }}>
            {active.label}
          </p>
          <p className="text-sm text-slate-500 mt-2">{active.recommendation}</p>
        </div>
        <ul className="space-y-3" role="list">
          {classifications.map((c) => (
            <li
              key={c.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                active.key === c.key
                  ? 'border-2 bg-opacity-10'
                  : 'border-slate-200 dark:border-slate-700 opacity-70'
              }`}
              style={{
                borderColor: active.key === c.key ? c.color : undefined,
                backgroundColor: active.key === c.key ? `${c.color}12` : undefined,
              }}
            >
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: c.color }} />
              <div>
                <p className="font-semibold text-sm">{c.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.recommendation}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
