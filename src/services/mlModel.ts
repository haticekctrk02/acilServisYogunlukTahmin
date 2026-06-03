import type { DatasetPredictionInput, ERVisit } from '../types/dataset'

const DAY_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
}
const SEASON_INDEX: Record<string, number> = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 }
const TIME_INDEX: Record<string, number> = {
  Night: 0, 'Late Morning': 1, Afternoon: 2, Evening: 3,
}
const URGENCY_INDEX: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
const WEATHER_INDEX: Record<string, number> = {
  Clear: 0, Cloudy: 1, Rain: 2, Snow: 3, Storm: 4, Fog: 5,
}

export interface TrainedModel {
  weights: number[]
  bias: number
  featureMeans: number[]
  featureStds: number[]
  slotCountByHour: Map<string, number>
  trainedAt: number
}

function encodeInput(input: DatasetPredictionInput): number[] {
  return [
    DAY_INDEX[input.dayOfWeek] ?? 3,
    SEASON_INDEX[input.season] ?? 1,
    TIME_INDEX[input.timeOfDay] ?? 2,
    URGENCY_INDEX[input.urgencyLevel] ?? 1,
    input.region === 'Urban' ? 1 : 0,
    input.nurseToPatientRatio,
    input.specialistAvailability,
    input.hour / 23,
    input.temperature / 40,
    WEATHER_INDEX[input.weatherCondition] ?? 0,
    input.holidayStatus ? 1 : 0,
    input.specialEvent ? 1 : 0,
    Math.min(input.previousHourCount, 200) / 200,
  ]
}

function encodeVisit(v: ERVisit, prevHourCount: number): number[] {
  const temp = seasonTemperature(v.season) + (v.visitDate.getHours() - 12) * 0.3
  return [
    DAY_INDEX[v.dayOfWeek] ?? 3,
    SEASON_INDEX[v.season] ?? 1,
    TIME_INDEX[v.timeOfDay] ?? 2,
    URGENCY_INDEX[v.urgencyLevel] ?? 1,
    v.region === 'Urban' ? 1 : 0,
    v.nurseToPatientRatio,
    v.specialistAvailability,
    v.visitDate.getHours() / 23,
    temp / 40,
    WEATHER_INDEX[deriveWeather(v.season, v.visitDate.getHours())] ?? 0,
    isWeekend(v.dayOfWeek) ? 1 : 0,
    v.urgencyLevel === 'Critical' ? 1 : 0,
    Math.min(prevHourCount, 200) / 200,
  ]
}

export function seasonTemperature(season: string): number {
  const map: Record<string, number> = { Winter: 4, Spring: 14, Summer: 28, Fall: 12 }
  return map[season] ?? 15
}

export function seasonWeatherIndex(season: string): number {
  const map: Record<string, number> = { Winter: 3, Spring: 1, Summer: 0, Fall: 2 }
  return map[season] ?? 1
}

export function isWeekend(day: string): boolean {
  return day === 'Saturday' || day === 'Sunday'
}

export function deriveWeather(season: string, hour: number): string {
  const base = ['Clear', 'Cloudy', 'Rain', 'Snow', 'Storm', 'Fog'][seasonWeatherIndex(season)] ?? 'Clear'
  if (hour >= 22 || hour <= 5) return base === 'Clear' ? 'Fog' : base
  return base
}

export function getPreviousHourCount(visits: ERVisit[], hospital: string, date: Date, hour: number): number {
  const prevHour = hour === 0 ? 23 : hour - 1
  const dayStr = date.toISOString().slice(0, 10)
  return visits.filter(
    (v) =>
      v.hospitalName === hospital &&
      v.visitDate.toISOString().slice(0, 10) === dayStr &&
      v.visitDate.getHours() === prevHour
  ).length
}

export function trainModel(visits: ERVisit[]): TrainedModel {
  const slotCountByHour = new Map<string, number>()
  visits.forEach((v) => {
    const k = `${v.hospitalName}|${v.visitDate.getHours()}`
    slotCountByHour.set(k, (slotCountByHour.get(k) ?? 0) + 1)
  })

  const samples: { x: number[]; y: number }[] = []
  visits.forEach((v) => {
    const prev = getPreviousHourCount(visits, v.hospitalName, v.visitDate, v.visitDate.getHours())
    samples.push({ x: encodeVisit(v, prev), y: v.totalWaitTime })
  })

  const n = samples[0]?.x.length ?? 13
  const featureMeans = Array(n).fill(0)
  const featureStds = Array(n).fill(1)

  for (let j = 0; j < n; j++) {
    const col = samples.map((s) => s.x[j])
    featureMeans[j] = col.reduce((a, b) => a + b, 0) / col.length
    const variance = col.reduce((a, b) => a + (b - featureMeans[j]) ** 2, 0) / col.length
    featureStds[j] = Math.sqrt(variance) || 1
  }

  const normalize = (x: number[]) => x.map((v, j) => (v - featureMeans[j]) / featureStds[j])

  let weights = Array(n).fill(0)
  let bias = samples.reduce((s, r) => s + r.y, 0) / samples.length
  const lr = 0.05
  const epochs = 80

  for (let e = 0; e < epochs; e++) {
    for (const { x, y } of samples) {
      const xn = normalize(x)
      const pred = bias + xn.reduce((s, v, j) => s + v * weights[j], 0)
      const err = pred - y
      bias -= lr * err * 0.01
      xn.forEach((v, j) => {
        weights[j] -= lr * err * v * 0.001
      })
    }
  }

  return { weights, bias, featureMeans, featureStds, slotCountByHour, trainedAt: Date.now() }
}

