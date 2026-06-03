import { describe, expect, it } from 'vitest'
import { parseCsvRow } from './csvParser'

describe('parseCsvRow', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields with commas', () => {
    expect(parseCsvRow('"Hello, World",b')).toEqual(['Hello, World', 'b'])
  })
})
