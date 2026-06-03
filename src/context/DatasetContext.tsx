import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useLanguage } from './LanguageContext'
import {
  buildAggregates,
  buildHistoricalRecords,
  buildNotifications,
  loadDataset,
  predictFromDataset,
  trainModel,
  type TrainedModel,
} from '../services/datasetService'
import { searchVisits } from '../services/searchService'
import type { DatasetAggregates, DatasetPredictionInput, ERVisit, NotificationItem, SearchResult } from '../types/dataset'
import type { HistoricalRecord, PredictionResult } from '../types'

interface DatasetContextValue {
  loading: boolean
  error: string | null
  visits: ERVisit[]
  model: TrainedModel | null
  aggregates: DatasetAggregates | null
  historicalRecords: HistoricalRecord[]
  notifications: NotificationItem[]
  selectedHospital: string
  setSelectedHospital: (name: string) => void
  predict: (input: DatasetPredictionInput) => PredictionResult | null
  search: (query: string) => SearchResult[]
  refreshLive: () => void
  formatDate: (iso: string) => string
  formatTime: (iso: string, timeFallback?: string) => string
  retryLoad: () => void
}

const DatasetContext = createContext<DatasetContextValue | null>(null)

export function DatasetProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visits, setVisits] = useState<ERVisit[]>([])
  const [model, setModel] = useState<TrainedModel | null>(null)
  const [selectedHospital, setSelectedHospital] = useState('')
  const [liveTick, setLiveTick] = useState(0)
  const [loadKey, setLoadKey] = useState(0)

  const loadData = () => {
    setLoading(true)
    setError(null)
    loadDataset()
      .then((data) => {
        const trained = trainModel(data)
        setVisits(data)
        setModel(trained)
        const hospitals = [...new Set(data.map((v) => v.hospitalName))].sort()
        setSelectedHospital((prev) => (prev && hospitals.includes(prev) ? prev : hospitals[0] ?? ''))
        setLoading(false)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Dataset load failed')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [loadKey])

  const aggregates = useMemo(() => {
    if (!visits.length || !model) return null
    return buildAggregates(visits, model, selectedHospital || undefined)
  }, [visits, model, selectedHospital, liveTick])

  const historicalRecords = useMemo(() => {
    if (!visits.length || !model) return []
    const subset = selectedHospital ? visits.filter((v) => v.hospitalName === selectedHospital) : visits
    return buildHistoricalRecords(subset, model)
  }, [visits, model, selectedHospital])

  const notifications = useMemo(() => {
    if (!aggregates) return []
    return buildNotifications(aggregates, selectedHospital)
  }, [aggregates, selectedHospital, liveTick])

  const predict = (input: DatasetPredictionInput): PredictionResult | null => {
    if (!visits.length || !model) return null
    return predictFromDataset(visits, input, model)
  }

  const search = (query: string) => searchVisits(visits, query)

  const refreshLive = () => setLiveTick((t) => t + 1)

  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'

  const formatDate = (iso: string) => {
    try {
      if (iso.includes('T') || iso.match(/^\d{4}/)) {
        return new Date(iso).toLocaleDateString(loc)
      }
      return iso
    } catch {
      return iso
    }
  }

  const formatTime = (iso: string, timeFallback?: string) => {
    if (timeFallback && !iso.includes('T')) return timeFallback
    try {
      return new Date(iso).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timeFallback ?? iso
    }
  }

  const retryLoad = () => setLoadKey((k) => k + 1)

  return (
    <DatasetContext.Provider
      value={{
        loading,
        error,
        visits,
        model,
        aggregates,
        historicalRecords,
        notifications,
        selectedHospital,
        setSelectedHospital,
        predict,
        search,
        refreshLive,
        formatDate,
        formatTime,
        retryLoad,
      }}
    >
      {children}
    </DatasetContext.Provider>
  )
}

export function useDataset() {
  const ctx = useContext(DatasetContext)
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider')
  return ctx
}
