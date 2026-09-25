import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { useVidaDayWindow, useVidaWeekdayWindow } from '@/features/vida/hooks/useVidaDayWindow'
import { useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import { buildDayAgenda, getDayBudget } from '@/features/vida/utils/vida-agenda.utils'

let settingsQuery: {
  data?: UserSettings
  isPending: boolean
  isError: boolean
  fetchStatus: string
}

vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
}))

function buildSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    userId: 1,
    hideHiddenHabits: false,
    sleepActivityCategoryId: null,
    standupTodoFolderId: null,
    vidaDayStartTime: null,
    vidaDayEndTime: null,
    vidaNightBedTime: null,
    vidaNightWakeTime: null,
    vidaNightDays: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function settled(overrides: Partial<UserSettings> = {}) {
  settingsQuery = {
    data: buildSettings(overrides),
    isPending: false,
    isError: false,
    fetchStatus: 'idle',
  }
}

/** La noche de siempre del expediente: 23:00 → 5:00, todas las noches. */
const EVERY_NIGHT = {
  vidaNightBedTime: '23:00',
  vidaNightWakeTime: '05:00',
  vidaNightDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
}

// 2026-09-23 es **miércoles**; 2026-09-24, jueves.
const WEDNESDAY = '2026-09-23'

/** Un bloque del plan del día, con la forma real de la API. */
function block(id: string, startTime: string, endTime: string): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    date: WEDNESDAY,
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    activity: { id: `a-${id}`, title: `Actividad ${id}`, category: null },
  }
}

beforeEach(() => {
  settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' }
})

