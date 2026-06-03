import { parseCsv } from '../utils/csvParser'
import type { CrowdLevel, HistoricalRecord, KpiData, PredictionResult } from '../types'
import type {
  DatasetAggregates,
  DatasetPredictionInput,
  ERVisit,
  NotificationItem,
} from '../types/dataset'
import {
  computeFeatureImportance,
  deriveWeather,
  evaluateModel,
  getPreviousHourCount,
  isWeekend,
  predictPatientCount,
  predictWait,
  seasonTemperature,
  trainModel,
  type TrainedModel,
} from './mlModel'

const CSV_URL = '/er_dataset.csv'
const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Snow', 'Storm', 'Fog']
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function parseVisit(row: string[]): ERVisit | null {
  if (row.length < 19) return null
  const visitDate = new Date(row[5])
  if (Number.isNaN(visitDate.getTime())) return null

  return {
    visitId: row[0],
    patientId: row[1],
    hospitalId: row[2],
    hospitalName: row[3],
    region: row[4],
    visitDate,
    dayOfWeek: row[6],
    season: row[7],
    timeOfDay: row[8],
    urgencyLevel: row[9],
    nurseToPatientRatio: Number(row[10]) || 4,
    specialistAvailability: Number(row[11]) || 0,
    facilitySizeBeds: Number(row[12]) || 50,
    timeToRegistration: Number(row[13]) || 0,
    timeToTriage: Number(row[14]) || 0,
    timeToMedicalProfessional: Number(row[15]) || 0,
    totalWaitTime: Number(row[16]) || 0,
    patientOutcome: row[17],
    patientSatisfaction: Number(row[18]) || 3,
  }
}

