import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { buildDayExecution, collectDayClosing } from '@/features/vida/utils/vida-execution.utils'
import {
  buildDayReview,
  buildReviewLanes,
  buildReviewStory,
  resolveReviewDate,
  uncoveredMinutes,
} from '@/features/vida/utils/vida-review.utils'
import { parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'

/**
 * **El día contado, sin pintar nada** (FEAT-006, tajada 1): criterios 3, 4, 5,
 * 6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 19, 20 y 21.
 *
 * El día del render aprobado se monta entero —ocho bloques, dos cosas fuera del
 * plan, un movido, un «no se pudo» y uno que se quedó sin hacer— y se afirma
 * sobre él. El «ahora» y el «hoy» entran por parámetro: no hay ni un
 * `vi.setSystemTime` porque no hay ni un `new Date()` que fijar.
 *
 * Lo que **no** se prueba aquí y queda dicho: nada de esto ha pasado nunca por
 * el API de verdad. `/app/*` está detrás del login y los agentes no entran.
 */

const DATE = '2026-09-18'
const TODAY = '2026-09-18'
const DAY_START = '06:30'
const DAY_END = '23:00'

function block(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  endTime: string,
  category: { id: string; name: string; color: string | null; icon: string | null } | null = null,
): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId,
    date: DATE,
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: `${DATE}T00:00:00.000Z`,
    updatedAt: `${DATE}T00:00:00.000Z`,
    activity: { id: activityId, title, category },
  }
}

function session(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  durationMinutes: number | null,
): ActivityFollowUp {
  return {
    id,
    activityId,
    date: DATE,
    startTime,
    durationMinutes,
    isOpen: durationMinutes === null,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title, category: null },
  }
}

function at(time: string): number {
  return parseTimeToMinutes(time)
}

/** El viernes 18 del render, tal cual: ocho bloques y cinco sesiones. */
function renderDay() {
  const planItems = [
    block('b1', 'a1', 'Bañarme', '07:00', '07:15'),
    block('b2', 'a2', 'Pasear a las mascotas', '07:30', '08:00'),
    block('b3', 'a3', 'Desayunar con calma', '08:30', '09:00'),
    block('b4', 'a4', 'Organizar la casa', '09:00', '09:45'),
    block('b5', 'a5', 'Leer un rato', '10:00', '10:30'),
    block('b6', 'a6', 'Cocinar y almorzar', '13:00', '14:00'),
    block('b7', 'a2', 'Pasear a las mascotas', '19:00', '19:30'),
    block('b8', 'a5', 'Leer un rato', '21:30', '22:00'),
  ]
  const followUps = [
    session('s1', 'a1', 'Bañarme', '07:04', 14),
    session('s2', 'a2', 'Pasear a las mascotas', '07:31', 41),
    session('s3', 'a7', 'Llamada con el banco', '08:15', 25),
    session('s4', 'a4', 'Organizar la casa', '09:05', 63),
    session('s5', 'a5', 'Leer un rato', '10:10', 22),
    session('s6', 'a6', 'Cocinar y almorzar', '13:05', 55),
    session('s7', 'a8', 'Salí a hacer cosas', '16:40', 85),
    session('s8', 'a2', 'Pasear a las mascotas', '19:40', 32),
  ]
  return { planItems, followUps }
}

function reviewOf(params: {
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  date?: string
  today?: string
  nowMinutes?: number | null
  isPastDay?: boolean
  couldNotById?: Map<string, string | null>
}) {
  const date = params.date ?? DATE
  const today = params.today ?? TODAY
  const nowMinutes = params.nowMinutes ?? null
  const agenda = buildDayAgenda({
    planItems: params.planItems,
    dayStart: DAY_START,
    dayEnd: DAY_END,
    nowMinutes,
  })
  const execution = buildDayExecution({
    agenda,
    followUps: params.followUps,
    date,
    nowMinutes,
    dayEnd: DAY_END,
    isPastDay: params.isPastDay ?? date < today,
  })
  const couldNotById = params.couldNotById ?? new Map<string, string | null>()
  return {
    agenda,
    execution,
    review: buildDayReview({ execution, agenda, date, today, nowMinutes, couldNotById }),
    couldNotById,
  }
}

