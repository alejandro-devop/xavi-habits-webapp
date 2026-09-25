import { describe, expect, it } from 'vitest'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_MIN_AWAKE_MINUTES,
  VIDA_NIGHT_SAME_TIME_ERROR,
  VIDA_REAL_START_NOTE,
  resolveRealDayStart,
  crossesMidnight,
  describeLoggedNightKind,
  describeNightBandLog,
  describeNightSpan,
  isSameNightTime,
  nightEndedByNow,
  nightLogDurationMinutes,
  nightLogState,
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

/**
 * **Lo real encima de lo planeado** (tajada 3). Aquí vive la regla de los tres
 * estados del criterio 296, que es la que no puede decir cosas distintas en la
 * franja, en la hoja y en la revisión.
 */
describe('lo que dormiste de verdad', () => {
  const PLANNED = { bedTime: '23:00', wakeTime: '05:00', days: ['tuesday'] as VidaDayOfWeek[] }

  it('los tres estados salen del dato, no de una bandera (criterio 296)', () => {
    expect(nightLogState(null)).toBe('unconfirmed')
    expect(nightLogState({ bedTime: '23:20', wakeTime: '05:40', confirmedAt: 'x' })).toBe(
      'confirmed',
    )
    expect(nightLogState({ bedTime: null, wakeTime: '05:40', confirmedAt: 'x' })).toBe('no-data')
    expect(nightLogState({ bedTime: '23:20', wakeTime: null, confirmedAt: 'x' })).toBe('no-data')
    expect(nightLogState({ bedTime: null, wakeTime: null, confirmedAt: 'x' })).toBe('no-data')
  })

  it('sin las dos horas no hay duración: null, nunca 0 (criterios 305 y 317)', () => {
    expect(nightLogDurationMinutes({ bedTime: '23:20', wakeTime: '05:40', confirmedAt: 'x' })).toBe(
      380,
    )
    expect(nightLogDurationMinutes({ bedTime: null, wakeTime: '05:40', confirmedAt: 'x' })).toBeNull()
    expect(nightLogDurationMinutes(null)).toBeNull()
  })

  // Criterio 297, con las palabras del render: «Dormiste 1:00 → 6:40» /
  // «5 h 40 · 20 min menos que tu noche · confirmado».
  it('confirmado dice lo real, la duración, la diferencia y la palabra', () => {
    const dicho = describeNightBandLog(PLANNED, {
      bedTime: '01:00',
      wakeTime: '06:40',
      confirmedAt: 'x',
    })

    expect(dicho.state).toBe('confirmed')
    expect(dicho.label).toBe('Dormiste 1:00 → 6:40')
    expect(dicho.detail).toBe('5 h 40 · 20 min menos que tu noche · confirmado')
  })

  it('dormir más que lo planeado se cuenta igual, sin premio ni reproche', () => {
    const dicho = describeNightBandLog(PLANNED, {
      bedTime: '23:20',
      wakeTime: '05:40',
      confirmedAt: 'x',
    })

    expect(dicho.label).toBe('Dormiste 23:20 → 5:40')
    expect(dicho.detail).toBe('6 h 20 · 20 min más que tu noche · confirmado')
  })

  // **Adaptada en la tajada 4, no aflojada.** Lo que afirmaba —que sin
  // contestar no se afirma nada de lo que pasó y se lee «sin confirmar»— se
  // sigue afirmando; lo que cambia es **con qué palabras**, y las nuevas son
  // las del criterio 302: «tu noche dice 23:00 → 5:00 · sin confirmar». La
  // tajada 3 dejó escrito que ese cambio de etiqueta le tocaba a ésta.
  it('sin contestar la franja dice lo que dice tu noche, «sin confirmar» (295 y 302)', () => {
    const dicho = describeNightBandLog(PLANNED, null)

    expect(dicho.state).toBe('unconfirmed')
    expect(dicho.label).toBe('Tu noche dice 23:00 → 5:00')
    expect(dicho.detail).toBe('6 h · sin confirmar')
    // Y no afirma en pasado: ni «dormiste», ni «vienes de anoche» (302).
    expect(`${dicho.label} ${dicho.detail}`.toLowerCase()).not.toContain('dormiste')
  })

  it('una hora que no se sabe queda «sin dato» y no se rellena (303 y 305)', () => {
    expect(describeNightBandLog(PLANNED, { bedTime: null, wakeTime: '06:40', confirmedAt: 'x' })).toEqual(
      {
        state: 'no-data',
        label: 'Te levantaste a las 6:40',
        detail: 'A qué hora te acostaste, sin dato',
      },
    )
    expect(describeNightBandLog(PLANNED, { bedTime: '23:20', wakeTime: null, confirmedAt: 'x' })).toEqual(
      {
        state: 'no-data',
        label: 'Te acostaste a las 23:20',
        detail: 'A qué hora te levantaste, sin dato',
      },
    )
  })

  it('«la noche del martes al miércoles», y solo si cruzó (criterio 291)', () => {
    expect(describeNightSpan(WEDNESDAY, true)).toBe('Noche del martes al miércoles')
    expect(describeNightSpan(WEDNESDAY, false)).toBe('Noche del miércoles')
  })

  // Criterio 293: el usuario no hace ninguna cuenta.
  it('dice si la noche registrada cruzó la medianoche o no', () => {
    expect(describeLoggedNightKind('01:00', '06:40', WEDNESDAY)).toBe(
      'Esta noche no cruzó la medianoche: empezó y acabó el miércoles.',
    )
    expect(describeLoggedNightKind('23:20', '05:40', WEDNESDAY)).toBe(
      'Esta noche cruzó la medianoche: empezó el martes y acabó el miércoles.',
    )
    expect(describeLoggedNightKind(null, '05:40', WEDNESDAY)).toBeNull()
  })

  // Criterio 316, sobre todo lo que esta tajada estrena en texto.
  it('ni una palabra de reproche en lo que dice de tu sueño', () => {
    const textos = [
      describeNightBandLog(PLANNED, { bedTime: '02:00', wakeTime: '05:00', confirmedAt: 'x' }),
      describeNightBandLog(PLANNED, null),
      describeNightBandLog(PLANNED, { bedTime: null, wakeTime: '05:00', confirmedAt: 'x' }),
    ]
      .map((dicho) => `${dicho.label ?? ''} ${dicho.detail ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const palabra of ['poco', 'mal', 'deberías', 'apenas', 'desperdicio', 'tarde', 'por qué']) {
      expect(textos).not.toContain(palabra)
    }
  })
})

/**
 * **El suelo de la pregunta de la mañana** (hallazgo 1 del revisor de la tajada
 * 3). A las 3:00 la noche de `23:00 → 5:00` todavía está pasando, y un toque
 * habría guardado una hora de levantarse que no ha ocurrido.
 */
describe('cuándo ha terminado la noche', () => {
  const CRUZA = { bedTime: '23:00', wakeTime: '05:00', days: ['thursday'] as VidaDayOfWeek[] }
  const DENTRO = { bedTime: '01:00', wakeTime: '06:40', days: ['friday'] as VidaDayOfWeek[] }

  it('una noche que cruza no ha terminado hasta su hora de levantarse', () => {
    expect(nightEndedByNow(CRUZA, 3 * 60)).toBe(false)
    expect(nightEndedByNow(CRUZA, 4 * 60 + 59)).toBe(false)
    expect(nightEndedByNow(CRUZA, 5 * 60)).toBe(true)
    expect(nightEndedByNow(CRUZA, 9 * 60 + 24)).toBe(true)
  })

  // El borde: **no** se compara contra la hora de acostarse ni se suman 24 h.
  // La noche que acaba en este día acaba a su `wakeTime` en el reloj de este
  // día, cruce o no cruce — y con `1:00 → 6:40` las 2:00 siguen siendo noche.
  it('una noche que no cruza se mide igual, sin ningún caso aparte', () => {
    expect(nightEndedByNow(DENTRO, 2 * 60)).toBe(false)
    expect(nightEndedByNow(DENTRO, 6 * 60 + 39)).toBe(false)
    expect(nightEndedByNow(DENTRO, 6 * 60 + 40)).toBe(true)
  })

  it('sin reloj —un día que no es hoy— la noche ya terminó', () => {
    expect(nightEndedByNow(CRUZA, null)).toBe(true)
  })

  // Y lo que se ve entre medias: ni un hueco vacío ni un reproche.
  it('mientras pasa, la franja dice que aún no ha terminado (no «sin confirmar»)', () => {
    const enCurso = describeNightBandLog(CRUZA, null, { stillRunning: true })
    expect(enCurso.state).toBe('unconfirmed')
    expect(enCurso.label).toBeNull()
    expect(enCurso.detail).toBe('aún no ha terminado')

    // Y cuando termina sin contestar, la palabra del criterio 295 —ahora con
    // la etiqueta del 302 delante, que es de la tajada 4.
    expect(describeNightBandLog(CRUZA, null).detail).toBe('6 h · sin confirmar')
    expect(describeNightBandLog(CRUZA, null).label).toBe('Tu noche dice 23:00 → 5:00')
  })

  it('una noche ya contestada no cambia por estar en curso', () => {
    const log = { bedTime: '23:00', wakeTime: '05:00', confirmedAt: 'x' }
    expect(describeNightBandLog(CRUZA, log, { stillRunning: true })).toEqual(
      describeNightBandLog(CRUZA, log),
    )
  })
})

/**
 * **Las dos horas iguales** (criterio 263), que es del cliente y de nadie más.
 * La regla vive aquí para que Ajustes y la hoja de «¿Cómo dormiste?» rechacen
 * lo mismo: dos varas para el mismo dato es como se acaba guardando en un sitio
 * lo que el otro no admite (hallazgo 2 del revisor de la tajada 3).
 */
describe('una noche de cero minutos no es una noche', () => {
  it('las dos horas iguales se reconocen', () => {
    expect(isSameNightTime('23:00', '23:00')).toBe(true)
    expect(isSameNightTime('05:00', '05:00')).toBe(true)
    expect(isSameNightTime('23:00', '05:00')).toBe(false)
    // `5:00` sin el cero delante **no es `HH:mm`** y se cae por inválido, no
    // por distinto: los dos campos de hora del módulo escriben dos dígitos.
    expect(isSameNightTime('5:00', '05:00')).toBe(false)
  })

  it('lo que falta o no vale no es «la misma hora»: es otro problema', () => {
    expect(isSameNightTime(null, '05:00')).toBe(false)
    expect(isSameNightTime('23:00', null)).toBe(false)
    expect(isSameNightTime('lunes', 'lunes')).toBe(false)
  })

  it('el mensaje es uno solo y dice por qué', () => {
    expect(VIDA_NIGHT_SAME_TIME_ERROR).toContain('no pueden ser la misma')
    // Y encaja con la aritmética que ya existía: esa noche no tiene duración.
    expect(nightDurationMinutes('23:00', '23:00')).toBeNull()
  })
})

/**
 * **Lo real manda, y lo que no cabe se dice** (tajada 4, criterios 300 a 305).
 *
 * El hueco que cierra la última prueba lo dejó avisado el revisor de la tajada
 * 3: una hora de levantarse **posterior** al final del día dejaría una ventana
 * negativa o de cero minutos, sin huecos y sin presupuesto.
 */
describe('la hora real de levantarse y la ventana del día', () => {
  const log = (wakeTime: string | null) => ({ bedTime: '23:00', wakeTime, confirmedAt: 'x' })

  it('sin respuesta manda lo planeado, y se dice que nadie ha contestado (302)', () => {
    expect(resolveRealDayStart(null, '23:00')).toEqual({
      startTime: null,
      reason: 'unconfirmed',
    })
    // Y no hay nada que aclarar en la línea del día: lo dice la franja.
    expect(VIDA_REAL_START_NOTE.unconfirmed).toBeNull()
  })

  it('con la hora real, manda la hora real (300)', () => {
    expect(resolveRealDayStart(log('06:40'), '23:00')).toEqual({
      startTime: '06:40',
      reason: 'real',
    })
    expect(VIDA_REAL_START_NOTE.real).toBeNull()
  })

  it('sin dato cae a lo planeado **y lo dice** (303 y 304)', () => {
    expect(resolveRealDayStart(log(null), '23:00')).toEqual({
      startTime: null,
      reason: 'no-data',
    })
    expect(VIDA_REAL_START_NOTE['no-data']).toContain('lo planeado')
    // Y no se inventa ninguna duración con media noche (305).
    expect(nightLogDurationMinutes(log(null))).toBeNull()
    expect(formatNightDuration(nightLogDurationMinutes(log(null)))).toBe('—')
  })

  it('una hora que no deja día se trata como sin dato, y se dice', () => {
    // El borde exacto: con el día acabando a las 23:00, la última hora de
    // levantarse utilizable es 22:30 — ni un minuto más tarde.
    expect(resolveRealDayStart(log('22:30'), '23:00').reason).toBe('real')
    expect(resolveRealDayStart(log('22:31'), '23:00')).toEqual({
      startTime: null,
      reason: 'out-of-window',
    })
    expect(VIDA_REAL_START_NOTE['out-of-window']).toContain('lo planeado')
    expect(VIDA_MIN_AWAKE_MINUTES).toBe(30)
  })

  it('la noche degenerada del revisor (23:00 → 23:30) no deja la ventana del revés', () => {
    // Levantarse a las 23:30 con el día acabando a las 23:00: la hora real
    // **no se recorta** ni se da por buena; se dice que no se sabe.
    const resuelto = resolveRealDayStart(
      { bedTime: '23:00', wakeTime: '23:30', confirmedAt: 'x' },
      '23:00',
    )
    expect(resuelto.startTime).toBeNull()
    expect(resuelto.reason).toBe('out-of-window')
  })
})
