import { describe, expect, it } from 'vitest'
import {
  appendDraftDigit,
  commitTimeUnitDigits,
  isCompleteTimeUnit,
  nextDraftDigits,
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

describe('nextDraftDigits', () => {
  it('builds multi-digit values while typing', () => {
    expect(nextDraftDigits('', '3')).toBe('3')
    expect(nextDraftDigits('3', '30')).toBe('30')
    expect(nextDraftDigits('', '30')).toBe('30')
  })

  it('recovers when the browser concatenates onto a padded value', () => {
    expect(nextDraftDigits('', '030')).toBe('30')
    expect(nextDraftDigits('3', '030')).toBe('30')
  })
})

describe('appendDraftDigit', () => {
  it('appends one digit at a time', () => {
    expect(appendDraftDigit('', '3')).toBe('3')
    expect(appendDraftDigit('3', '0')).toBe('30')
  })
})