describe('resolveReviewDate: con qué día se entra (criterios 3 y 4)', () => {
  it('antes del fin del día de Vida abre **ayer**', () => {
    expect(
      resolveReviewDate({ param: null, today: '2026-09-18', dayEnd: '23:00', nowMinutes: at('20:00') }),
    ).toBe('2026-09-17')
  })

  it('pasado el fin del día abre **hoy**', () => {
    expect(
      resolveReviewDate({ param: null, today: '2026-09-18', dayEnd: '23:00', nowMinutes: at('23:05') }),
    ).toBe('2026-09-18')
  })

  it('en el minuto exacto del fin ya se puede revisar hoy', () => {
    expect(
      resolveReviewDate({ param: null, today: '2026-09-18', dayEnd: '23:00', nowMinutes: at('23:00') }),
    ).toBe('2026-09-18')
  })

  it('cruza el mes hacia atrás sin inventarse el día 0', () => {
    expect(
      resolveReviewDate({ param: null, today: '2026-10-01', dayEnd: '23:00', nowMinutes: at('09:00') }),
    ).toBe('2026-09-30')
  })

  it('el `?d=` manda, y la basura no: cae en el que tocaba', () => {
    expect(
      resolveReviewDate({ param: '2026-09-12', today: '2026-09-18', dayEnd: '23:00', nowMinutes: 600 }),
    ).toBe('2026-09-12')
    expect(
      resolveReviewDate({ param: 'ayer', today: '2026-09-18', dayEnd: '23:00', nowMinutes: 600 }),
    ).toBe('2026-09-17')
  })
})

