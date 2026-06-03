export type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface PredictionExplanationMeta {
  sampleCount: number
  hospital: string
  dayOfWeek: string
  season: string
  timeOfDay: string
  avgWait: number
  urgency: string
  nurseRatio: number
  avgNurse: number
  hour: number
  temperature: number
  weatherCondition: string
  holidayStatus: boolean
  previousHourCount: number
}

export interface PredictionResult {
  patientCount: number
  crowdLevel: CrowdLevel
  confidence: number
  expectedWaitingTime: number
  meta: PredictionExplanationMeta
}

export interface HistoricalRecord {
  id: string
  date: string
  time: string
  predictedCount: number
  actualCount: number
  accuracy: number
  riskLevel: CrowdLevel
  waitingTime: number
}

export interface KpiData {
  id: string
  value: string | number
  unit?: string
  change: number
  trend: 'up' | 'down' | 'neutral'
  sparkline: number[]
  icon: string
  color: string
}

export interface AppSettings {
  criticalAlerts: boolean
  hourlySummary: boolean
}
