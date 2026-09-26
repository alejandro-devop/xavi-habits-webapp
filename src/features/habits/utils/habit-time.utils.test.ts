import { describe, expect, it } from 'vitest'
import {
  isValidHHmm,
  nowHHmm,
  timeOfDayForDate,
  toHHmm,
} from '@/features/habits/utils/habit-time.utils'

describe('nowHHmm', () => {
  it('da la hora local con dos dígitos en cada mitad', () => {
    expect(nowHHmm(new Date(2026, 8, 25, 22, 15))).toBe('22:15')
    expect(nowHHmm(new Date(2026, 8, 25, 9, 5))).toBe('09:05')
    expect(nowHHmm(new Date(2026, 8, 25, 0, 0))).toBe('00:00')
    expect(nowHHmm(new Date(2026, 8, 25, 23, 59))).toBe('23:59')
  })
})

describe('isValidHHmm', () => {
  it('acepta solo horas de reloj de 24 h', () => {
    expect(isValidHHmm('00:00')).toBe(true)
    expect(isValidHHmm('23:59')).toBe(true)
    expect(isValidHHmm('24:00')).toBe(false)
    expect(isValidHHmm('22:60')).toBe(false)
    expect(isValidHHmm('7:05')).toBe(false)
    expect(isValidHHmm('22:15:00')).toBe(false)
    expect(isValidHHmm('')).toBe(false)
    expect(isValidHHmm(null)).toBe(false)
    expect(isValidHHmm(undefined)).toBe(false)
  })
})

describe('toHHmm', () => {
  it('recorta los segundos que puede asomar una columna TIME', () => {
    expect(toHHmm('22:15:00')).toBe('22:15')
    expect(toHHmm('22:15')).toBe('22:15')
  })

  it('devuelve null para lo que no es una hora, y null es «sin hora», no medianoche', () => {
    expect(toHHmm(null)).toBeNull()
    expect(toHHmm(undefined)).toBeNull()
    expect(toHHmm('')).toBeNull()
    expect(toHHmm('ayer')).toBeNull()
    expect(toHHmm('99:99')).toBeNull()
  })
})

describe('timeOfDayForDate', () => {
  const ahora = new Date(2026, 8, 25, 22, 15)

  it('sella la hora del momento cuando el día registrado es hoy', () => {
    expect(timeOfDayForDate('2026-09-25', '2026-09-25', ahora)).toBe('22:15')
  })

  it('no inventa hora para un día pasado', () => {
    expect(timeOfDayForDate('2026-09-23', '2026-09-25', ahora)).toBeNull()
  })

  it('no inventa hora para un día futuro', () => {
    expect(timeOfDayForDate('2026-09-26', '2026-09-25', ahora)).toBeNull()
  })

  it('sin fecha, el API entiende «hoy», así que lleva hora', () => {
    expect(timeOfDayForDate(undefined, '2026-09-25', ahora)).toBe('22:15')
  })
})
