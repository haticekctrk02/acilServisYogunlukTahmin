import type { KpiData } from './index'

export interface ERVisit {
  visitId: string
  patientId: string
  hospitalId: string
  hospitalName: string
  region: string
  visitDate: Date
  dayOfWeek: string
  season: string
  timeOfDay: string
  urgencyLevel: string
  nurseToPatientRatio: number
  specialistAvailability: number
  facilitySizeBeds: number
  timeToRegistration: number
  timeToTriage: number
  timeToMedicalProfessional: number
  totalWaitTime: number
  patientOutcome: string
  patientSatisfaction: number
}

export interface DatasetPredictionInput {
  hospitalName: string
  dayOfWeek: string
  season: string
  timeOfDay: string
  urgencyLevel: string
  region: string
  nurseToPatientRatio: number
  specialistAvailability: number
  hour: number
  temperature: number
  weatherCondition: string
  holidayStatus: boolean
  specialEvent: boolean
  previousHourCount: number
}

export interface DatasetAggregates {
  hospitals: string[]
  regions: string[]
  daysOfWeek: string[]
  seasons: string[]
  timesOfDay: string[]
  urgencyLevels: string[]
  weatherOptions: string[]
  hourlyTrend: { hour: string; patients: number; predicted: number }[]
  weeklyHeatmap: { dayKey: string; day: string; h0: number; h6: number; h12: number; h18: number }[]
  monthlyAdmissions: { month: string; admissions: number; capacity: number }[]
  seasonalUsage: { season: string; seasonKey: string; usage: number }[]
  arrivalDistribution: { range: string; count: number }[]
  predictionAccuracy: { week: string; accuracy: number }[]
  featureImportance: { feature: string; importance: number }[]
  outcomeDistribution: { outcome: string; count: number }[]
  satisfactionByUrgency: { urgency: string; avg: number }[]
  triageBreakdown: { stage: string; minutes: number }[]
  kpiCards: KpiData[]
  liveMetrics: {
    currentPatients: number
    occupiedBeds: number
    availableBeds: number
    activeDoctors: number
    activeNurses: number
    ambulanceArrivals: number
    waitingPatients: number
    avgSatisfaction: number
  }
  riskScore: number
  mlMetrics: { key: string; value: string; color: string }[]
}

export interface SearchResult {
  visitId: string
  hospitalName: string
  visitDate: string
  urgencyLevel: string
  totalWaitTime: number
  patientOutcome: string
}

export interface NotificationItem {
  id: string
  type: 'critical' | 'warning' | 'info'
  titleKey: string
  messageKey: string
  params?: Record<string, string | number>
  time: string
}
