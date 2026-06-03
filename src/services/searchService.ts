import type { ERVisit } from '../types/dataset'
import type { SearchResult } from '../types/dataset'

export function searchVisits(visits: ERVisit[], query: string, limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return visits
    .filter(
      (v) =>
        v.visitId.toLowerCase().includes(q) ||
        v.patientId.toLowerCase().includes(q) ||
        v.hospitalName.toLowerCase().includes(q) ||
        v.hospitalId.toLowerCase().includes(q) ||
        v.patientOutcome.toLowerCase().includes(q) ||
        v.urgencyLevel.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q) ||
        v.visitDate.toLocaleDateString().includes(q) ||
        v.visitDate.toISOString().includes(q)
    )
    .slice(0, limit)
    .map((v) => ({
      visitId: v.visitId,
      hospitalName: v.hospitalName,
      visitDate: v.visitDate.toISOString(),
      urgencyLevel: v.urgencyLevel,
      totalWaitTime: v.totalWaitTime,
      patientOutcome: v.patientOutcome,
    }))
}
