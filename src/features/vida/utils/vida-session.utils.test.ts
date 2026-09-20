import { describe, expect, it } from 'vitest'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  VIDA_UNKNOWN_SESSION_MINUTES,
  closeSessionInput,
  describeOverPlan,
  elapsedMinutes,
  followUpStartInstant,
  formatElapsedCompact,
  formatElapsedHHMMSS,
  isSessionFromAnotherDay,
  minutesUntilEndTime,
  resolveUnknownEndMinutes,
  sessionStartInstant,
  startSessionInput,
  translateSessionError,
} from '@/features/vida/utils/vida-session.utils'

function session(overrides: Partial<ActivityFollowUp> = {}): ActivityFollowUp {
  return {
    id: 'f1',
    activityId: 'a1',
    date: '2026-09-18',
    startTime: '09:00',
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    ...overrides,
  }
}

describe('sessionStartInstant — el instante en que empezó (criterio 3)', () => {
  it('junta la fecha local y la hora', () => {
    const instant = sessionStartInstant('2026-09-18', '09:05')
    expect(instant).toEqual(new Date(2026, 8, 18, 9, 5, 0, 0))
  })

  it('admite el `HH:mm:ss` que a veces devuelve el API', () => {
    expect(sessionStartInstant('2026-09-18', '09:05:00')).toEqual(new Date(2026, 8, 18, 9, 5, 0, 0))
  })

  it('una fecha que no se entiende da `null`, no «ahora»', () => {
    // `79bece0` devolvía `new Date().toISOString()` aquí. Una fecha rota que se
    // hace pasar por el presente es peor que un `null`: el cronómetro marcaría
    // 00:00:00 como si acabara de empezar.
    expect(sessionStartInstant('ayer', '09:00')).toBeNull()
    expect(sessionStartInstant('', '09:00')).toBeNull()
  })
})

describe('elapsedMinutes — lo que se le manda al API al cerrar (criterio 5)', () => {
  it('redondea a minutos', () => {
    const start = new Date(2026, 8, 18, 9, 0, 0)
    expect(elapsedMinutes(start, new Date(2026, 8, 18, 9, 52, 20))).toBe(52)
    expect(elapsedMinutes(start, new Date(2026, 8, 18, 9, 52, 40))).toBe(53)
  })

  it('nunca baja de 1: el API rechaza menos', () => {
    const start = new Date(2026, 8, 18, 9, 0, 0)
    expect(elapsedMinutes(start, new Date(2026, 8, 18, 9, 0, 5))).toBe(1)
    expect(elapsedMinutes(start, new Date(2026, 8, 18, 8, 59, 0))).toBe(1)
  })

  it('criterio 63 — de 23:50 a las 00:10 del día siguiente son 20 minutos, no −1420', () => {
    const start = sessionStartInstant('2026-09-18', '23:50')!
    const end = new Date(2026, 8, 19, 0, 10, 0)
    expect(elapsedMinutes(start, end)).toBe(20)
  })
})

describe('closeSessionInput — cerrar a esta hora (criterios 5 y 63)', () => {
  it('manda el id y los minutos entre instantes', () => {
    expect(closeSessionInput(session(), new Date(2026, 8, 18, 9, 45, 0))).toEqual({
      id: 'f1',
      durationMinutes: 45,
    })
  })

  it('la que cruzó medianoche se cierra con su duración real y **no** cambia de día', () => {
    const input = closeSessionInput(
      session({ date: '2026-09-18', startTime: '23:50' }),
      new Date(2026, 8, 19, 0, 10, 0),
    )
    // `activityFollowUpEdit` no toca `date`: la sesión sigue siendo del día 18,
    // que es donde empezó, y el servidor calcula el `endDate` del 19.
    expect(input).toEqual({ id: 'f1', durationMinutes: 20 })
    expect(input).not.toHaveProperty('date')
  })

  it('sin instante de inicio no adivina: un minuto', () => {
    expect(closeSessionInput(session({ date: 'roto' }), new Date())).toEqual({
      id: 'f1',
      durationMinutes: 1,
    })
  })
})

describe('startSessionInput — la hora es la del reloj (criterio 17)', () => {
  it('empezar a las 9:05 un bloque de las 9:00 registra 9:05', () => {
    expect(startSessionInput('a1', new Date(2026, 8, 18, 9, 5, 0))).toEqual({
      activityId: 'a1',
      date: '2026-09-18',
      startTime: '09:05',
    })
  })

  it('la fecha es la **local**: a las 23:50 sigue siendo ese día', () => {
    expect(startSessionInput('a1', new Date(2026, 8, 18, 23, 50, 0)).date).toBe('2026-09-18')
  })
})

describe('isSessionFromAnotherDay (criterios 16 y 54)', () => {
  it('la de ayer sí; la de hoy no', () => {
    expect(isSessionFromAnotherDay(session({ date: '2026-09-17' }), '2026-09-18')).toBe(true)
    expect(isSessionFromAnotherDay(session({ date: '2026-09-18' }), '2026-09-18')).toBe(false)
    expect(isSessionFromAnotherDay(null, '2026-09-18')).toBe(false)
  })
})

describe('los formatos del cronómetro', () => {
  it('HH:MM:SS, rescatado de `79bece0`', () => {
    expect(formatElapsedHHMMSS(0)).toBe('00:00:00')
    expect(formatElapsedHHMMSS(24 * 60 * 1000 + 11_000)).toBe('00:24:11')
    expect(formatElapsedHHMMSS(3 * 3600_000 + 5 * 60_000 + 9000)).toBe('03:05:09')
    // Nunca negativo: un reloj que se mueve hacia atrás marca cero.
    expect(formatElapsedHHMMSS(-5000)).toBe('00:00:00')
  })

  it('compacto', () => {
    expect(formatElapsedCompact(0)).toBe('0m')
    expect(formatElapsedCompact(45 * 60_000)).toBe('45m')
    expect(formatElapsedCompact(60 * 60_000)).toBe('1h')
    expect(formatElapsedCompact(84 * 60_000)).toBe('1h 24m')
  })
})

