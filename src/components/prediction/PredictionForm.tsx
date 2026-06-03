import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDataset } from '../../context/DatasetContext'
import { useLanguage } from '../../context/LanguageContext'
import { dayKey, regionKey, seasonKey, timeKey, urgencyKey } from '../../i18n/helpers'
import {
  deriveWeather,
  getPreviousHourCount,
  isWeekend,
  seasonTemperature,
} from '../../services/mlModel'
import type { DatasetPredictionInput } from '../../types/dataset'
import type { PredictionResult } from '../../types'
import { Card } from '../ui/Card'

interface PredictionFormProps {
  onPredict: (result: PredictionResult) => void
}

function defaultForm(hospital: string): DatasetPredictionInput {
  const now = new Date()
  return {
    hospitalName: hospital,
    dayOfWeek: 'Wednesday',
    season: 'Winter',
    timeOfDay: 'Afternoon',
    urgencyLevel: 'Medium',
    region: 'Urban',
    nurseToPatientRatio: 4,
    specialistAvailability: 5,
    hour: now.getHours(),
    temperature: 15,
    weatherCondition: 'Clear',
    holidayStatus: false,
    specialEvent: false,
    previousHourCount: 0,
  }
}

export function PredictionForm({ onPredict }: PredictionFormProps) {
  const { aggregates, predict, selectedHospital, loading, visits } = useDataset()
  const { t } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<DatasetPredictionInput>(defaultForm(''))
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!aggregates || initialized) return
    const hospital = selectedHospital || aggregates.hospitals[0] || ''
    setForm({
      ...defaultForm(hospital),
      dayOfWeek: aggregates.daysOfWeek.includes('Wednesday') ? 'Wednesday' : aggregates.daysOfWeek[0],
      season: aggregates.seasons[0] ?? 'Winter',
      timeOfDay: aggregates.timesOfDay.includes('Afternoon') ? 'Afternoon' : aggregates.timesOfDay[0],
      urgencyLevel: aggregates.urgencyLevels.includes('Medium') ? 'Medium' : aggregates.urgencyLevels[0],
      region: aggregates.regions[0] ?? 'Urban',
      temperature: seasonTemperature(aggregates.seasons[0] ?? 'Winter'),
      weatherCondition: deriveWeather(aggregates.seasons[0] ?? 'Winter', new Date().getHours()),
      holidayStatus: false,
    })
    setInitialized(true)
  }, [aggregates, selectedHospital, initialized])

  useEffect(() => {
    if (selectedHospital) setForm((f) => ({ ...f, hospitalName: selectedHospital }))
  }, [selectedHospital])

  useEffect(() => {
    if (!visits.length || !form.hospitalName) return
    const prev = getPreviousHourCount(visits, form.hospitalName, new Date(), form.hour)
    setForm((f) => ({
      ...f,
      previousHourCount: prev,
      temperature: seasonTemperature(f.season) + (f.hour - 12) * 0.5,
      weatherCondition: deriveWeather(f.season, f.hour),
      holidayStatus: isWeekend(f.dayOfWeek),
    }))
  }, [form.hour, form.season, form.dayOfWeek, form.hospitalName, visits])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      const result = predict({ ...form, hospitalName: form.hospitalName || selectedHospital })
      if (result) onPredict(result)
      setSubmitting(false)
    }, 500)
  }

  const field = (label: string, children: React.ReactNode) => (
    <label className="block">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">{label}</span>
      {children}
    </label>
  )

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none'

  if (!aggregates) return null

  return (
    <Card
      title={t('predictionForm.title')}
      subtitle={t('predictionForm.subtitle', { hospitals: aggregates.hospitals.length })}
    >
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {field(
          t('predictionForm.hospital'),
          <select
            className={inputClass}
            value={form.hospitalName || selectedHospital}
            onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
            disabled={loading}
          >
            {aggregates.hospitals.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.dayOfWeek'),
          <select className={inputClass} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
            {aggregates.daysOfWeek.map((d) => (
              <option key={d} value={d}>{t(dayKey(d))}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.hour'),
          <input
            type="number"
            min={0}
            max={23}
            className={inputClass}
            value={form.hour}
            onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}
          />
        )}
        {field(
          t('predictionForm.season'),
          <select className={inputClass} value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
            {aggregates.seasons.map((s) => (
              <option key={s} value={s}>{t(seasonKey(s))}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.temperature'),
          <input
            type="number"
            className={inputClass}
            value={Math.round(form.temperature)}
            onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
          />
        )}
        {field(
          t('predictionForm.weather'),
          <select
            className={inputClass}
            value={form.weatherCondition}
            onChange={(e) => setForm({ ...form, weatherCondition: e.target.value })}
          >
            {aggregates.weatherOptions.map((w) => (
              <option key={w} value={w}>{t(`weather.${w}` as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.timeOfDay'),
          <select className={inputClass} value={form.timeOfDay} onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}>
            {aggregates.timesOfDay.map((td) => (
              <option key={td} value={td}>{t(timeKey(td))}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.holiday'),
          <select
            className={inputClass}
            value={String(form.holidayStatus)}
            onChange={(e) => setForm({ ...form, holidayStatus: e.target.value === 'true' })}
          >
            <option value="false">{t('predictionForm.no')}</option>
            <option value="true">{t('predictionForm.yes')}</option>
          </select>
        )}
        {field(
          t('predictionForm.specialEvent'),
          <select
            className={inputClass}
            value={String(form.specialEvent)}
            onChange={(e) => setForm({ ...form, specialEvent: e.target.value === 'true' })}
          >
            <option value="false">{t('predictionForm.no')}</option>
            <option value="true">{t('predictionForm.yes')}</option>
          </select>
        )}
        {field(
          t('predictionForm.previousHour'),
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.previousHourCount}
            onChange={(e) => setForm({ ...form, previousHourCount: Number(e.target.value) })}
          />
        )}
        {field(
          t('predictionForm.urgency'),
          <select className={inputClass} value={form.urgencyLevel} onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })}>
            {aggregates.urgencyLevels.map((u) => (
              <option key={u} value={u}>{t(urgencyKey(u))}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.region'),
          <select className={inputClass} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
            {aggregates.regions.map((r) => (
              <option key={r} value={r}>{t(regionKey(r))}</option>
            ))}
          </select>
        )}
        {field(
          t('predictionForm.nurseRatio'),
          <input
            type="number"
            min={1}
            max={10}
            className={inputClass}
            value={form.nurseToPatientRatio}
            onChange={(e) => setForm({ ...form, nurseToPatientRatio: Number(e.target.value) })}
          />
        )}
        {field(
          t('predictionForm.specialistAvail'),
          <input
            type="number"
            min={0}
            max={20}
            className={inputClass}
            value={form.specialistAvailability}
            onChange={(e) => setForm({ ...form, specialistAvailability: Number(e.target.value) })}
          />
        )}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? t('predictionForm.analyzing') : t('predictionForm.submit')}
          </button>
        </div>
      </form>
    </Card>
  )
}