describe('el día del render, contado (criterios 9, 10, 11, 13, 16 y 17)', () => {
  const { planItems, followUps } = renderDay()
  const couldNotById = new Map<string, string | null>([['b3', 'me fui directo a la llamada']])
  const { review, execution, agenda } = reviewOf({
    planItems,
    followUps,
    date: '2026-09-18',
    today: '2026-09-19',
    couldNotById,
  })

  it('el día está cerrado y se dice con la fecha entera', () => {
    expect(review.status).toBe('closed')
    expect(review.dateLabel).toBe('Viernes 18 de septiembre')
    expect(review.statusLabel).toBe('día cerrado')
  })

  it('la cifra grande es **6 de 8** y sale de `collectDayClosing`, no de aquí', () => {
    const closing = collectDayClosing({ execution, agenda, couldNotItemIds: new Set(couldNotById.keys()) })
    expect(review.figures?.followedCount).toBe(6)
    expect(review.figures?.plannedCount).toBe(8)
    expect(review.figures?.followedCount).toBe(closing.followedCount)
    expect(review.figures?.plannedCount).toBe(closing.plannedCount)
  })

  it('planeado, registrado y fuera del plan son minutos de verdad (criterio 10)', () => {
    // 15 + 30 + 30 + 45 + 30 + 60 + 30 + 30 = 270
    expect(review.figures?.plannedMinutes).toBe(270)
    expect(review.figures?.plannedMinutesLabel).toBe('4h 30')
    // 14 + 41 + 25 + 63 + 22 + 55 + 85 + 32 = 337
    expect(review.figures?.registeredMinutes).toBe(337)
    expect(review.figures?.registeredMinutesLabel).toBe('5h 37')
    expect(review.figures?.offPlanMinutes).toBe(110)
    expect(review.figures?.offPlanMinutesLabel).toBe('1h 50')
  })

  it('«fuera del plan» dice **el mismo número** en la cifra y en la sección (criterio 16)', () => {
    expect(review.offPlan).toHaveLength(2)
    expect(review.offPlanMinutes).toBe(review.figures?.offPlanMinutes)
    expect(review.offPlan.map((row) => row.title)).toEqual([
      'Llamada con el banco',
      'Salí a hacer cosas',
    ])
    expect(review.offPlan.every((row) => row.label === 'fuera del plan')).toBe(true)
    expect(review.offPlan[0]?.timeLabel).toBe('8:15')
  })

  it('«sin registrar» se mide contra el día entero y sale de la leyenda (criterio 11)', () => {
    const legend = execution.budget.legend.find((item) => item.kind === 'no-data')?.minutes
    expect(review.figures?.noDataMinutes).toBe(legend)
    expect(review.figures?.dayMinutes).toBe(990)
    expect(review.figures?.dayMinutesLabel).toBe('16h 30')
  })

  it('los tramos del día siguen sumando el día entero (criterio 12)', () => {
    const total = execution.budget.legend.reduce((sum, item) => sum + item.minutes, 0)
    expect(total).toBe(execution.budget.dayMinutes)
  })

  /**
   * **Las etiquetas salen de Hoy, no del render.** Dos casillas del marco A no
   * se pueden reproducir con los umbrales que ya existen y el criterio 13 dice
   * «exactamente las de Hoy»: con `VIDA_ON_PLAN_TOLERANCE_MINUTES = 5`, un
   * inicio de **+5** cae **dentro** de la tolerancia y no escribe «empezó +5»;
   * y con `VIDA_MOVED_THRESHOLD_MINUTES = 60`, un paseo **40 min** tarde no es
   * «movido», es «empezó +40». Manda el código de FEAT-004, y queda dicho.
   */
  it('las etiquetas son **las de Hoy**, ni una nueva (criterio 13)', () => {
    const labels = review.rows.map((row) =>
      row.real.kind === 'matched' || row.real.kind === 'moved'
        ? row.real.tags.map((tag) => tag.label).join(' · ')
        : row.real.kind === 'missing'
          ? row.real.label
          : '—',
    )
    expect(labels).toEqual([
      '✓ calcado',
      '+11 min',
      'no se pudo',
      '+18 min',
      'empezó +10 · −8 min',
      '✓ calcado',
      'empezó +40',
      'no hecho',
    ])
  })

  it('lo emparejado no se cuenta además como fuera del plan (criterios 16 y 17)', () => {
    expect(review.offPlan.some((row) => row.title === 'Pasear a las mascotas')).toBe(false)
    expect(review.rows.find((row) => row.id === 'b7')?.real.kind).toBe('matched')
  })

  /**
   * El **movido de verdad**, con el umbral de Hoy: más de 60 min de distancia.
   * Aparece **una sola vez** —su fila, con «movido» y «70 min tarde»— y su
   * sesión **no** se lista aparte como fuera del plan.
   */
  it('un bloque movido aparece una sola vez, con «movido · N min tarde» (criterio 17)', () => {
    const { review: moved } = reviewOf({
      planItems: [block('b1', 'a1', 'Pasear a las mascotas', '19:00', '19:30')],
      followUps: [session('s1', 'a1', 'Pasear a las mascotas', '20:10', 32)],
      today: '2026-09-19',
    })
    const row = moved.rows[0]
    expect(row?.real.kind).toBe('moved')
    expect(row?.real.kind === 'moved' ? row.real.tags.map((tag) => tag.label) : []).toEqual([
      'movido',
      '70 min tarde',
    ])
    expect(row?.plannedTimeLabel).toBe('19:00')
    expect(moved.offPlan).toEqual([])
    expect(moved.rows).toHaveLength(1)
  })

  it('«no se pudo» trae su razón, y el que nadie explicó dice «sin razón» (criterio 14)', () => {
    const couldNot = review.rows.find((row) => row.id === 'b3')
    expect(couldNot?.real).toMatchObject({
      kind: 'missing',
      label: 'no se pudo',
      reason: 'me fui directo a la llamada',
    })
    const plain = review.rows.find((row) => row.id === 'b8')
    expect(plain?.real).toMatchObject({ kind: 'missing', label: 'no hecho', reason: null, withoutReason: true })
  })

  it('las filas van en orden de hora y llevan la hora y la duración planeadas', () => {
    expect(review.rows.map((row) => row.plannedTimeLabel)).toEqual([
      '7:00',
      '7:30',
      '8:30',
      '9:00',
      '10:00',
      '13:00',
      '19:00',
      '21:30',
    ])
    expect(review.rows[0]?.plannedDurationLabel).toBe('15 min')
  })

  it('no hay filas fantasma en un día con registros (criterio 19 solo aplica sin ellos)', () => {
    expect(review.ghostRows).toEqual([])
    expect(review.missingRows).toHaveLength(2)
  })
})