describe('useVidaDayWindow', () => {
  // Criterio 280: un día sin noche es **exactamente** el de FEAT-003.
  it('sin noche usa vidaDayStartTime / vidaDayEndTime, tal cual', () => {
    settled({ vidaDayStartTime: '07:00', vidaDayEndTime: '22:00' })
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('07:00')
    expect(result.current.endTime).toBe('22:00')
    expect(result.current.isDefault).toBe(false)
    expect(result.current.startSource).toBe('settings')
    expect(result.current.endSource).toBe('settings')
    expect(result.current.sleepLabel).toBeNull()
    expect(result.current.nightEnding).toBeNull()
    expect(result.current.nightStarting).toBeNull()
  })

  // Criterio 280, su segunda mitad: el respaldo sigue diciéndose respaldo.
  it('sin noche y sin ajustes, el respaldo 06:30 / 23:00 y se dice que lo es', () => {
    settled()
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.isDefault).toBe(true)
    expect(result.current.defaultScheduleNote).toBe('el horario por defecto')
  })

  // Criterio 279: la ventana sale de la noche, y los ajustes NO se borran.
  it('con noche 23:00 → 5:00 el día va de 5:00 a 23:00', () => {
    settled({ ...EVERY_NIGHT, vidaDayStartTime: '06:30', vidaDayEndTime: '22:00' })
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.startSource).toBe('night')
    expect(result.current.endSource).toBe('night')
    // Los ajustes siguen ahí, sin tocar: se leen, no se usan para ese día.
    expect(result.current.saved).toEqual({ startTime: '06:30', endTime: '22:00' })
  })

  // Criterio 277: la línea «Tu día · 5:00 → 23:00 · duermes 6 h».
  it('dice cuánto duermes, y una sola vez aunque haya dos franjas', () => {
    settled(EVERY_NIGHT)
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.sleepLabel).toBe('duermes 6 h')
  })

  // Criterio 283: una noche que no cruza NO cierra la tarde.
  it('con 1:00 → 6:40 el día empieza a las 6:40 y acaba en vidaDayEndTime', () => {
    settled({
      vidaNightBedTime: '01:00',
      vidaNightWakeTime: '06:40',
      vidaNightDays: ['wednesday'],
    })
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('06:40')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.startSource).toBe('night')
    expect(result.current.endSource).toBe('fallback')
    // El respaldo se dice **como respaldo**, y solo del borde que lo es.
    expect(result.current.defaultScheduleNote).toBe('el final es el horario por defecto')
    expect(result.current.isDefault).toBe(true)
    // Y la franja de esa noche va arriba: abajo no hay nada que anunciar.
    expect(result.current.nightEnding).not.toBeNull()
    expect(result.current.nightStarting).toBeNull()
  })

  // Criterio 275/310: un día que la noche no marca no cambia de ventana.
  it('un día sin noche marcada se comporta como antes de la feature', () => {
    settled({
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['monday'],
      vidaDayStartTime: '06:30',
      vidaDayEndTime: '23:00',
    })
    // Miércoles: ni el martes ni el miércoles están marcados.
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.sleepLabel).toBeNull()
  })

  // Criterio 286: nada que luego salte.
  it('con los ajustes en vuelo no hay noche ni franjas', () => {
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.isPending).toBe(true)
    expect(result.current.night).toBeNull()
    expect(result.current.nightEnding).toBeNull()
    expect(result.current.nightStarting).toBeNull()
    expect(result.current.sleepLabel).toBeNull()
  })

  // Criterio 312: con error no se inventa ninguna noche.
  it('con los ajustes caídos no se deriva ninguna ventana de la noche', () => {
    settingsQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle' }
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.isError).toBe(true)
    expect(result.current.night).toBeNull()
    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
  })

  // La guarda 2 del hook: una ventana que no avanza no es una ventana.
  it('una noche que dejaría el día del revés no mueve nada', () => {
    settled({
      // No cruza (01:00 < 23:30), así que solo abriría la mañana… a las 23:30,
      // después del final del día. Eso no es una ventana.
      vidaNightBedTime: '01:00',
      vidaNightWakeTime: '23:30',
      vidaNightDays: ['wednesday'],
      vidaDayStartTime: '06:30',
      vidaDayEndTime: '23:00',
    })
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.nightEnding).toBeNull()
  })

  // Criterio 281: ningún hueco ofrece un rato en el que estabas durmiendo.
  it('con noche 23:00 → 5:00 y un bloque a las 9:00 no hay hueco antes de las 5:00', () => {
    settled(EVERY_NIGHT)
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    const agenda = buildDayAgenda({
      planItems: [block('p1', '09:00', '10:00')],
      dayStart: result.current.startTime,
      dayEnd: result.current.endTime,
      nowMinutes: null,
    })

    // 5:00 son 300 minutos; 23:00, 1380.
    expect(agenda.gaps.length).toBeGreaterThan(0)
    expect(agenda.gaps[0]!.startMinutes).toBe(300)
    expect(agenda.gaps.every((gap) => gap.startMinutes >= 300)).toBe(true)
    expect(agenda.gaps[agenda.gaps.length - 1]!.endMinutes).toBe(1380)
  })

  // Criterios 282 y 284, y la decisión D9 del 2026-09-24: el denominador se
  // encoge con la noche, pero lo **puesto** no cambia ni un minuto.
  it('el presupuesto cuenta hasta la hora de acostarse y dormir no es tiempo puesto', () => {
    const planItems = [block('p1', '09:00', '10:30')]

    settled({ vidaDayStartTime: '00:00', vidaDayEndTime: '23:59' })
    const { result: noNight } = renderHook(() => useVidaDayWindow(WEDNESDAY))
    const agendaWithout = buildDayAgenda({
      planItems,
      dayStart: noNight.current.startTime,
      dayEnd: noNight.current.endTime,
      nowMinutes: null,
    })
    const budgetWithout = getDayBudget({
      agenda: agendaWithout,
      dayEnd: noNight.current.endTime,
      nowMinutes: null,
    })

    settled({ ...EVERY_NIGHT, vidaDayStartTime: '00:00', vidaDayEndTime: '23:59' })
    const { result: withNight } = renderHook(() => useVidaDayWindow(WEDNESDAY))
    const agendaWith = buildDayAgenda({
      planItems,
      dayStart: withNight.current.startTime,
      dayEnd: withNight.current.endTime,
      nowMinutes: null,
    })
    const budgetWith = getDayBudget({
      agenda: agendaWith,
      dayEnd: withNight.current.endTime,
      nowMinutes: null,
    })

    // Lo **puesto** es exactamente lo mismo: la noche no es una entrada de la
    // cuenta y sus minutos no aparecen en ningún tramo (criterio 284).
    expect(budgetWith.plannedMinutes).toBe(budgetWithout.plannedMinutes)
    expect(budgetWith.plannedMinutes).toBe(90)
    // El **denominador** sí baja: 24 h menos la noche (D9).
    expect(budgetWithout.dayMinutes).toBe(1439)
    expect(budgetWith.dayMinutes).toBe(18 * 60)
    expect(budgetWith.freeMinutes).toBe(18 * 60 - 90)
    // Y el «hasta las…» es la hora de acostarse (criterio 282).
    expect(withNight.current.endTime).toBe('23:00')
  })
})

