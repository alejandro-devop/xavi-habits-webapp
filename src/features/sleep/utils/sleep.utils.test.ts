import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTodayDate, timeToIso } from '@/features/sleep/utils/sleep.utils'

describe('getTodayDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns local calendar date, not UTC', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T23:30:00-05:00'))
    expect(getTodayDate()).toBe('2026-06-23')
  })
})

describe('timeToIso', () => {
  it('preserves wall-clock time with timezone offset', () => {
    const iso = timeToIso('2024-06-01', '00:00')
    expect(iso).toMatch(/^2024-06-01T00:00:00[+-]\d{2}:\d{2}$/)
    expect(iso).not.toContain('Z')
  })
})