describe('la historia del día (criterios 6, 7, 8 a medias, 20 y 21)', () => {
  const { planItems, followUps } = renderDay()
  const couldNotById = new Map<string, string | null>([['b3', 'me fui directo a la llamada']])

  it('son como mucho tres frases y abren por lo que sí salió', () => {
    const { review } = reviewOf({ planItems, followUps, today: '2026-09-19', couldNotById })
    expect(review.story.length).toBeLessThanOrEqual(3)
    expect(review.story[0]?.startsWith('Seguiste 6 de 8 bloques')).toBe(true)
    expect(review.story[1]).toContain('Lo que se salió fue')
    expect(review.story[1]).toContain('1h 50')
    expect(review.story[2]).toContain('Desayunar con calma no se pudo («me fui directo a la llamada»)')
    expect(review.story[2]).toContain('se quedó sin hacer')
  })

  it('la historia **no nombra ninguna categoría** en esta tajada (criterio 8, su mitad)', () => {
    const { review } = reviewOf({ planItems, followUps, today: '2026-09-19', couldNotById })
    const text = review.story.join(' ')
    expect(text).not.toContain('la tarde se te fue')
    expect(text).not.toMatch(/categor/i)
  })

  it('con un solo dato, una sola frase', () => {
    const { review } = reviewOf({
      planItems: [block('b1', 'a1', 'Bañarme', '07:00', '07:15')],
      followUps: [session('s1', 'a1', 'Bañarme', '07:00', 15)],
      today: '2026-09-19',
    })
    expect(review.story).toHaveLength(1)
    expect(review.story[0]).toBe('Seguiste el bloque que planeaste.')
  })

  it('un día **sin plan y con sesiones**: sin «N de M» y sin lista fantasma (criterio 20)', () => {
    const { review } = reviewOf({
      planItems: [],
      followUps: [
        session('s1', 'a1', 'Leer', '10:00', 60),
        session('s2', 'a2', 'Pasear', '12:00', 40),
        session('s3', 'a3', 'Cocinar', '14:00', 30),
      ],
      today: '2026-09-19',
    })
    expect(review.story).toEqual(['Este día no tenía plan; registraste 3 cosas y 2h 10.'])
    expect(review.figures?.hasCount).toBe(false)
    expect(review.ghostRows).toEqual([])
    expect(review.offPlan).toHaveLength(3)
  })

  it('un día **sin plan y sin sesiones**: una frase sin reproche (criterio 21)', () => {
    const { review } = reviewOf({ planItems: [], followUps: [], today: '2026-09-19' })
    expect(review.story).toEqual([])
    expect(review.emptyNotice?.title).toBe('De este día no quedó nada apuntado')
    expect(review.emptyNotice?.body).toContain('también es un día')
    expect(review.emptyNotice?.body).not.toMatch(/no hiciste/i)
  })

  it('un día **con plan y sin un solo registro**: el texto del marco E (criterio 19)', () => {
    const { review } = reviewOf({
      planItems: planItems.slice(0, 4),
      followUps: [],
      today: '2026-09-19',
    })
    expect(review.emptyNotice).toEqual({
      title: 'De este día no quedó nada apuntado',
      body: 'Tenías 4 bloques planeados y no hay registros. Puede que lo vivieras sin abrir la app, y también es un día.',
      hint: 'Si quieres, se rellena ahora — o se queda así.',
    })
    // El plan se enseña en trazo fantasma y **no se afirma «no hecho»** de nada.
    expect(review.ghostRows).toHaveLength(4)
    expect(review.ghostRows.every((row) => row.real.kind === 'none')).toBe(true)
    expect(review.rows).toEqual([])
    // Y «sin registrar» es el día entero (criterio 19, su última línea).
    expect(review.figures?.noDataMinutes).toBe(990)
  })

  it('**hoy, aún abierto**: nada habla en pasado cerrado (criterio 5)', () => {
    const { review } = reviewOf({
      planItems,
      followUps: followUps.slice(0, 4),
      today: '2026-09-18',
      nowMinutes: at('12:00'),
      isPastDay: false,
    })
    expect(review.status).toBe('open')
    expect(review.statusLabel).toBe('aún abierto')
    const text = review.story.join(' ')
    expect(text).toContain('Hasta ahora llevas')
    expect(text).not.toMatch(/seguiste|se quedó sin hacer|se quedaron sin hacer|no se pudo/i)
    expect(review.figures?.isOpen).toBe(true)
  })

  it('un día **futuro** no se revisa: cero cifras (criterio 4)', () => {
    const { review } = reviewOf({
      planItems: planItems.slice(0, 2),
      followUps: [],
      date: '2026-09-20',
      today: '2026-09-18',
    })
    expect(review.status).toBe('future')
    expect(review.figures).toBeNull()
    expect(review.story).toEqual([])
    expect(review.lanes).toEqual([])
    expect(review.emptyNotice?.title).toBe('Este día todavía no ha pasado')
  })

  it('ninguna variante de la historia trae una palabra de reproche (criterio 7)', () => {
    const variantes = [
      reviewOf({ planItems, followUps, today: '2026-09-19', couldNotById }).review.story,
      reviewOf({ planItems, followUps: followUps.slice(0, 3), today: '2026-09-19' }).review.story,
      reviewOf({ planItems: [], followUps, today: '2026-09-19' }).review.story,
      reviewOf({ planItems, followUps: [], today: '2026-09-19' }).review.story,
      reviewOf({
        planItems,
        followUps: followUps.slice(0, 4),
        today: '2026-09-18',
        nowMinutes: at('12:00'),
        isPastDay: false,
      }).review.story,
    ]
    const prohibidas = /desperdici|perdist|perdid|fallast|deberías|mal\b|vago|excusa|incumpl/i
    for (const variante of variantes) {
      expect(prohibidas.test(variante.join(' '))).toBe(false)
    }
  })

  it('con más de dos sin hacer, la frase resume en vez de recitar', () => {
    const story = buildReviewStory({
      plannedCount: 8,
      followedCount: 2,
      missing: [
        { title: 'Uno', couldNot: false, insteadTitle: null, reason: null },
        { title: 'Dos', couldNot: false, insteadTitle: null, reason: null },
        { title: 'Tres', couldNot: false, insteadTitle: null, reason: null },
      ],
      sessionCount: 2,
      offPlanCount: 0,
      offPlanMinutes: 0,
      overMinutes: 0,
      noDataMinutes: 0,
      registeredMinutes: 60,
      status: 'closed',
      nuance: null,
      offPlanTitles: [],
    })
    expect(story[1]).toBe('3 más se quedaron sin hacer.')
  })
})

