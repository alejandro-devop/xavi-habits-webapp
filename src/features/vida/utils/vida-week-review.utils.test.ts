import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  buildTemplateBridge,
  buildWeekLine,
  buildWeekReview,
  weekDotsByDate,
} from '@/features/vida/utils/vida-week-review.utils'

/**
 * **La semana y el puente** (FEAT-006, tajada 4): criterios 46, 47, 50, 52,
 * 54, 55, 56 y 59.
 *
 * Todo puro y con el reloj inyectado: es la única forma de probar una regla de
 * **14 días** sin API y sin esperar dos semanas.
 */

const HOURS = { startTime: '06:30', endTime: '23:00' }
/** Sábado. La semana del render es lunes 14 → domingo 20. */
const TODAY = '2026-09-19'

function block(
  date: string,
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  endTime: string,
): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId,
    date,
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    activity: { id: activityId, title, category: null },
  }
}

function session(
  date: string,
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  durationMinutes: number,
): ActivityFollowUp {
  return {
    id,
    activityId,
    date,
    startTime,
    durationMinutes,
    isOpen: false,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title, category: null },
  }
}

function item(
  id: string,
  activityId: string,
  title: string,
  startTime: string | null,
  days: VidaItem['days'] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  isActive = true,
): VidaItem {
  return {
    id,
    userId: 1,
    activityId,
    days,
    startTime,
    durationMinutes: 30,
    notes: null,
    isActive,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: activityId, title, category: null },
  }
}

function week(days: Parameters<typeof buildWeekReview>[0]['days']) {
  return buildWeekReview({ days, dayHours: HOURS, today: TODAY, nowMinutes: 9 * 60 + 24 })
}

describe('buildWeekReview: las siete filas (criterios 46, 47 y 52)', () => {
  it('un día cerrado dice «seguidos de total» y los minutos registrados de planeados', () => {
    const date = '2026-09-18'
    const rows = week([
      {
        date,
        planItems: [
          block(date, 'b1', 'a1', 'Bañarme', '07:00', '07:15'),
          block(date, 'b2', 'a2', 'Pasear', '07:30', '08:00'),
          block(date, 'b3', 'a3', 'Leer', '21:30', '22:00'),
        ],
        followUps: [
          session(date, 's1', 'a1', 'Bañarme', '07:04', 14),
          session(date, 's2', 'a2', 'Pasear', '07:31', 41),
        ],
      },
    ])

    expect(rows[0]!.headline).toBe('2 de 3')
    expect(rows[0]!.weekdayLabel).toBe('Vie')
    expect(rows[0]!.dayOfMonth).toBe(18)
    expect(rows[0]!.minutesLabel).toBe('55m de 1h 15')
    expect(rows[0]!.dot).toBe('partial')
  })

  it('la barrita son los **cuatro tramos** de la forma cerrada y suman el día', () => {
    const date = '2026-09-18'
    const rows = week([
      {
        date,
        planItems: [block(date, 'b1', 'a1', 'Bañarme', '07:00', '07:15')],
        followUps: [
          session(date, 's1', 'a1', 'Bañarme', '07:00', 30),
          session(date, 's2', 'a9', 'Otra cosa', '10:00', 60),
        ],
      },
    ])

    const kinds = rows[0]!.segments.map((segment) => segment.kind)
    expect(kinds).toContain('followed')
    expect(kinds).toContain('over')
    expect(kinds).toContain('off-plan')
    expect(kinds).toContain('no-data')
    const total = rows[0]!.segments.reduce((sum, segment) => sum + segment.percent, 0)
    expect(Math.round(total)).toBe(100)
  })

  it('un día **sin dato** dice «—», nunca «0» (criterio 47)', () => {
    const date = '2026-09-17'
    const rows = week([
      {
        date,
        planItems: [block(date, 'b1', 'a1', 'Bañarme', '07:00', '07:15')],
        followUps: [],
      },
    ])

    expect(rows[0]!.registeredLabel).toBe('—')
    expect(rows[0]!.minutesLabel).toBe('— de 15m')
    expect(rows[0]!.minutesLabel).not.toContain('0m')
    expect(rows[0]!.dot).toBe('planned')
  })

  it('**un día que no se pudo cargar lo dice** y no se lee «sin plan» (criterio 52)', () => {
    const rows = week([
      { date: '2026-09-16', planItems: [], followUps: [], isError: true },
      { date: '2026-09-17', planItems: [], followUps: [] },
    ])

    expect(rows[0]!.status).toBe('error')
    expect(rows[0]!.headline).toBe('No pudimos cargar este día')
    expect(rows[0]!.headline).not.toContain('Sin plan')
    expect(rows[0]!.segments).toHaveLength(0)
    expect(rows[0]!.dot).toBe('none')
    // Y el de al lado, que sí cargó y está vacío, **sí** dice «Sin plan».
    expect(rows[1]!.headline).toBe('Sin plan')
  })

  it('hoy dice «Hoy · aún abierto» y **no pinta barra**; el futuro enseña su plan', () => {
    const rows = week([
      {
        date: TODAY,
        planItems: [block(TODAY, 'b1', 'a1', 'Bañarme', '07:00', '07:15')],
        followUps: [session(TODAY, 's1', 'a1', 'Bañarme', '07:00', 15)],
      },
      {
        date: '2026-09-20',
        planItems: [
          block('2026-09-20', 'b2', 'a2', 'Pasear', '08:00', '08:30'),
          block('2026-09-20', 'b3', 'a3', 'Leer', '21:30', '22:00'),
        ],
        followUps: [],
      },
    ])

    expect(rows[0]!.headline).toBe('Hoy · aún abierto')
    expect(rows[0]!.segments).toHaveLength(0)
    expect(rows[1]!.headline).toBe('Planeado · 2 bloques')
    expect(rows[1]!.registeredLabel).toBe('—')
  })

  it('el punto de la tira sale de la fila, por fecha (criterio 51)', () => {
    const date = '2026-09-18'
    const rows = week([
      {
        date,
        planItems: [block(date, 'b1', 'a1', 'Bañarme', '07:00', '07:15')],
        followUps: [session(date, 's1', 'a1', 'Bañarme', '07:02', 15)],
      },
    ])

    expect(weekDotsByDate(rows)).toEqual({ [date]: 'followed' })
  })
})

