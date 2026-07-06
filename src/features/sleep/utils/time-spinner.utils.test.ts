import { describe, expect, it } from 'vitest'
import {
  commitTimeUnitDigits,
  isCompleteTimeUnit,
  sanitizeTimeUnitDigits,
} from '@/features/sleep/utils/time-spinner.utils'

describe('sanitizeTimeUnitDigits', () => {
  it('keeps up to two numeric digits', () => {
    expect(sanitizeTimeUnitDigits('30')).toBe('30')
    expect(sanitizeTimeUnitDigits('3')).toBe('3')
    expect(sanitizeTimeUnitDigits('003')).toBe('00')
    expect(sanitizeTimeUnitDigits('a3b0c')).toBe('30')
  })
})

describe('commitTimeUnitDigits', () => {
  it('pads single digits and clamps to max', () => {
    expect(commitTimeUnitDigits('', 59)).toBe(0)
    expect(commitTimeUnitDigits('3', 23)).toBe(3)
    expect(commitTimeUnitDigits('30', 59)).toBe(30)
    expect(commitTimeUnitDigits('99', 59)).toBe(59)
    expect(commitTimeUnitDigits('99', 23)).toBe(23)
  })
})

describe('isCompleteTimeUnit', () => {
  it('accepts only two-digit values within range', () => {
    expect(isCompleteTimeUnit('3', 59)).toBe(false)
    expect(isCompleteTimeUnit('30', 59)).toBe(true)
    expect(isCompleteTimeUnit('60', 59)).toBe(false)
    expect(isCompleteTimeUnit('23', 23)).toBe(true)
    expect(isCompleteTimeUnit('24', 23)).toBe(false)
  })
})
