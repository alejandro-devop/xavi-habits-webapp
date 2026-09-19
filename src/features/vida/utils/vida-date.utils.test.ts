import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatDateToYmd,
  getCurrentLocalDate,
  getCurrentWeekRange,
  getMondayOfWeek,
  isFutureDate,
  isToday,
} from '@/features/vida/utils/vida-date.utils'

afterEach(() => {
  vi.useRealTimers()
})

/** Mediodía local: así ningún desfase horario mueve el día. */
function freezeLocalDate(year: number, month: number, day: number) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0))
}

describe('vida-date.utils', () => {
  it('formatea en YYYY-MM-DD con ceros a la izquierda', () => {
    expect(formatDateToYmd(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatDateToYmd(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('usa la fecha local, no UTC', () => {
    freezeLocalDate(2026, 9, 19)
    expect(getCurrentLocalDate()).toBe('2026-09-19')
  })

  it('el lunes de la semana de un domingo es el lunes anterior', () => {
    // 2026-09-20 es domingo.
    expect(formatDateToYmd(getMondayOfWeek(new Date(2026, 8, 20)))).toBe('2026-09-14')
  })

  it('el lunes de la semana de un lunes es ese mismo lunes', () => {
    expect(formatDateToYmd(getMondayOfWeek(new Date(2026, 8, 14)))).toBe('2026-09-14')
  })

  it('la semana actual va de lunes a domingo', () => {
    freezeLocalDate(2026, 9, 19) // sábado
    expect(getCurrentWeekRange()).toEqual({ from: '2026-09-14', to: '2026-09-20' })
  })

  it('la semana actual cruza el cambio de mes sin romperse', () => {
    freezeLocalDate(2026, 10, 1) // jueves
    expect(getCurrentWeekRange()).toEqual({ from: '2026-09-28', to: '2026-10-04' })
  })

  it('distingue hoy, ayer y mañana', () => {
    freezeLocalDate(2026, 9, 19)
    expect(isToday('2026-09-19')).toBe(true)
    expect(isToday('2026-09-18')).toBe(false)
    expect(isFutureDate('2026-09-20')).toBe(true)
    expect(isFutureDate('2026-09-19')).toBe(false)
    expect(isFutureDate('2026-09-18')).toBe(false)
  })
})
