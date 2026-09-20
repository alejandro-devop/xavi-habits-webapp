import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BLOCK_MINUTES,
  DURATION_PILLS,
  MIN_GAP_MINUTES,
  VIDA_DAY_END_FALLBACK,
  VIDA_DAY_START_FALLBACK,
  calculateEndTime,
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  isEndAfterStart,
  isValidHhMm,
  minutesToTime,
  normalizeTimeForApi,
  normalizeTimeForDisplay,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

describe('vida-time.utils', () => {
  describe('normalizar', () => {
    it('recorta los segundos que pueda traer el API', () => {
      expect(normalizeTimeForDisplay('08:00:00')).toBe('08:00')
      expect(normalizeTimeForDisplay('8:5')).toBe('08:05')
    })

    it('lo que no se entiende cae en 00:00 en vez de reventar', () => {
      expect(normalizeTimeForDisplay('mañana')).toBe('00:00')
      expect(normalizeTimeForApi('')).toBe('00:00')
    })

    it('al API siempre le llega HH:mm', () => {
      expect(normalizeTimeForApi('8:5')).toBe('08:05')
      expect(normalizeTimeForApi('23:00')).toBe('23:00')
    })
  })

  describe('minutos', () => {
    it('va y vuelve', () => {
      expect(parseTimeToMinutes('06:30')).toBe(390)
      expect(minutesToTime(390)).toBe('06:30')
      expect(parseTimeToMinutes('00:00')).toBe(0)
      expect(parseTimeToMinutes('23:59')).toBe(1439)
    })

    it('no se sale del día', () => {
      expect(minutesToTime(-10)).toBe('00:00')
      expect(minutesToTime(99999)).toBe('23:59')
    })
  })

  describe('isValidHhMm', () => {
    it('acepta solo HH:mm de 24 h', () => {
      expect(isValidHhMm('00:00')).toBe(true)
      expect(isValidHhMm('23:59')).toBe(true)
    })

    it('rechaza lo que no lo es, incluido lo nulo', () => {
      for (const bad of [null, undefined, '', '8:00', '24:00', '12:60', '12', 'ocho']) {
        expect(isValidHhMm(bad)).toBe(false)
      }
    })
  })

  describe('isEndAfterStart', () => {
    it('el fin tiene que ser posterior: igual no vale (criterio 10)', () => {
      expect(isEndAfterStart('06:30', '23:00')).toBe(true)
      expect(isEndAfterStart('06:30', '06:30')).toBe(false)
      expect(isEndAfterStart('23:00', '06:30')).toBe(false)
    })

    it('con una hora inválida no dice que sí', () => {
      expect(isEndAfterStart('', '23:00')).toBe(false)
      expect(isEndAfterStart('06:30', '25:00')).toBe(false)
    })
  })

  describe('calculateEndTime', () => {
    it('hora + duración', () => {
      expect(calculateEndTime('08:00', 40)).toBe('08:40')
      expect(calculateEndTime('22:30', 45)).toBe('23:15')
    })

    it('no cruza medianoche: se queda pegado al final del día', () => {
      expect(calculateEndTime('23:30', 120)).toBe('23:59')
    })
  })

  describe('formatear duraciones', () => {
    it('corta, la del render', () => {
      expect(formatDurationFromMinutes(45)).toBe('45m')
      expect(formatDurationFromMinutes(150)).toBe('2h 30')
      expect(formatDurationFromMinutes(120)).toBe('2h')
      expect(formatDurationFromMinutes(0)).toBe('0m')
    })

    it('larga, la de la tarjeta del catálogo (criterio 6)', () => {
      expect(formatDurationMinutes(40)).toBe('40 min')
      expect(formatDurationMinutes(60)).toBe('1 h')
      expect(formatDurationMinutes(150)).toBe('2 h 30 min')
    })
  })

  it('la hora se lee sin cero a la izquierda, como en los renders', () => {
    expect(formatTimeForDisplay('08:00')).toBe('8:00')
    expect(formatTimeForDisplay('23:00')).toBe('23:00')
    expect(formatTimeForDisplay('06:30:00')).toBe('6:30')
  })

  it('las constantes son las que mandan las decisiones del dossier', () => {
    expect(DURATION_PILLS).toEqual([15, 30, 45, 60])
    expect(DEFAULT_BLOCK_MINUTES).toBe(30)
    expect(MIN_GAP_MINUTES).toBe(15)
    expect(VIDA_DAY_START_FALLBACK).toBe('06:30')
    expect(VIDA_DAY_END_FALLBACK).toBe('23:00')
  })
})