describe('useVidaWeekdayWindow', () => {
  // La plantilla es una semana tipo: no tiene fechas, sí días.
  it('el día que la noche marca se encoge; el que no, no', () => {
    settled({
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      // Marcada el martes: el martes cierra a las 23:00 y el miércoles abre a
      // las 5:00. El jueves no se entera de nada.
      vidaNightDays: ['tuesday'],
      vidaDayStartTime: '06:30',
      vidaDayEndTime: '22:00',
    })

    const tuesday = renderHook(() => useVidaWeekdayWindow('tuesday')).result.current
    expect(tuesday.startTime).toBe('06:30')
    expect(tuesday.endTime).toBe('23:00')
    expect(tuesday.nightStarting).not.toBeNull()
    expect(tuesday.nightEnding).toBeNull()

    const wednesday = renderHook(() => useVidaWeekdayWindow('wednesday')).result.current
    expect(wednesday.startTime).toBe('05:00')
    expect(wednesday.endTime).toBe('22:00')
    expect(wednesday.nightEnding).not.toBeNull()
    expect(wednesday.nightStarting).toBeNull()

    const thursday = renderHook(() => useVidaWeekdayWindow('thursday')).result.current
    expect(thursday.startTime).toBe('06:30')
    expect(thursday.endTime).toBe('22:00')
    expect(thursday.sleepLabel).toBeNull()
  })

  it('sin día no hay noche que valga', () => {
    settled(EVERY_NIGHT)
    const { result } = renderHook(() => useVidaWeekdayWindow(null))

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.nightEnding).toBeNull()
  })
})

/**
 * **Lo real manda** (tajada 4, criterios 300 a 309).
 *
 * Lo que se durmió de verdad vive en el aparato, así que aquí se siembra en el
 * store —no hay consulta que mockear (criterio 318)— y se lee la ventana.
 */
