import { describe, expect, it } from 'vitest'
import { doses, initialDoseLog, meds, schedule } from '../src/data'

describe('demo data', () => {
  it('has one dose per scheduled time of each medication', () => {
    const expected = meds.reduce((n, m) => n + m.times.length, 0)
    expect(doses).toHaveLength(expected)
    expect(doses).toHaveLength(9)
  })

  it('gives every dose a unique "<med id>-<time index>" key', () => {
    const keys = doses.map(d => d.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('2-2')
  })

  it('starts with the two morning doses already taken', () => {
    expect(Object.entries(initialDoseLog).filter(([, v]) => v === true)).toHaveLength(2)
    for (const key of Object.keys(initialDoseLog)) expect(keys(doses)).toContain(key)
  })

  it('lists five schedule items, two of them done', () => {
    expect(schedule).toHaveLength(5)
    expect(schedule.filter(s => s.done)).toHaveLength(2)
  })
})

const keys = (list: typeof doses) => list.map(d => d.key)
