import { describe, expect, it } from 'vitest'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  crossesMidnight,
  describeDiffToPlanned,
  describeNightDays,
  describeNightKind,
  diffToPlannedMinutes,
  formatNightDuration,
  nightDurationMinutes,
  nightBandsForWeekday,
  nightEndingOn,
  nightStartingOn,
  nightWindowForDate,
  normalizeNightDays,
} from './vida-night.utils'

// 2026-09-22 es martes; 2026-09-23, miércoles; 2026-09-21, lunes.
const TUESDAY = '2026-09-22'
const WEDNESDAY = '2026-09-23'
const MONDAY = '2026-09-21'

function night(bedTime: string, wakeTime: string, days: VidaDayOfWeek[]) {
  return { bedTime, wakeTime, days }
}

describe('crossesMidnight (criterios 261, 276)', () => {
  it('23:00 → 5:00 cruza la medianoche', () => {
    expect(crossesMidnight(night('23:00', '05:00', ['tuesday']))).toBe(true)
  })

  it('1:00 → 6:40 NO cruza la medianoche: empieza y acaba el mismo día', () => {
    expect(crossesMidnight(night('01:00', '06:40', ['tuesday']))).toBe(false)
  })
})

describe('nightDurationMinutes (criterios 261, 305)', () => {
  it('23:00 → 5:00 son 6 h', () => {
    expect(nightDurationMinutes('23:00', '05:00')).toBe(360)
    expect(formatNightDuration(360)).toBe('6 h')
  })

  it('1:00 → 6:40 son 5 h 40', () => {
    expect(nightDurationMinutes('01:00', '06:40')).toBe(340)
    expect(formatNightDuration(340)).toBe('5 h 40')
  })

  // Criterio 305: sin dato no hay cifra, y desde luego no «0 h».
  it('falta una hora → null, y se lee «—», nunca 0 h', () => {
    expect(nightDurationMinutes(null, '05:00')).toBeNull()
    expect(nightDurationMinutes('23:00', null)).toBeNull()
    expect(nightDurationMinutes('basura', '05:00')).toBeNull()
    expect(formatNightDuration(null)).toBe('—')
  })

  // Criterio 263 visto desde la aritmética: una noche de cero minutos no es una
  // noche, así que tampoco produce una duración.
  it('las dos horas iguales → null', () => {
    expect(nightDurationMinutes('23:00', '23:00')).toBeNull()
  })
})

describe('describeNightKind (criterio 261)', () => {
  it('con 23:00 / 5:00 marcado el martes nombra el martes y el miércoles', () => {
    expect(describeNightKind(night('23:00', '05:00', ['tuesday']))).toBe(
      'Cruza la medianoche, y eso está bien: la noche del martes es la madrugada del miércoles.',
    )
  })

  it('con 1:00 / 6:40 dice que no cruza', () => {
    expect(describeNightKind(night('01:00', '06:40', ['tuesday']))).toBe(
      'Esta noche no cruza la medianoche: empieza y acaba el mismo día.',
    )
  })

  it('el domingo envuelve al lunes', () => {
    expect(describeNightKind(night('23:00', '05:00', ['sunday']))).toContain(
      'la noche del domingo es la madrugada del lunes',
    )
  })
})

describe('a qué día pertenece la noche (criterios 271, 275, 276)', () => {
  const crossing = night('23:00', '05:00', ['tuesday'])

  it('la noche del martes que cruza se acuesta el martes y se levanta el miércoles', () => {
    expect(nightStartingOn(crossing, TUESDAY)).toBe(crossing)
    expect(nightEndingOn(crossing, WEDNESDAY)).toBe(crossing)
  })

  it('el martes no viene de ninguna noche, y el miércoles no se acuesta', () => {
    expect(nightEndingOn(crossing, TUESDAY)).toBeNull()
    expect(nightStartingOn(crossing, WEDNESDAY)).toBeNull()
  })

  // Criterio 275: un día no marcado no pinta nada, ni arriba ni abajo.
  it('un día sin noche marcada no tiene ni franja de arriba ni de abajo', () => {
    expect(nightStartingOn(crossing, MONDAY)).toBeNull()
    expect(nightEndingOn(crossing, MONDAY)).toBeNull()
  })

  // Criterio 276: la que no cruza se pinta arriba de SU MISMO día.
  it('una noche que no cruza empieza y acaba el mismo día', () => {
    const inside = night('01:00', '06:40', ['tuesday'])
    expect(nightEndingOn(inside, TUESDAY)).toBe(inside)
    expect(nightEndingOn(inside, WEDNESDAY)).toBeNull()
  })

  it('sin noche, nada', () => {
    expect(nightStartingOn(null, TUESDAY)).toBeNull()
    expect(nightEndingOn(null, TUESDAY)).toBeNull()
  })
})