describe('useVidaDayWindow — la ventana con lo que dormiste de verdad', () => {
  /** El miércoles 2026-09-23 a las 9:24: hoy es ese día en todas estas pruebas. */
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 23, 9, 24, 0))
    useVidaDeviceNotesStore.setState({ nightLogs: {} })
  })

  afterEach(() => {
    vi.useRealTimers()
    useVidaDeviceNotesStore.setState({ nightLogs: {} })
  })

  function seedLog(date: string, bedTime: string | null, wakeTime: string | null) {
    useVidaDeviceNotesStore.setState({
      nightLogs: { [date]: { bedTime, wakeTime, confirmedAt: '2026-09-23T07:00:00.000Z' } },
    })
  }

  // Criterio 300: «Tu día · 6:40 → 23:00», no 5:00.
  it('con el sueño confirmado el día empieza a la hora real de levantarse (300)', () => {
    settled(EVERY_NIGHT)
    seedLog(WEDNESDAY, '01:00', '06:40')
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('06:40')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.startSource).toBe('night-real')
    expect(result.current.realStartReason).toBe('real')
    // La cifra que acompaña también es la real: 1:00 → 6:40 son 5 h 40.
    expect(result.current.sleepLabel).toBe('dormiste 5 h 40')
    // Y no se aclara nada: estas horas **son** un dato real.
    expect(result.current.plannedStartNote).toBeNull()
  })

  // Criterio 301: los huecos y el presupuesto salen de esa hora.
  it('no queda ningún hueco antes de la hora real de levantarse (301)', () => {
    settled(EVERY_NIGHT)
    seedLog(WEDNESDAY, '01:00', '06:40')
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    const agenda = buildDayAgenda({
      planItems: [block('p1', '09:00', '10:00')],
      dayStart: result.current.startTime,
      dayEnd: result.current.endTime,
      nowMinutes: null,
    })

    // 6:40 son 400 minutos. Ni un hueco antes.
    expect(agenda.gaps[0]!.startMinutes).toBe(400)
    expect(agenda.gaps.every((gap) => gap.startMinutes >= 400)).toBe(true)
    // Y el presupuesto se mide sobre el día que de verdad queda.
    const budget = getDayBudget({ agenda, dayEnd: result.current.endTime, nowMinutes: null })
    expect(budget.dayMinutes).toBe(1380 - 400)
  })

  // Criterio 302, y la decisión D4: lo no confirmado no se usa para nada.
  it('sin confirmar, la ventana sigue siendo la planeada (302)', () => {
    settled(EVERY_NIGHT)
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.startSource).toBe('night')
    expect(result.current.realStartReason).toBe('unconfirmed')
    expect(result.current.sleepLabel).toBe('duermes 6 h')
    expect(result.current.plannedStartNote).toBeNull()
  })

  // Criterios 303, 304 y 305: sin dato no se inventa nada y se dice.
  it('con la hora de levantarse sin dato cae a lo planeado, y lo dice (304)', () => {
    settled(EVERY_NIGHT)
    seedLog(WEDNESDAY, '23:20', null)
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.startSource).toBe('night')
    expect(result.current.realStartReason).toBe('no-data')
    expect(result.current.plannedStartNote).toBe(
      'lo planeado: de tu hora de levantarte no quedó dato',
    )
    // Y **ninguna duración inventada** (305): la que se dice es la de tu noche.
    expect(result.current.sleepLabel).toBe('duermes 6 h')
  })

  it('sin noche puesta, una hora sin dato cae a vidaDayStartTime (304)', () => {
    settled({ vidaDayStartTime: '07:00', vidaDayEndTime: '22:00' })
    seedLog(WEDNESDAY, '23:20', null)
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('07:00')
    // Sin franja de arriba no hay nada real que poner, y tampoco nada que
    // aclarar: ese día no tiene noche de la que hablar.
    expect(result.current.realStartReason).toBe('unconfirmed')
  })

  // El hueco que avisó el revisor de la tajada 3.
  it('una hora real que no dejaría día se trata como sin dato, y se dice', () => {
    settled(EVERY_NIGHT)
    seedLog(WEDNESDAY, '23:00', '23:30')
    const { result } = renderHook(() => useVidaDayWindow(WEDNESDAY))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.realStartReason).toBe('out-of-window')
    expect(result.current.plannedStartNote).toBe(
      'lo planeado: la hora que guardaste no deja día',
    )
  })

  // Criterio 308: confirmar un día pasado recalcula **su** ventana.
  it('un día pasado confirmado recalcula su ventana, no la de hoy (308)', () => {
    settled(EVERY_NIGHT)
    // Martes 2026-09-22: ayer.
    seedLog('2026-09-22', '23:10', '07:15')

    const ayer = renderHook(() => useVidaDayWindow('2026-09-22')).result.current
    expect(ayer.startTime).toBe('07:15')
    expect(ayer.startSource).toBe('night-real')

    const hoy = renderHook(() => useVidaDayWindow(WEDNESDAY)).result.current
    expect(hoy.startTime).toBe('05:00')
    expect(hoy.realStartReason).toBe('unconfirmed')
  })

  // Criterio 309: del futuro no hay sueño que valga.
  it('un día futuro no lee ningún sueño guardado (309)', () => {
    settled(EVERY_NIGHT)
    // Jueves 2026-09-24: mañana. Aunque hubiera entrada, no mueve nada.
    seedLog('2026-09-24', '22:00', '08:30')
    const { result } = renderHook(() => useVidaDayWindow('2026-09-24'))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.startSource).toBe('night')
    expect(result.current.realStartReason).toBe('unconfirmed')
    expect(result.current.sleepLabel).toBe('duermes 6 h')
  })

  // La plantilla es una semana tipo: lo de una noche concreta no la mueve.
  it('la plantilla no se entera de lo que dormiste una noche concreta', () => {
    settled(EVERY_NIGHT)
    seedLog(WEDNESDAY, '01:00', '06:40')
    const { result } = renderHook(() => useVidaWeekdayWindow('wednesday'))

    expect(result.current.startTime).toBe('05:00')
    expect(result.current.realStartReason).toBe('unconfirmed')
  })
})