describe('describeOverPlan — pasarse del plan, sin reproche (criterio 9)', () => {
  it('lo dice con los dos números', () => {
    expect(describeOverPlan(52, 45)).toBe('llevas 52 min · planeado 45')
  })

  it('dentro del plan no dice nada, y sin plan tampoco', () => {
    expect(describeOverPlan(30, 45)).toBeNull()
    expect(describeOverPlan(45, 45)).toBeNull()
    expect(describeOverPlan(52, null)).toBeNull()
    expect(describeOverPlan(52, 0)).toBeNull()
  })

  it('no usa ninguna palabra de culpa (criterio 59)', () => {
    const texto = describeOverPlan(120, 45) ?? ''
    for (const prohibida of [/desperdici/i, /perdi/i, /fallaste/i, /vacío/i, /cancel/i]) {
      expect(texto).not.toMatch(prohibida)
    }
  })
})

describe('resolveUnknownEndMinutes — lo que registra el «No sé» (criterio 16)', () => {
  it('con duración planeada, esa: es un número que escribió el propio usuario', () => {
    expect(
      resolveUnknownEndMinutes({ startTime: '21:00', plannedMinutes: 45, dayEndTime: '23:00' }),
    ).toEqual({ minutes: 45, reason: 'planned', clamped: false })
  })

  it('sin bloque planeado —o con varios candidatos— caen los 30 minutos', () => {
    expect(
      resolveUnknownEndMinutes({ startTime: '21:00', plannedMinutes: null, dayEndTime: '23:00' }),
    ).toEqual({ minutes: VIDA_UNKNOWN_SESSION_MINUTES, reason: 'default', clamped: false })
    expect(VIDA_UNKNOWN_SESSION_MINUTES).toBe(30)
  })

  it('**nunca hasta el fin del día**: una sesión de las 9:00 no anota catorce horas', () => {
    const result = resolveUnknownEndMinutes({
      startTime: '09:00',
      plannedMinutes: null,
      dayEndTime: '23:00',
    })
    expect(result.minutes).toBe(30)
    // Hasta el fin del día habrían sido 840 minutos que nadie vivió.
    expect(result.minutes).toBeLessThan(840)
  })

  it('se recorta para no pasarse del fin de aquel día, y lo dice', () => {
    expect(
      resolveUnknownEndMinutes({ startTime: '22:45', plannedMinutes: 60, dayEndTime: '23:00' }),
    ).toEqual({ minutes: 15, reason: 'planned', clamped: true })
  })

  it('una sesión empezada después del fin del día no se recorta a cero', () => {
    expect(
      resolveUnknownEndMinutes({ startTime: '23:30', plannedMinutes: null, dayEndTime: '23:00' }),
    ).toEqual({ minutes: 30, reason: 'default', clamped: false })
  })
})

describe('minutesUntilEndTime — la hora que se escribe a mano (criterios 16 y 63)', () => {
  it('cuenta los minutos entre las dos horas', () => {
    expect(minutesUntilEndTime('21:00', '21:40')).toBe(40)
  })

  it('una hora de fin anterior es que cruzó medianoche: nunca negativo', () => {
    expect(minutesUntilEndTime('23:50', '00:10')).toBe(20)
  })

  it('la misma hora se queda en el mínimo del API', () => {
    expect(minutesUntilEndTime('21:00', '21:00')).toBe(1)
  })
})

describe('translateSessionError — el API responde en inglés', () => {
  it('traduce las dos que el servicio lanza de verdad', () => {
    expect(
      translateSessionError(
        new Error('You already have an activity in progress. Finish or cancel it before starting another.'),
        'fallback',
      ),
    ).toBe('Ya tenías algo en marcha. Termínalo y vuelve a empezar.')
    expect(translateSessionError(new Error('Duration must be at least 1 minute'), 'fallback')).toBe(
      'Una sesión dura como mínimo un minuto.',
    )
  })

  it('ninguna traducción usa «cancelar» ni «eliminar» (criterios 14 y 59)', () => {
    const textos = [
      translateSessionError(new Error('You already have an activity in progress.'), 'x'),
      translateSessionError(new Error('Duration must be at least 1 minute'), 'x'),
      translateSessionError(new Error('Follow-up not found'), 'x'),
    ]
    for (const texto of textos) {
      expect(texto).not.toMatch(/cancel/i)
      expect(texto).not.toMatch(/elimin/i)
    }
  })

  it('lo que no conocemos no se enseña en inglés: se dice lo nuestro', () => {
    expect(translateSessionError(new Error('Internal server error'), 'No pudimos guardarlo.')).toBe(
      'No pudimos guardarlo.',
    )
    expect(translateSessionError(undefined, 'No pudimos guardarlo.')).toBe('No pudimos guardarlo.')
  })
})

describe('followUpStartInstant', () => {
  it('sale de `date` + `startTime`, porque `endDateTime` viene `null` mientras está abierta', () => {
    expect(followUpStartInstant(session({ startTime: '09:00:00' }))).toEqual(
      new Date(2026, 8, 18, 9, 0, 0),
    )
    expect(followUpStartInstant(null)).toBeNull()
  })
})