describe('nightBandsForWeekday (criterios 271, 275, 276)', () => {
  it('la noche que cruza pinta arriba en el día de después y abajo en el de antes', () => {
    const crossing = night('23:00', '05:00', ['tuesday'])
    expect(nightBandsForWeekday(crossing, 'tuesday')).toEqual({ dawn: null, dusk: crossing })
    expect(nightBandsForWeekday(crossing, 'wednesday')).toEqual({ dawn: crossing, dusk: null })
    expect(nightBandsForWeekday(crossing, 'monday')).toEqual({ dawn: null, dusk: null })
  })

  // Criterio 276: abajo **no hay nada que anunciar**.
  it('la noche que no cruza pinta solo arriba, en su propio día', () => {
    const inside = night('01:00', '06:40', ['tuesday'])
    expect(nightBandsForWeekday(inside, 'tuesday')).toEqual({ dawn: inside, dusk: null })
    expect(nightBandsForWeekday(inside, 'wednesday')).toEqual({ dawn: null, dusk: null })
  })

  it('sin noche, ninguna franja', () => {
    expect(nightBandsForWeekday(null, 'tuesday')).toEqual({ dawn: null, dusk: null })
  })
})

describe('nightWindowForDate (criterios 279, 283 — la usa la tajada 2)', () => {
  it('con 23:00 → 5:00 los martes, el miércoles abre a las 5:00 y no cierra', () => {
    const crossing = night('23:00', '05:00', ['tuesday'])
    expect(nightWindowForDate(crossing, WEDNESDAY)).toEqual({ startTime: '05:00', endTime: null })
    expect(nightWindowForDate(crossing, TUESDAY)).toEqual({ startTime: null, endTime: '23:00' })
  })

  // Criterio 283: una noche que no cruza NO cierra la tarde.
  it('una noche que no cruza abre la mañana y no cierra la tarde', () => {
    const inside = night('01:00', '06:40', ['tuesday'])
    expect(nightWindowForDate(inside, TUESDAY)).toEqual({ startTime: '06:40', endTime: null })
  })

  it('sin noche, los dos bordes son null', () => {
    expect(nightWindowForDate(null, TUESDAY)).toEqual({ startTime: null, endTime: null })
  })
})

describe('la diferencia con lo planeado (criterios 292, 297, 316)', () => {
  it('se dice en minutos y dirección, sin juicio', () => {
    expect(diffToPlannedMinutes(340, 360)).toBe(-20)
    expect(describeDiffToPlanned(-20)).toBe('20 min menos que tu noche')
    expect(describeDiffToPlanned(20)).toBe('20 min más que tu noche')
    expect(describeDiffToPlanned(0)).toBe('Igual que tu noche')
  })

  it('sin dato no se inventa ninguna diferencia', () => {
    expect(diffToPlannedMinutes(null, 360)).toBeNull()
    expect(describeDiffToPlanned(null)).toBeNull()
  })
})

describe('los días', () => {
  it('lo que no es un día conocido se cae', () => {
    expect(normalizeNightDays(['tuesday', 'martes', 'friday'])).toEqual(['tuesday', 'friday'])
    expect(normalizeNightDays(null)).toEqual([])
  })

  it('se leen en palabras', () => {
    expect(describeNightDays([])).toBe('Ninguna noche marcada')
    expect(describeNightDays([...(['monday', 'tuesday'] as VidaDayOfWeek[])])).toBe(
      'Las noches del lunes y del martes',
    )
    expect(describeNightDays(['friday'])).toBe('La noche del viernes')
  })
})