describe('los dos carriles (criterio 22, A2)', () => {
  const { planItems, followUps } = renderDay()

  it('el movido da **dos filas** y **una sola tarjeta real** (criterio 17)', () => {
    const { execution } = reviewOf({
      planItems,
      // El paseo de la noche, **70 min** tarde: por encima del umbral de Hoy,
      // que es lo que hace que sea «movido» y no «empezó +40».
      followUps: [
        ...followUps.slice(0, 7),
        session('s8', 'a2', 'Pasear a las mascotas', '20:10', 32),
      ],
      today: '2026-09-19',
    })
    const lanes = buildReviewLanes({ execution, couldNotById: new Map() })
    const shadow = lanes.filter((row) => row.real.kind === 'moved-shadow')
    const realMoved = lanes.filter((row) => row.real.kind === 'moved')
    expect(shadow).toHaveLength(1)
    expect(shadow[0]?.plan?.isShadow).toBe(true)
    expect(shadow[0]?.timeLabel).toBe('19:00')
    expect(realMoved).toHaveLength(1)
    expect(realMoved[0]?.plan).toBeNull()
    expect(realMoved[0]?.timeLabel).toBe('20:10')
  })

  it('lo de fuera del plan va **sin nada enfrente** y los tramos sin registrar ocupan su sitio', () => {
    const { execution } = reviewOf({ planItems, followUps, today: '2026-09-19' })
    const lanes = buildReviewLanes({ execution, couldNotById: new Map() })
    const offPlan = lanes.filter((row) => row.real.kind === 'off-plan')
    expect(offPlan).toHaveLength(2)
    expect(offPlan.every((row) => row.plan === null)).toBe(true)
    const noData = lanes.filter((row) => row.real.kind === 'no-data')
    expect(noData.length).toBeGreaterThan(0)
    expect(noData.every((row) => row.plan === null)).toBe(true)
    // Las filas van en orden de reloj, que es el de `execution.entries`.
    const starts = lanes.map((row) => row.startMinutes)
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
  })

  it('un día sin plan solo tiene carril real', () => {
    const { execution } = reviewOf({
      planItems: [],
      followUps: [session('s1', 'a1', 'Leer', '10:00', 60)],
      today: '2026-09-19',
    })
    const lanes = buildReviewLanes({ execution, couldNotById: new Map() })
    expect(lanes.every((row) => row.plan === null)).toBe(true)
    expect(lanes.some((row) => row.real.kind === 'off-plan')).toBe(true)
  })

  it('dos sesiones solapadas se pintan las dos, cada una en su fila', () => {
    const { execution } = reviewOf({
      planItems: [],
      followUps: [
        session('s1', 'a1', 'Leer', '10:00', 60),
        session('s2', 'a2', 'Pasear', '10:30', 60),
      ],
      today: '2026-09-19',
    })
    const lanes = buildReviewLanes({ execution, couldNotById: new Map() })
    const titles = lanes
      .map((row) => (row.real.kind === 'off-plan' ? row.real.title : null))
      .filter(Boolean)
    expect(titles).toEqual(['Leer', 'Pasear'])
  })
})

