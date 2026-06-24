import { describe, expect, it } from 'vitest'
import { timeToIso } from '@/features/sleep/utils/sleep.utils'

describe('timeToIso', () => {
  it('preserves wall-clock time with timezone offset', () => {
    const iso = timeToIso('2024-06-01', '00:00')
    expect(iso).toMatch(/^2024-06-01T00:00:00[+-]\d{2}:\d{2}$/)
    expect(iso).not.toContain('Z')
  })
})
