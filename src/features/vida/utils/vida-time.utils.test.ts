import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BLOCK_MINUTES,
  DURATION_PILLS,
  MAX_DURATION_MINUTES,
  MIN_LOG_MINUTES,
  MIN_PLANNING_MINUTES,
  VIDA_DAY_END_FALLBACK,
  VIDA_DAY_START_FALLBACK,
  calculateEndTime,
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  isEndAfterStart,
  isValidHhMm,
  joinDurationMinutes,
  minutesToTime,
  normalizeTimeForApi,
  normalizeTimeForDisplay,
  parseTimeToMinutes,
  resolveEndTime,
  splitDurationMinutes,
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
    // **Dos umbrales, dos trabajos** (FEAT-014, criterio 400): planear tiene
    // suelo —la píldora más pequeña— y contar no lo tiene más allá de lo que
    // vale la pena ofrecer.
    expect(MIN_PLANNING_MINUTES).toBe(15)
    expect(MIN_LOG_MINUTES).toBe(5)
    expect(MIN_LOG_MINUTES).toBeLessThan(MIN_PLANNING_MINUTES)
    expect(VIDA_DAY_START_FALLBACK).toBe('06:30')
    expect(VIDA_DAY_END_FALLBACK).toBe('23:00')
  })
})

describe('horas y minutos (FEAT-008, tajada 1)', () => {
  it('reparte lo guardado, y sin duración no inventa un cero (criterio 109)', () => {
    expect(splitDurationMinutes(95)).toEqual({ hours: 1, minutes: 35 })
    expect(splitDurationMinutes(45)).toEqual({ hours: 0, minutes: 45 })
    expect(splitDurationMinutes(60)).toEqual({ hours: 1, minutes: 0 })
    expect(splitDurationMinutes(null)).toEqual({ hours: null, minutes: null })
    expect(splitDurationMinutes(0)).toEqual({ hours: null, minutes: null })
  })

  it('junta lo escrito en los minutos que viajan al API (criterio 110)', () => {
    expect(joinDurationMinutes(1, 35)).toBe(95)
    expect(joinDurationMinutes(0, 45)).toBe(45)
    expect(joinDurationMinutes(1, null)).toBe(60)
  })

  it('escribir solo minutos funciona: 90 es 90, no 90 h (criterio 112)', () => {
    expect(joinDurationMinutes(null, 90)).toBe(90)
    // Y lo que se enseña al salir del campo es el mismo dato, repartido.
    expect(splitDurationMinutes(90)).toEqual({ hours: 1, minutes: 30 })
    expect(splitDurationMinutes(300)).toEqual({ hours: 5, minutes: 0 })
  })

  it('vacío es vacío y cero no existe (criterio 111)', () => {
    expect(joinDurationMinutes(null, null)).toBeNull()
    expect(joinDurationMinutes(0, 0)).toBeNull()
  })

  it('nada imposible se cuela: el tope es 23 h 59 min (criterio 113)', () => {
    expect(MAX_DURATION_MINUTES).toBe(1439)
    expect(joinDurationMinutes(99, 0)).toBe(1439)
    expect(joinDurationMinutes(24, 0)).toBe(1439)
    expect(joinDurationMinutes(23, 59)).toBe(1439)
    expect(splitDurationMinutes(MAX_DURATION_MINUTES)).toEqual({ hours: 23, minutes: 59 })
  })

  it('ida y vuelta: lo que entra es lo que sale (criterio 110)', () => {
    for (const total of [1, 15, 45, 60, 95, 120, 300, 1439]) {
      const { hours, minutes } = splitDurationMinutes(total)
      expect(joinDurationMinutes(hours, minutes)).toBe(total)
    }
  })
})

/* ── La hora de fin, con sus dos lecturas (FEAT-008, tajada 2) ─────────────── */

describe('resolveEndTime (criterios 123, 125, 126)', () => {
  it('dentro del día, las dos lecturas coinciden', () => {
    expect(resolveEndTime('19:00', 80)).toEqual({
      endMinutes: 19 * 60 + 80,
      endTime: '20:20',
      crossesMidnight: false,
      cappedEndTime: '20:20',
    })
  })

  it('cruzando medianoche, el reloj da la vuelta y el dato se recorta', () => {
    expect(resolveEndTime('23:30', 80)).toEqual({
      endMinutes: 23 * 60 + 30 + 80,
      endTime: '00:50',
      crossesMidnight: true,
      cappedEndTime: '23:59',
    })
  })

  it('justo en medianoche ya cuenta como del día siguiente', () => {
    expect(resolveEndTime('23:00', 60)).toMatchObject({
      endTime: '00:00',
      crossesMidnight: true,
      cappedEndTime: '23:59',
    })
    expect(resolveEndTime('23:00', 59)).toMatchObject({
      endTime: '23:59',
      crossesMidnight: false,
      cappedEndTime: '23:59',
    })
  })

  it('una duración negativa no resta: cuenta como cero', () => {
    expect(resolveEndTime('08:00', -30)).toMatchObject({ endTime: '08:00', cappedEndTime: '08:00' })
  })

  it('`calculateEndTime` es exactamente `cappedEndTime` (criterio 126)', () => {
    // La prueba de que delegar no cambió nada: la vieja y la nueva dicen lo
    // mismo para todo, incluido lo que se pasa de medianoche y viaja al API.
    for (const start of ['00:00', '06:30', '08:00', '19:00', '23:00', '23:30', '23:59']) {
      for (const duration of [0, 1, 15, 45, 60, 95, 120, 300, 1439]) {
        expect(calculateEndTime(start, duration)).toBe(
          resolveEndTime(start, duration).cappedEndTime,
        )
      }
    }
  })
})