describe('buildWeekLine: la frase de la semana (criterio 50)', () => {
  const dayWith = (date: string, planned: number, followed: number) => ({
    date,
    planItems: Array.from({ length: planned }, (_, index) =>
      block(
        date,
        `b${index}`,
        `a${index}`,
        `Cosa ${index}`,
        `${String(8 + index).padStart(2, '0')}:00`,
        `${String(8 + index).padStart(2, '0')}:30`,
      ),
    ),
    followUps: Array.from({ length: followed }, (_, index) =>
      session(
        date,
        `s${index}`,
        `a${index}`,
        `Cosa ${index}`,
        `${String(8 + index).padStart(2, '0')}:00`,
        30,
      ),
    ),
  })

  it('abre por lo que **sí** salió y suma solo los días cerrados con plan', () => {
    const rows = week([dayWith('2026-09-14', 4, 3), dayWith('2026-09-15', 4, 2)])

    expect(buildWeekLine(rows)[0]).toBe('Seguiste 5 de 8 bloques esta semana.')
  })

  it('nombra el día más parecido al plan **solo si destaca**', () => {
    const standOut = week([dayWith('2026-09-14', 4, 4), dayWith('2026-09-15', 4, 1)])
    expect(buildWeekLine(standOut)[1]).toBe('Lunes fue el día más parecido a tu plan.')

    const tied = week([dayWith('2026-09-14', 4, 3), dayWith('2026-09-15', 4, 3)])
    expect(buildWeekLine(tied)).toHaveLength(1)
  })

  it('sin días cerrados con plan **no dice nada** y nunca reprocha', () => {
    const rows = week([{ date: '2026-09-17', planItems: [], followUps: [] }])
    expect(buildWeekLine(rows)).toEqual([])

    const line = buildWeekLine(week([dayWith('2026-09-14', 6, 1)])).join(' ')
    for (const word of ['desperdici', 'fallaste', 'perdiste', 'deberías', 'mal']) {
      expect(line.toLowerCase()).not.toContain(word)
    }
  })
})

