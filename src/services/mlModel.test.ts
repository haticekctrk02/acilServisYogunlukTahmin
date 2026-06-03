import { describe, expect, it } from 'vitest'
import { crowdFromWait } from './datasetService'
import { isWeekend, seasonTemperature, trainModel } from './mlModel'
import type { ERVisit } from '../types/dataset'

function mockVisit(overrides: Partial<ERVisit> = {}): ERVisit {
  return {
    visitId: 'V1',
    patientId: 'P1',
    hospitalId: 'H1',
    hospitalName: 'Test Hospital',
    region: 'Urban',
    visitDate: new Date('2024-06-15T14:00:00'),
    dayOfWeek: 'Saturday',
    season: 'Summer',
    timeOfDay: 'Afternoon',
    urgencyLevel: 'Medium',
    nurseToPatientRatio: 4,
    specialistAvailability: 5,
    facilitySizeBeds: 100,
    timeToRegistration: 10,
    timeToTriage: 20,
    timeToMedicalProfessional: 40,
    totalWaitTime: 70,
    patientOutcome: 'Discharged',
    patientSatisfaction: 4,
    ...overrides,
  }
}

describe('mlModel', () => {
  it('detects weekends', () => {
    expect(isWeekend('Saturday')).toBe(true)
    expect(isWeekend('Monday')).toBe(false)
  })

  it('returns season temperatures', () => {
    expect(seasonTemperature('Summer')).toBe(28)
  })

  it('trains and predicts finite wait times', () => {
    const visits = Array.from({ length: 40 }, (_, i) =>
      mockVisit({ totalWaitTime: 30 + i * 2, visitId: `V${i}` })
    )
    const model = trainModel(visits)
    expect(model.weights.length).toBeGreaterThan(0)
    expect(Number.isFinite(model.bias)).toBe(true)
  })
})

describe('crowdFromWait', () => {
  it('classifies by percentiles', () => {
    expect(crowdFromWait(10, 20, 50, 80)).toBe('LOW')
    expect(crowdFromWait(90, 20, 50, 80)).toBe('CRITICAL')
  })
})
