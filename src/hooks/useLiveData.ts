import { useEffect } from 'react'
import { useDataset } from '../context/DatasetContext'

export function useLiveData() {
  const { aggregates, refreshLive } = useDataset()

  useEffect(() => {
    const id = setInterval(refreshLive, 4000)
    return () => clearInterval(id)
  }, [refreshLive])

  return (
    aggregates?.liveMetrics ?? {
      currentPatients: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      activeDoctors: 0,
      activeNurses: 0,
      ambulanceArrivals: 0,
      waitingPatients: 0,
      avgSatisfaction: 0,
    }
  )
}