export async function loadDataset(): Promise<ERVisit[]> {
  const res = await fetch(CSV_URL)
  if (!res.ok)
    throw new Error(
      'er_dataset.csv bulunamadı. Kaggle\'dan indirin: https://www.kaggle.com/datasets/rivalytics/er-wait-time — dosyayı proje köküne koyup npm run sync-dataset çalıştırın.'
    )
  const rows = parseCsv(await res.text())
  const visits: ERVisit[] = []
  for (let i = 1; i < rows.length; i++) {
    const v = parseVisit(rows[i])
    if (v) visits.push(v)
  }
  return visits
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function crowdFromWait(wait: number, p25: number, p50: number, p75: number): CrowdLevel {
  if (wait >= p75) return 'CRITICAL'
  if (wait >= p50) return 'HIGH'
  if (wait >= p25) return 'MEDIUM'
  return 'LOW'
}

function waitPercentiles(visits: ERVisit[]) {
  const waits = visits.map((v) => v.totalWaitTime).sort((a, b) => a - b)
  const q = (p: number) => waits[Math.floor(waits.length * p)] ?? 0
  return { p25: q(0.25), p50: q(0.5), p75: q(0.75) }
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function filterSimilar(visits: ERVisit[], input: DatasetPredictionInput): ERVisit[] {
  return visits.filter(
    (v) =>
      v.hospitalName === input.hospitalName &&
      v.dayOfWeek === input.dayOfWeek &&
      v.season === input.season &&
      v.timeOfDay === input.timeOfDay &&
      v.region === input.region &&
      Math.abs(v.specialistAvailability - input.specialistAvailability) <= 3 &&
      Math.abs(v.visitDate.getHours() - input.hour) <= 2
  )
}

export function predictFromDataset(
  visits: ERVisit[],
  input: DatasetPredictionInput,
  model: TrainedModel
): PredictionResult {
  let pool = filterSimilar(visits, input)
  if (pool.length < 5) {
    pool = visits.filter(
      (v) =>
        v.hospitalName === input.hospitalName &&
        v.dayOfWeek === input.dayOfWeek &&
        v.season === input.season &&
        v.timeOfDay === input.timeOfDay
    )
  }
  if (pool.length < 3) pool = visits.filter((v) => v.hospitalName === input.hospitalName)
  if (pool.length === 0) pool = visits

  const urgencyPool = pool.filter((v) => v.urgencyLevel === input.urgencyLevel)
  const sample = urgencyPool.length >= 3 ? urgencyPool : pool

  const avgWait = predictWait(model, input)
  const patientCount = predictPatientCount(model, input)
  const pct = waitPercentiles(visits)
  const crowdLevel = crowdFromWait(avgWait, pct.p25, pct.p50, pct.p75)
  const avgNurse = sample.reduce((s, v) => s + v.nurseToPatientRatio, 0) / sample.length
  const confidence = Math.min(97, Math.round(75 + Math.min(sample.length, 30) + model.weights.length))

  return {
    patientCount: Math.min(220, Math.max(1, patientCount)),
    crowdLevel,
    confidence,
    expectedWaitingTime: avgWait,
    meta: {
      sampleCount: sample.length,
      hospital: input.hospitalName,
      dayOfWeek: input.dayOfWeek,
      season: input.season,
      timeOfDay: input.timeOfDay,
      avgWait,
      urgency: input.urgencyLevel,
      nurseRatio: input.nurseToPatientRatio,
      avgNurse,
      hour: input.hour,
      temperature: input.temperature,
      weatherCondition: input.weatherCondition,
      holidayStatus: input.holidayStatus,
      previousHourCount: input.previousHourCount,
    },
  }
}

function computeKpiChange(visits: ERVisit[], metric: (v: ERVisit[]) => number): { change: number; trend: KpiData['trend'] } {
  const sorted = [...visits].sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime())
  const mid = Math.floor(sorted.length / 2)
  const recent = sorted.slice(mid)
  const prior = sorted.slice(0, mid)
  const cur = metric(recent)
  const prev = metric(prior)
  const change = pctChange(cur, prev)
  return { change, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' }
}

function computeWeeklyAccuracy(
  visits: ERVisit[],
  model: TrainedModel,
  hospitalFilter?: string
): { week: string; accuracy: number }[] {
  const filtered = hospitalFilter ? visits.filter((v) => v.hospitalName === hospitalFilter) : visits
  const byWeek = new Map<string, { pred: number[]; actual: number[] }>()

  filtered.forEach((v) => {
    const weekStart = new Date(v.visitDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    const hour = v.visitDate.getHours()
    const prev = getPreviousHourCount(visits, v.hospitalName, v.visitDate, hour)
    const input: DatasetPredictionInput = {
      hospitalName: v.hospitalName,
      dayOfWeek: v.dayOfWeek,
      season: v.season,
      timeOfDay: v.timeOfDay,
      urgencyLevel: v.urgencyLevel,
      region: v.region,
      nurseToPatientRatio: v.nurseToPatientRatio,
      specialistAvailability: v.specialistAvailability,
      hour,
      temperature: seasonTemperature(v.season),
      weatherCondition: deriveWeather(v.season, hour),
      holidayStatus: isWeekend(v.dayOfWeek),
      specialEvent: v.urgencyLevel === 'Critical',
      previousHourCount: prev,
    }
    const predicted = predictPatientCount(model, input)
    const bucket = byWeek.get(key) ?? { pred: [], actual: [] }
    bucket.pred.push(predicted)
    bucket.actual.push(1)
    byWeek.set(key, bucket)
  })

  const weeks = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)

  return weeks.map(([_, data], i) => {
    const totalPred = data.pred.reduce((a, b) => a + b, 0)
    const totalActual = data.actual.length
    const accuracy = Math.min(
      99,
      Math.round(100 - (Math.abs(totalPred - totalActual) / Math.max(totalActual, 1)) * 100)
    )
    return { week: `W${i + 1}`, accuracy }
  })
}

export function buildAggregates(
  visits: ERVisit[],
  model: TrainedModel,
  hospitalFilter?: string
): DatasetAggregates {
  const filtered = hospitalFilter ? visits.filter((v) => v.hospitalName === hospitalFilter) : visits
  const hospitals = uniq(visits.map((v) => v.hospitalName)).sort()
  const pct = waitPercentiles(filtered)
  const avgWait = Math.round(filtered.reduce((s, v) => s + v.totalWaitTime, 0) / Math.max(1, filtered.length))

  const hourMap = new Map<number, number>()
  const hourPred = new Map<number, number[]>()
  filtered.forEach((v) => {
    const h = v.visitDate.getHours()
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1)
    const prev = getPreviousHourCount(visits, v.hospitalName, v.visitDate, h)
    const input: DatasetPredictionInput = {
      hospitalName: v.hospitalName,
      dayOfWeek: v.dayOfWeek,
      season: v.season,
      timeOfDay: v.timeOfDay,
      urgencyLevel: v.urgencyLevel,
      region: v.region,
      nurseToPatientRatio: v.nurseToPatientRatio,
      specialistAvailability: v.specialistAvailability,
      hour: h,
      temperature: seasonTemperature(v.season),
      weatherCondition: deriveWeather(v.season, h),
      holidayStatus: isWeekend(v.dayOfWeek),
      specialEvent: v.urgencyLevel === 'Critical',
      previousHourCount: prev,
    }
    const preds = hourPred.get(h) ?? []
    preds.push(predictPatientCount(model, input))
    hourPred.set(h, preds)
  })

  const hourlyTrend = Array.from({ length: 12 }, (_, i) => {
    const h = i * 2
    const patients = (hourMap.get(h) ?? 0) + (hourMap.get(h + 1) ?? 0)
    const predArr = [...(hourPred.get(h) ?? []), ...(hourPred.get(h + 1) ?? [])]
    const predicted = predArr.length
      ? Math.round(predArr.reduce((a, b) => a + b, 0) / predArr.length)
      : Math.round(patients * 0.95)
    return { hour: String(h).padStart(2, '0'), patients, predicted }
  })

  const weeklyHeatmap = DAY_ORDER.map((dayKey) => {
    const dayVisits = filtered.filter((v) => v.dayOfWeek === dayKey)
    const bucket = (from: number, to: number) => {
      const n = dayVisits.filter((v) => {
        const h = v.visitDate.getHours()
        return h >= from && h < to
      }).length
      return Math.min(5, Math.max(1, Math.ceil(n / Math.max(1, dayVisits.length / 5))))
    }
    return {
      dayKey,
      day: dayKey.slice(0, 3),
      h0: bucket(0, 6),
      h6: bucket(6, 12),
      h12: bucket(12, 18),
      h18: bucket(18, 24),
    }
  })

  const monthMap = new Map<string, number>()
  filtered.forEach((v) => {
    const m = v.visitDate.toLocaleString('en', { month: 'short' })
    monthMap.set(m, (monthMap.get(m) ?? 0) + 1)
  })
  const monthlyAdmissions = [...monthMap.entries()].map(([month, admissions]) => ({
    month,
    admissions,
    capacity: Math.round(admissions * 1.15),
  }))

  const seasonMap = new Map<string, number>()
  filtered.forEach((v) => seasonMap.set(v.season, (seasonMap.get(v.season) ?? 0) + 1))
  const maxSeason = Math.max(...seasonMap.values(), 1)
  const seasonalUsage = [...seasonMap.entries()].map(([season, count]) => ({
    season,
    seasonKey: season,
    usage: Math.round((count / maxSeason) * 100),
  }))

  const waitBuckets = [
    { range: '0-30', min: 0, max: 30 },
    { range: '30-60', min: 30, max: 60 },
    { range: '60-90', min: 60, max: 90 },
    { range: '90-120', min: 90, max: 120 },
    { range: '120+', min: 120, max: 9999 },
  ]
  const arrivalDistribution = waitBuckets.map(({ range, min, max }) => ({
    range,
    count: filtered.filter((v) => v.totalWaitTime >= min && v.totalWaitTime < max).length,
  }))

  const evalResult = evaluateModel(model, filtered)
  const weeklyAcc = computeWeeklyAccuracy(visits, model, hospitalFilter)
  const predictionAccuracy =
    weeklyAcc.length >= 3
      ? weeklyAcc
      : Array.from({ length: 6 }, (_, i) => ({
          week: `W${i + 1}`,
          accuracy: Math.min(99, Math.round(evalResult.accuracyPct - (5 - i) * 0.3 + i * 0.5)),
        }))

  const featureImportance = computeFeatureImportance(filtered)

  const outcomeMap = new Map<string, number>()
  filtered.forEach((v) => outcomeMap.set(v.patientOutcome, (outcomeMap.get(v.patientOutcome) ?? 0) + 1))
  const outcomeDistribution = [...outcomeMap.entries()].map(([outcome, count]) => ({ outcome, count }))

  const urgencyLevels = uniq(filtered.map((v) => v.urgencyLevel))
  const satisfactionByUrgency = urgencyLevels.map((urgency) => {
    const subset = filtered.filter((v) => v.urgencyLevel === urgency)
    const avg = subset.reduce((s, v) => s + v.patientSatisfaction, 0) / Math.max(1, subset.length)
    return { urgency, avg: Math.round(avg * 10) / 10 }
  })

  const triageBreakdown = [
    {
      stage: 'registration',
      minutes: Math.round(filtered.reduce((s, v) => s + v.timeToRegistration, 0) / filtered.length),
    },
    {
      stage: 'triage',
      minutes: Math.round(filtered.reduce((s, v) => s + v.timeToTriage, 0) / filtered.length),
    },
    {
      stage: 'medical',
      minutes: Math.round(filtered.reduce((s, v) => s + v.timeToMedicalProfessional, 0) / filtered.length),
    },
  ]

  const avgBeds = Math.round(filtered.reduce((s, v) => s + v.facilitySizeBeds, 0) / Math.max(1, filtered.length))
  const bedUtil = Math.min(98, Math.round((filtered.length / Math.max(1, hospitals.length) / avgBeds) * 100 * 8))
  const criticalShare = filtered.filter((v) => v.urgencyLevel === 'Critical').length / Math.max(1, filtered.length)

  const recentByHour = [...hourMap.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c)
  const last7 = recentByHour.slice(-7)
  while (last7.length < 7) last7.push(last7[last7.length - 1] ?? 10)

  const occChange = computeKpiChange(filtered, (arr) => arr.length / Math.max(1, avgBeds))
  const waitChange = computeKpiChange(filtered, (arr) => arr.reduce((s, v) => s + v.totalWaitTime, 0) / arr.length)
  const predChange = computeKpiChange(filtered, (arr) => {
    const h = new Date().getHours()
    return arr.filter((v) => v.visitDate.getHours() === h).length
  })

  const kpiCards: KpiData[] = [
    {
      id: 'occupancy',
      value: bedUtil,
      unit: '%',
      change: occChange.change,
      trend: occChange.trend,
      sparkline: last7,
      icon: 'activity',
      color: '#2563EB',
    },
    {
      id: 'predicted',
      value: hourMap.get(new Date().getHours()) ?? Math.round(filtered.length / 24),
      unit: 'patients',
      change: predChange.change,
      trend: predChange.trend,
      sparkline: last7.map((n) => Math.round(n * 1.02)),
      icon: 'trending',
      color: '#0EA5E9',
    },
    {
      id: 'waiting',
      value: avgWait,
      unit: 'min',
      change: waitChange.change,
      trend: waitChange.trend,
      sparkline: last7.map((n) => Math.round(avgWait - n * 0.3)),
      icon: 'clock',
      color: '#F59E0B',
    },
    {
      id: 'risk',
      value: criticalShare > 0.15 ? 'CRITICAL' : criticalShare > 0.08 ? 'HIGH' : avgWait > pct.p50 ? 'MEDIUM' : 'LOW',
      change: Math.round(criticalShare * 100),
      trend: criticalShare > 0.1 ? 'up' : 'neutral',
      sparkline: [1, 2, 2, 3, 3, criticalShare > 0.1 ? 4 : 2, criticalShare > 0.15 ? 4 : 3],
      icon: 'alert',
      color: '#EF4444',
    },
    {
      id: 'beds',
      value: bedUtil,
      unit: '%',
      change: occChange.change,
      trend: occChange.trend,
      sparkline: last7,
      icon: 'bed',
      color: '#22C55E',
    },
    {
      id: 'staff',
      value: (10 - filtered.reduce((s, v) => s + v.nurseToPatientRatio, 0) / filtered.length).toFixed(1),
      unit: '/10',
      change: waitChange.change * -0.1,
      trend: waitChange.trend === 'up' ? 'down' : 'up',
      sparkline: last7.map((n) => Math.min(10, n / 8)),
      icon: 'users',
      color: '#8B5CF6',
    },
  ]

  const hospitalVisits = hospitalFilter ? filtered : visits.filter((v) => v.hospitalName === hospitals[0])
  const hBeds = hospitalVisits[0]?.facilitySizeBeds ?? avgBeds
  const recent = hospitalVisits.slice(-200)
  const occupied = Math.min(hBeds - 2, Math.round(recent.length / 50))

  return {
    hospitals,
    regions: uniq(visits.map((v) => v.region)).sort(),
    daysOfWeek: DAY_ORDER.filter((d) => visits.some((v) => v.dayOfWeek === d)),
    seasons: uniq(visits.map((v) => v.season)).sort(),
    timesOfDay: uniq(visits.map((v) => v.timeOfDay)).sort(),
    urgencyLevels: uniq(visits.map((v) => v.urgencyLevel)).sort(),
    weatherOptions: WEATHER_OPTIONS,
    hourlyTrend,
    weeklyHeatmap,
    monthlyAdmissions,
    seasonalUsage,
    arrivalDistribution,
    predictionAccuracy,
    featureImportance,
    outcomeDistribution,
    satisfactionByUrgency,
    triageBreakdown,
    kpiCards,
    liveMetrics: {
      currentPatients: Math.round(recent.length / 10),
      occupiedBeds: occupied,
      availableBeds: Math.max(2, hBeds - occupied),
      activeDoctors: Math.round(
        hospitalVisits.reduce((s, v) => s + v.specialistAvailability, 0) / Math.max(1, hospitalVisits.length)
      ) || 8,
      activeNurses: Math.round(occupied * (hospitalVisits[0]?.nurseToPatientRatio ?? 4) * 0.8),
      ambulanceArrivals: recent.filter((v) => v.urgencyLevel === 'Critical').length % 6,
      waitingPatients: recent.filter((v) => v.totalWaitTime > pct.p50).length % 30,
      avgSatisfaction: Math.round(
        (recent.reduce((s, v) => s + v.patientSatisfaction, 0) / Math.max(1, recent.length)) * 10
      ) / 10,
    },
    riskScore: Math.min(95, Math.round((avgWait / Math.max(pct.p75, 1)) * 50 + criticalShare * 100)),
    mlMetrics: [
      { key: 'accuracy', value: `${evalResult.accuracyPct.toFixed(1)}%`, color: '#22C55E' },
      { key: 'precision', value: `${(evalResult.precision * 100).toFixed(1)}%`, color: '#2563EB' },
      { key: 'recall', value: `${(evalResult.recall * 100).toFixed(1)}%`, color: '#0EA5E9' },
      { key: 'rmse', value: evalResult.rmse.toFixed(1), color: '#F59E0B' },
      { key: 'mae', value: evalResult.mae.toFixed(1), color: '#EF4444' },
    ],
  }
}

export function buildHistoricalRecords(
  visits: ERVisit[],
  model: TrainedModel,
  limit = 500
): HistoricalRecord[] {
  const pct = waitPercentiles(visits)
  const bySlot = new Map<string, ERVisit[]>()

  visits.forEach((v) => {
    const key = `${v.visitDate.toISOString().slice(0, 10)}-${v.visitDate.getHours()}-${v.hospitalName}`
    const arr = bySlot.get(key) ?? []
    arr.push(v)
    bySlot.set(key, arr)
  })

  const records: HistoricalRecord[] = []
  for (const [, group] of [...bySlot.entries()].slice(-limit)) {
    const actual = group.length
    const v0 = group[0]
    const hour = v0.visitDate.getHours()
    const prev = getPreviousHourCount(visits, v0.hospitalName, v0.visitDate, hour)
    const input: DatasetPredictionInput = {
      hospitalName: v0.hospitalName,
      dayOfWeek: v0.dayOfWeek,
      season: v0.season,
      timeOfDay: v0.timeOfDay,
      urgencyLevel: v0.urgencyLevel,
      region: v0.region,
      nurseToPatientRatio: v0.nurseToPatientRatio,
      specialistAvailability: v0.specialistAvailability,
      hour,
      temperature: seasonTemperature(v0.season),
      weatherCondition: deriveWeather(v0.season, hour),
      holidayStatus: isWeekend(v0.dayOfWeek),
      specialEvent: group.some((v) => v.urgencyLevel === 'Critical'),
      previousHourCount: prev,
    }
    const predicted = predictFromDataset(visits, input, model).patientCount
    const avgWait = Math.round(group.reduce((s, v) => s + v.totalWaitTime, 0) / group.length)
    records.push({
      id: v0.visitId,
      date: v0.visitDate.toISOString(),
      time: `${String(hour).padStart(2, '0')}:00`,
      predictedCount: predicted,
      actualCount: actual,
      accuracy: Math.min(99, Math.round(100 - (Math.abs(predicted - actual) / Math.max(actual, 1)) * 100)),
      riskLevel: crowdFromWait(avgWait, pct.p25, pct.p50, pct.p75),
      waitingTime: avgWait,
    })
  }
  return records.reverse()
}

export function buildNotifications(aggregates: DatasetAggregates, hospital: string): NotificationItem[] {
  const items: NotificationItem[] = []
  const now = new Date().toLocaleTimeString()

  if (aggregates.riskScore >= 85) {
    items.push({
      id: 'n1',
      type: 'critical',
      titleKey: 'notifications.criticalTitle',
      messageKey: 'notifications.criticalMsg',
      params: { hospital, score: aggregates.riskScore },
      time: now,
    })
  }
  if (aggregates.liveMetrics.waitingPatients > 15) {
    items.push({
      id: 'n2',
      type: 'warning',
      titleKey: 'notifications.queueTitle',
      messageKey: 'notifications.queueMsg',
      params: { count: aggregates.liveMetrics.waitingPatients },
      time: now,
    })
  }
  items.push({
    id: 'n3',
    type: 'info',
    titleKey: 'notifications.mlTitle',
    messageKey: 'notifications.mlMsg',
    params: { accuracy: aggregates.mlMetrics[0]?.value ?? '—' },
    time: now,
  })

  return items
}

export { trainModel, type TrainedModel }
