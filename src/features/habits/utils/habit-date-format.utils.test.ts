import { describe, expect, it } from 'vitest'
import {
  formatDayForLabel,
  formatLongDate,
  formatWeekEyebrow,
  formatWeekRange,
} from '@/features/habits/utils/habit-date-format.utils'
import { getIsoWeekNumber } from '@/features/habits/utils/habit-week.utils'

describe('getIsoWeekNumber', () => {
  it('numera la semana según ISO-8601', () => {
    expect(getIsoWeekNumber('2026-09-14')).toBe(38)
    expect(getIsoWeekNumber('2026-09-20')).toBe(38)
    expect(getIsoWeekNumber('2026-09-21')).toBe(39)
  })

  it('el 1 de enero puede caer en la última semana del año anterior', () => {
    // Jueves 1 de enero de 2026 → semana 1.
    expect(getIsoWeekNumber('2026-01-01')).toBe(1)
    // Viernes 1 de enero de 2027 → todavía semana 53 de 2026.
    expect(getIsoWeekNumber('2027-01-01')).toBe(53)
  })
})

describe('formatWeekRange', () => {
  it('comparte el mes cuando la semana no lo cruza', () => {
    expect(formatWeekRange('2026-09-14')).toBe('14–20 sept')
  })

  it('nombra los dos meses cuando la semana los cruza', () => {
    expect(formatWeekRange('2026-09-28')).toBe('28 sept – 4 oct')
  })
})

describe('formatWeekEyebrow', () => {
  it('junta número de semana y rango', () => {
    expect(formatWeekEyebrow('2026-09-14')).toBe('Semana 38 · 14–20 sept')
  })
})

describe('formatLongDate', () => {
  it('escribe la fecha larga en español con inicial mayúscula', () => {
    expect(formatLongDate('2026-09-16')).toBe('Miércoles 16 de septiembre')
  })

  it('no salta de día por zona horaria', () => {
    expect(formatLongDate('2026-01-01')).toBe('Jueves 1 de enero')
  })
})

describe('formatDayForLabel', () => {
  it('da día de la semana y número para los aria-label', () => {
    expect(formatDayForLabel('2026-09-16')).toBe('miércoles 16')
  })
})