describe('buildTemplateBridge: el puente (criterios 54, 55, 56, 57 y 59)', () => {
  const LEER = item('i1', 'a5', 'Leer un rato', '21:30')
  /** Los cuatro días en que «Leer» estuvo en el plan a las 21:30. */
  const PLANNED_DATES = ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']

  function daysWithLeer(sessionDates: string[]) {
    return PLANNED_DATES.map((date) => ({
      date,
      planItems: [block(date, `b-${date}`, 'a5', 'Leer un rato', '21:30', '22:00')],
      followUps: sessionDates.includes(date)
        ? [session(date, `s-${date}`, 'a5', 'Leer un rato', '20:30', 30)]
        : [],
    }))
  }

  it('dispara con 4 días en el plan y 3 sin seguir, y **propone la hora real**', () => {
    const bridge = buildTemplateBridge({
      items: [LEER],
      days: daysWithLeer(['2026-09-15']),
      dayHours: HOURS,
    })

    expect(bridge).not.toBeNull()
    expect(bridge!.itemId).toBe('i1')
    expect(bridge!.title).toBe('Leer un rato')
    expect(bridge!.currentTimeLabel).toBe('21:30')
    expect(bridge!.proposedTimeLabel).toBe('20:30')
    expect(bridge!.basis).toBe('3 de las últimas 4 noches no llegó a esa hora')
    expect(bridge!.consequence).toContain('L M X J V')
  })

  it('**sin sesiones de las que derivar la hora, no hay aviso** (criterio 56)', () => {
    const bridge = buildTemplateBridge({
      items: [LEER],
      days: daysWithLeer([]),
      dayHours: HOURS,
    })

    expect(bridge).toBeNull()
  })

  it('**no llega al umbral → no hay aviso** (criterio 55)', () => {
    const bridge = buildTemplateBridge({
      items: [LEER],
      days: daysWithLeer(['2026-09-15']).slice(0, 3),
      dayHours: HOURS,
    })

    expect(bridge).toBeNull()
  })

  it('**sin plantilla no se pinta nada** (criterio 59)', () => {
    expect(
      buildTemplateBridge({ items: [], days: daysWithLeer(['2026-09-15']), dayHours: HOURS }),
    ).toBeNull()
    expect(
      buildTemplateBridge({
        items: [item('i9', 'a5', 'Leer un rato', null)],
        days: daysWithLeer(['2026-09-15']),
        dayHours: HOURS,
      }),
    ).toBeNull()
  })

  it('si la hora real **es la que ya tiene**, no se pregunta lo que ya está', () => {
    const days = PLANNED_DATES.map((date) => ({
      date,
      planItems: [block(date, `b-${date}`, 'a5', 'Leer un rato', '21:30', '22:00')],
      followUps:
        date === '2026-09-15'
          ? [session(date, `s-${date}`, 'a5', 'Leer un rato', '21:30', 30)]
          : [],
    }))

    expect(buildTemplateBridge({ items: [LEER], days, dayHours: HOURS })).toBeNull()
  })

  it('con varios candidatos gana **el de más veces sin seguir**: uno solo sale', () => {
    const otro = item('i2', 'a6', 'Ejercicio', '07:00')
    const days = ['2026-09-14', ...PLANNED_DATES].map((date, index) => ({
      date,
      planItems: [
        block(date, `b-${date}`, 'a5', 'Leer un rato', '21:30', '22:00'),
        block(date, `e-${date}`, 'a6', 'Ejercicio', '07:00', '07:30'),
      ],
      followUps:
        index === 0
          ? [
              session(date, `s-${date}`, 'a5', 'Leer un rato', '20:30', 30),
              session(date, `x-${date}`, 'a6', 'Ejercicio', '07:45', 30),
            ]
          : index === 1
            ? [session(date, `x-${date}`, 'a6', 'Ejercicio', '07:45', 30)]
            : [],
    }))

    const bridge = buildTemplateBridge({ items: [LEER, otro], days, dayHours: HOURS })

    // «Leer» falta 4 de 5 y «Ejercicio» 3 de 5: gana el de más veces, y **solo
    // hay uno** (criterio 54).
    expect(bridge!.itemId).toBe('i1')
    expect(bridge!.missedDays).toBe(4)
    expect(bridge!.plannedDays).toBe(5)
  })

  it('un ítem **desactivado** no propone nada: no sale en Hoy', () => {
    const bridge = buildTemplateBridge({
      items: [item('i1', 'a5', 'Leer un rato', '21:30', ['monday'], false)],
      days: daysWithLeer(['2026-09-15']),
      dayHours: HOURS,
    })

    expect(bridge).toBeNull()
  })

  it('ni la base ni la consecuencia contienen una palabra de reproche', () => {
    const bridge = buildTemplateBridge({
      items: [LEER],
      days: daysWithLeer(['2026-09-15']),
      dayHours: HOURS,
    })
    const text = `${bridge!.basis} ${bridge!.consequence}`.toLowerCase()

    for (const word of ['desperdici', 'fallaste', 'perdiste', 'deberías', 'incumpl']) {
      expect(text).not.toContain(word)
    }
  })
})