describe('«sin registrar», contado una sola vez por minuto (criterios 11 y 12)', () => {
  it('sobre un día cerrado da **exactamente** lo que dice la leyenda del presupuesto', () => {
    const { planItems, followUps } = renderDay()
    const { execution, agenda } = reviewOf({ planItems, followUps, today: '2026-09-19' })
    const spans = [
      ...Object.values(execution.byBlockId).map((item) => item.span),
      ...execution.sessions.filter((entry) => entry.variant === 'off-plan').map((entry) => entry.span),
    ]
    const legend = execution.budget.legend.find((item) => item.kind === 'no-data')?.minutes ?? 0
    expect(uncoveredMinutes(spans, agenda.windowStart, agenda.windowEnd)).toBe(legend)
  })

  it('dos sesiones solapadas no descuentan el minuto compartido dos veces', () => {
    expect(
      uncoveredMinutes(
        [
          { startMinutes: 600, endMinutes: 660 },
          { startMinutes: 630, endMinutes: 690 },
        ],
        600,
        700,
      ),
    ).toBe(10)
  })

  it('en un día abierto se mide **hasta ahora**, no hasta el fin del día', () => {
    const { review } = reviewOf({
      planItems: [block('b1', 'a1', 'Bañarme', '07:00', '07:15')],
      followUps: [session('s1', 'a1', 'Bañarme', '07:00', 15)],
      today: TODAY,
      nowMinutes: at('09:00'),
      isPastDay: false,
    })
    // De 6:30 a 9:00 hay 150 min; 15 están registrados.
    expect(review.figures?.noDataMinutes).toBe(135)
  })
})