export function predictWait(model: TrainedModel, input: DatasetPredictionInput): number {
  const x = encodeInput(input)
  const xn = x.map((v, j) => (v - model.featureMeans[j]) / model.featureStds[j])
  const raw = model.bias + xn.reduce((s, v, j) => s + v * model.weights[j], 0)
  return Math.max(5, Math.round(raw))
}

export function predictPatientCount(model: TrainedModel, input: DatasetPredictionInput): number {
  const key = `${input.hospitalName}|${input.hour}`
  const fromSlot = model.slotCountByHour.get(key)
  if (fromSlot) return fromSlot
  const similar = [...model.slotCountByHour.entries()]
    .filter(([k]) => k.startsWith(input.hospitalName))
    .map(([, c]) => c)
  const avg = similar.length ? similar.reduce((a, b) => a + b, 0) / similar.length : 8
  const boost =
    (input.holidayStatus ? 1.1 : 1) *
    (input.specialEvent ? 1.25 : 1) *
    (input.urgencyLevel === 'Critical' ? 1.15 : 1)
  return Math.max(1, Math.round(avg * boost))
}

export function computeFeatureImportance(visits: ERVisit[]): { feature: string; importance: number }[] {
  const features = [
    { key: 'hour', label: 'Hour of Day', val: (v: ERVisit) => v.visitDate.getHours() },
    { key: 'day', label: 'Day of Week', val: (v: ERVisit) => DAY_INDEX[v.dayOfWeek] ?? 0 },
    { key: 'urgency', label: 'Urgency Level', val: (v: ERVisit) => URGENCY_INDEX[v.urgencyLevel] ?? 0 },
    { key: 'season', label: 'Season', val: (v: ERVisit) => SEASON_INDEX[v.season] ?? 0 },
    { key: 'time', label: 'Time of Day', val: (v: ERVisit) => TIME_INDEX[v.timeOfDay] ?? 0 },
    { key: 'nurse', label: 'Nurse-to-Patient Ratio', val: (v: ERVisit) => v.nurseToPatientRatio },
    { key: 'region', label: 'Region', val: (v: ERVisit) => (v.region === 'Urban' ? 1 : 0) },
    { key: 'specialist', label: 'Specialist Availability', val: (v: ERVisit) => v.specialistAvailability },
  ]

  const y = visits.map((v) => v.totalWaitTime)
  const yMean = y.reduce((a, b) => a + b, 0) / y.length
  const yStd = Math.sqrt(y.reduce((a, b) => a + (b - yMean) ** 2, 0) / y.length) || 1

  const corrs = features.map(({ label, val }) => {
    const x = visits.map(val)
    const xMean = x.reduce((a, b) => a + b, 0) / x.length
    const xStd = Math.sqrt(x.reduce((a, b) => a + (b - xMean) ** 2, 0) / x.length) || 1
    const cov = x.reduce((s, xi, i) => s + ((xi - xMean) / xStd) * ((y[i] - yMean) / yStd), 0) / x.length
    return { feature: label, importance: Math.abs(cov) }
  })

  const sum = corrs.reduce((s, c) => s + c.importance, 0) || 1
  return corrs
    .map((c) => ({ ...c, importance: Math.round((c.importance / sum) * 100) }))
    .sort((a, b) => b.importance - a.importance)
}

export function evaluateModel(model: TrainedModel, visits: ERVisit[]): {
  accuracyPct: number
  precision: number
  recall: number
  rmse: number
  mae: number
} {
  const holdout = visits.filter((_, i) => i % 5 === 0)
  let se = 0
  let ae = 0
  let tp = 0
  let fp = 0
  let fn = 0

  holdout.forEach((v) => {
    const prev = getPreviousHourCount(visits, v.hospitalName, v.visitDate, v.visitDate.getHours())
    const input: DatasetPredictionInput = {
      hospitalName: v.hospitalName,
      dayOfWeek: v.dayOfWeek,
      season: v.season,
      timeOfDay: v.timeOfDay,
      urgencyLevel: v.urgencyLevel,
      region: v.region,
      nurseToPatientRatio: v.nurseToPatientRatio,
      specialistAvailability: v.specialistAvailability,
      hour: v.visitDate.getHours(),
      temperature: seasonTemperature(v.season),
      weatherCondition: deriveWeather(v.season, v.visitDate.getHours()),
      holidayStatus: isWeekend(v.dayOfWeek),
      specialEvent: v.urgencyLevel === 'Critical',
      previousHourCount: prev,
    }
    const pred = predictWait(model, input)
    se += (pred - v.totalWaitTime) ** 2
    ae += Math.abs(pred - v.totalWaitTime)
    const actualHigh = v.totalWaitTime > 90
    const predHigh = pred > 90
    if (predHigh && actualHigh) tp++
    if (predHigh && !actualHigh) fp++
    if (!predHigh && actualHigh) fn++
  })

  const n = holdout.length || 1
  const rmse = Math.sqrt(se / n)
  const mae = ae / n
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const accuracyPct = Math.max(0, 100 - (mae / 120) * 100)

  return { accuracyPct, precision, recall, rmse, mae }
}
