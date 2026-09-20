import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import {
  VIDA_MOVED_THRESHOLD_MINUTES,
  VIDA_ON_PLAN_TOLERANCE_MINUTES,
  buildDayExecution,
  describeBlockExecution,
  getExecutedBudget,
  isDayClosed,
  matchSessionsToBlocks,
  toSessionSpans,
  type ExecutionSessionEntry,
} from '@/features/vida/utils/vida-execution.utils'
import { parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'

/**
 * El cruce real ↔ planeado y el presupuesto, sin pintar nada: criterios 18 a 29.
 *
 * El «ahora» se inyecta como minutos desde medianoche —ni un `new Date()` aquí
 * dentro—, así que cualquier hora del día se puede probar. Los casos que pide
 * el criterio 19 tienen **nombre propio**: dos bloques de la misma actividad con
 * una sesión y con dos.
 */

const DATE = '2026-09-18'
const DAY_START = '06:30'
const DAY_END = '23:00'

function block(
  id: string,
  activityId: string,
  startTime: string,
  endTime: string,
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
    activity: { id: activityId, title: `Actividad ${activityId}`, category: null },
  }
}

function session(
  id: string,
  activityId: string,
  startTime: string,
  durationMinutes: number | null,
  date = DATE,
): ActivityFollowUp {
  return {
    id,
    activityId,
    date,
    startTime,
    durationMinutes,
    isOpen: durationMinutes === null,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title: `Actividad ${activityId}`, category: null },
  }
}

function agendaOf(items: ActivityDayPlanItem[], nowMinutes: number | null = null) {
  return buildDayAgenda({ planItems: items, dayStart: DAY_START, dayEnd: DAY_END, nowMinutes })
}

function at(time: string): number {
  return parseTimeToMinutes(time)
}

describe('los dos umbrales (criterio 20)', () => {
  it('son constantes con nombre y valen 5 y 60', () => {
    expect(VIDA_ON_PLAN_TOLERANCE_MINUTES).toBe(5)
    expect(VIDA_MOVED_THRESHOLD_MINUTES).toBe(60)
  })
})

describe('toSessionSpans', () => {
  it('ordena por hora y respeta la duración registrada', () => {
    const spans = toSessionSpans({
      followUps: [session('s2', 'a', '10:00', 20), session('s1', 'a', '07:30', 41)],
      date: DATE,
      nowMinutes: at('12:00'),
    })
    expect(spans.map((span) => span.id)).toEqual(['s1', 's2'])
    expect(spans[0]!.startMinutes).toBe(at('07:30'))
    expect(spans[0]!.endMinutes).toBe(at('08:11'))
  })

  it('deja fuera lo que es de otro día', () => {
    const spans = toSessionSpans({
      followUps: [session('s1', 'a', '07:30', 30, '2026-09-17')],
      date: DATE,
      nowMinutes: null,
    })
    expect(spans).toEqual([])
  })

  it('una sesión en marcha lleva los minutos que van hasta ahora', () => {
    const [span] = toSessionSpans({
      followUps: [session('s1', 'a', '09:00', null)],
      date: DATE,
      nowMinutes: at('09:52'),
    })
    expect(span!.isRunning).toBe(true)
    expect(span!.durationMinutes).toBe(52)
  })

  it('una sesión en marcha de un día que no es hoy no inventa un final', () => {
    const [span] = toSessionSpans({
      followUps: [session('s1', 'a', '09:00', null)],
      date: DATE,
      nowMinutes: null,
    })
    expect(span!.durationMinutes).toBe(1)
  })
})

describe('matchSessionsToBlocks (D1, criterio 19)', () => {
  it('una sesión calcada va a su bloque', () => {
    const agenda = agendaOf([block('b1', 'a', '07:30', '08:00')])
    const spans = toSessionSpans({
      followUps: [session('s1', 'a', '07:31', 29)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    expect(byBlockId.b1?.id).toBe('s1')
    expect(unmatched).toEqual([])
  })

  it('una sesión de otra actividad no se encaja a la fuerza (criterio 22)', () => {
    const agenda = agendaOf([block('b1', 'a', '07:30', '08:00')])
    const spans = toSessionSpans({
      followUps: [session('s1', 'zzz', '07:30', 30)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    expect(byBlockId).toEqual({})
    expect(unmatched.map((span) => span.id)).toEqual(['s1'])
  })

  it('dos bloques de la misma actividad y UNA sesión: va al más cercano en hora', () => {
    const agenda = agendaOf([
      block('manana', 'perro', '07:30', '08:10'),
      block('tarde', 'perro', '19:00', '19:30'),
    ])
    const spans = toSessionSpans({
      followUps: [session('s1', 'perro', '19:05', 32)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    expect(byBlockId.tarde?.id).toBe('s1')
    expect(byBlockId.manana).toBeUndefined()
    expect(unmatched).toEqual([])
  })

  it('dos bloques de la misma actividad y DOS sesiones: una cada uno, ninguno con dos', () => {
    const agenda = agendaOf([
      block('manana', 'perro', '07:30', '08:10'),
      block('tarde', 'perro', '19:00', '19:30'),
    ])
    const spans = toSessionSpans({
      followUps: [session('s1', 'perro', '07:31', 41), session('s2', 'perro', '19:40', 32)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    expect(byBlockId.manana?.id).toBe('s1')
    expect(byBlockId.tarde?.id).toBe('s2')
    expect(unmatched).toEqual([])
  })

  it('tres sesiones y dos bloques de la misma actividad: la que sobra queda fuera del plan', () => {
    const agenda = agendaOf([
      block('manana', 'perro', '07:30', '08:10'),
      block('tarde', 'perro', '19:00', '19:30'),
    ])
    const spans = toSessionSpans({
      followUps: [
        session('s1', 'perro', '07:31', 41),
        session('s2', 'perro', '12:00', 20),
        session('s3', 'perro', '19:05', 32),
      ],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    expect(byBlockId.manana?.id).toBe('s1')
    // El bloque de la tarde se lo queda **la de las 19:05**, que cae dentro del
    // umbral, y no la de las 12:00, que llegaba antes en el reloj: el primer
    // pase casa solo lo que cumple el criterio 19. La de las 12:00 sobra y se
    // pinta fuera del plan, nunca se descarta.
    expect(byBlockId.tarde?.id).toBe('s3')
    expect(unmatched.map((span) => span.id)).toEqual(['s2'])
  })

  it('un bloque, dos sesiones de la misma actividad, la lejana primero: el bloque es de la cercana', () => {
    // El caso que devolvió la tajada. Un solo bloque de «Pasear» a las 19:00 y
    // dos paseos: uno de más por la mañana y el planeado por la tarde. Con un
    // pase único por hora, el de las 7:30 llegaba antes, se quedaba el bloque
    // como «movido» y el de las 19:05 acababa «fuera del plan»: un día seguido
    // leído como un día no seguido.
    const agenda = agendaOf([block('tarde', 'perro', '19:00', '19:30')])
    const spans = toSessionSpans({
      followUps: [session('manana', 'perro', '07:30', 30), session('tarde', 'perro', '19:05', 28)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId, unmatched } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })

    expect(byBlockId.tarde?.id).toBe('tarde')
    expect(unmatched.map((span) => span.id)).toEqual(['manana'])
    // Y el bloque se lee «✓ calcado», no «→ hecho a las 7:30».
    const execution = describeBlockExecution(agenda.blocks[0]!, byBlockId.tarde!)
    expect(execution.status).toBe('on-plan')
    expect(execution.movedToLabel).toBeNull()
  })

  it('el mismo caso, con el día cerrado, deja de decir «seguido 0»', () => {
    const agenda = agendaOf([block('tarde', 'perro', '19:00', '19:30')])
    const execution = buildDayExecution({
      agenda,
      followUps: [session('manana', 'perro', '07:30', 30), session('tarde', 'perro', '19:05', 28)],
      date: DATE,
      nowMinutes: null,
      dayEnd: DAY_END,
      isPastDay: true,
    })

    const seguido = execution.budget.legend.find((item) => item.kind === 'followed')
    // 19:05 → 19:33 contra un bloque de 19:00 a 19:30: 25 min dentro del plan.
    expect(seguido?.minutes).toBe(25)
    expect(execution.budget.legend.find((item) => item.kind === 'off-plan')?.minutes).toBe(30)
    expect(execution.byBlockId.tarde?.isOnPlan).toBe(true)
    // La de la mañana se pinta fuera del plan, en su hora, y **no** como movida.
    expect(execution.sessions.map((entry) => [entry.variant, entry.label])).toEqual([
      ['off-plan', 'fuera del plan'],
    ])
  })

  it('una sesión a más de 60 min sigue emparejada con su bloque (criterio 23)', () => {
    const agenda = agendaOf([block('b1', 'perro', '19:00', '19:30')])
    const spans = toSessionSpans({
      followUps: [session('s1', 'perro', '19:40', 32)],
      date: DATE,
      nowMinutes: null,
    })
    expect(matchSessionsToBlocks({ blocks: agenda.blocks, spans }).byBlockId.b1?.id).toBe('s1')
    const lejos = toSessionSpans({
      followUps: [session('s1', 'perro', '21:30', 32)],
      date: DATE,
      nowMinutes: null,
    })
    const result = matchSessionsToBlocks({ blocks: agenda.blocks, spans: lejos })
    expect(result.byBlockId.b1?.id).toBe('s1')
    expect(result.unmatched).toEqual([])
  })
})

describe('describeBlockExecution (criterios 20, 21 y 23)', () => {
  function describe1(blockTimes: [string, string], sessionStart: string, minutes: number | null, now: number | null = null) {
    const item = block('b1', 'a', blockTimes[0], blockTimes[1])
    const agenda = agendaOf([item], now)
    const spans = toSessionSpans({
      followUps: [session('s1', 'a', sessionStart, minutes)],
      date: DATE,
      nowMinutes: now,
    })
    return describeBlockExecution(agenda.blocks[0]!, spans[0]!)
  }

  it('calcado: dentro de ±5 min en inicio y duración', () => {
    const execution = describe1(['07:00', '07:15'], '07:04', 14)
    expect(execution.status).toBe('on-plan')
    expect(execution.isOnPlan).toBe(true)
    expect(execution.startLabel).toBeNull()
    expect(execution.durationLabel).toBeNull()
    expect(execution.comparisonLabel).toBeNull()
    expect(execution.rangeLabel).toBe('7:04 – 7:18')
  })

  it('+N min: duró más de la cuenta, con su barrita plan frente a real', () => {
    const execution = describe1(['07:30', '08:00'], '07:31', 41)
    expect(execution.status).toBe('changed')
    expect(execution.durationLabel).toBe('+11 min')
    expect(execution.startLabel).toBeNull()
    expect(execution.comparisonLabel).toBe('plan 30 · real 41')
    expect(execution.rangeLabel).toBe('7:31 – 8:12')
  })

  it('−N min: acabó antes', () => {
    const execution = describe1(['10:00', '10:30'], '10:10', 22)
    expect(execution.durationLabel).toBe('−8 min')
    expect(execution.startLabel).toBe('empezó +10')
    expect(execution.comparisonLabel).toBe('plan 30 · real 22')
  })

  it('empezó +N dentro del umbral de movido, con la duración calcada', () => {
    const execution = describe1(['09:00', '09:45'], '09:20', 45)
    expect(execution.status).toBe('changed')
    expect(execution.startLabel).toBe('empezó +20')
    expect(execution.durationLabel).toBeNull()
  })

  it('justo en el borde de la tolerancia todavía es calcado', () => {
    expect(describe1(['09:00', '09:30'], '09:05', 35).isOnPlan).toBe(true)
    expect(describe1(['09:00', '09:30'], '09:06', 30).isOnPlan).toBe(false)
  })

  it('movido: más de 60 min de su hora, con sombra y «→ hecho a las 19:40»', () => {
    const execution = describe1(['19:00', '19:30'], '20:40', 32)
    expect(execution.status).toBe('moved')
    expect(execution.movedToLabel).toBe('→ hecho a las 20:40')
    expect(execution.startLabel).toBeNull()
    expect(execution.durationLabel).toBeNull()
  })

  it('justo en el borde del movido todavía no es movido', () => {
    expect(describe1(['19:00', '19:30'], '20:00', 30).status).toBe('changed')
    expect(describe1(['19:00', '19:30'], '20:01', 30).status).toBe('moved')
  })

  it('en marcha: no se compara nada todavía', () => {
    const execution = describe1(['09:00', '09:45'], '09:05', null, at('09:57'))
    expect(execution.status).toBe('running')
    expect(execution.isRunning).toBe(true)
    expect(execution.startLabel).toBeNull()
    expect(execution.durationLabel).toBeNull()
    expect(execution.comparisonLabel).toBeNull()
  })

  it('una sesión que cruza el fin del día se lee con sus horas, sin dar la vuelta', () => {
    const execution = describe1(['22:30', '23:00'], '22:40', 120)
    expect(execution.rangeLabel).toBe('22:40 – 23:59')
    expect(execution.durationLabel).toBe('+90 min')
  })
})

describe('buildDayExecution: la agenda con lo real dentro', () => {
  it('un día sin nada registrado se ve exactamente como en F2 (criterio 29)', () => {
    const agenda = agendaOf([block('b1', 'a', '09:00', '09:30')], at('12:00'))
    const execution = buildDayExecution({
      agenda,
      followUps: [],
      date: DATE,
      nowMinutes: at('12:00'),
      dayEnd: DAY_END,
      isPastDay: false,
    })
    expect(execution.hasExecution).toBe(false)
    expect(execution.entries).toEqual(agenda.entries)
    expect(execution.byBlockId).toEqual({})
    expect(execution.budget.form).toBe('planned')
    expect(execution.budget.legend.map((item) => item.label)).toEqual(['planeado', 'libre'])
  })

  it('una sesión fuera del plan se cuela en su hora y parte el hueco (criterios 22 y 26)', () => {
    const agenda = agendaOf([block('b1', 'a', '09:00', '09:30')])
    const execution = buildDayExecution({
      agenda,
      followUps: [session('s1', 'otra', '10:00', 25)],
      date: DATE,
      nowMinutes: null,
      dayEnd: DAY_END,
      isPastDay: true,
    })
    const kinds = execution.entries.map((entry) => entry.kind)
    expect(kinds).toEqual(['gap', 'block', 'gap', 'session', 'gap'])
    const loose = execution.entries.find(
      (entry): entry is ExecutionSessionEntry => entry.kind === 'session',
    )!
    expect(loose.label).toBe('fuera del plan')
    expect(loose.rangeLabel).toBe('10:00 – 10:25')
    expect(loose.durationLabel).toBe('25m')
    // Los trozos del hueco partido suman lo que medía el hueco entero.
    const gapsAfter = execution.entries.filter((entry) => entry.kind === 'gap')
    const total = gapsAfter.reduce((sum, gap) => sum + gap.trackMinutes, 0) + loose.trackMinutes
    expect(total).toBe(at('23:00') - at('06:30') - 30)
  })

  it('el movido: sombra en la hora planeada y lo real donde ocurrió, contado una vez', () => {
    const agenda = agendaOf([block('b1', 'perro', '19:00', '19:30')])
    const execution = buildDayExecution({
      agenda,
      followUps: [session('s1', 'perro', '20:40', 32)],
      date: DATE,
      nowMinutes: null,
      dayEnd: DAY_END,
      isPastDay: true,
    })
    expect(execution.byBlockId.b1?.movedToLabel).toBe('→ hecho a las 20:40')
    expect(execution.sessions).toHaveLength(1)
    expect(execution.sessions[0]!.variant).toBe('moved')
    expect(execution.sessions[0]!.label).toBe('100 min tarde')
    expect(execution.sessions[0]!.fromBlockId).toBe('b1')
  })

  it('un movido hacia atrás se lee «antes», no «tarde»', () => {
    const agenda = agendaOf([block('b1', 'perro', '19:00', '19:30')])
    const execution = buildDayExecution({
      agenda,
      followUps: [session('s1', 'perro', '17:00', 30)],
      date: DATE,
      nowMinutes: null,
      dayEnd: DAY_END,
      isPastDay: true,
    })
    expect(execution.sessions[0]!.label).toBe('120 min antes')
  })

  it('dos bloques de la misma actividad: solo el suyo queda en marcha (hallazgo 2 de la tajada 1)', () => {
    const agenda = agendaOf(
      [block('manana', 'perro', '07:30', '08:10'), block('tarde', 'perro', '19:00', '19:30')],
      at('19:10'),
    )
    const execution = buildDayExecution({
      agenda,
      followUps: [session('s1', 'perro', '19:05', null)],
      date: DATE,
      nowMinutes: at('19:10'),
      dayEnd: DAY_END,
      isPastDay: false,
    })
    expect(execution.byBlockId.tarde?.isRunning).toBe(true)
    expect(execution.byBlockId.manana).toBeUndefined()
  })
})

describe('el presupuesto en dos formas (D5, criterios 24, 25 y 26)', () => {
  function budgetOf(params: {
    items: ActivityDayPlanItem[]
    followUps: ActivityFollowUp[]
    nowMinutes: number | null
    isPastDay?: boolean
  }) {
    const agenda = agendaOf(params.items, params.nowMinutes)
    return buildDayExecution({
      agenda,
      followUps: params.followUps,
      date: DATE,
      nowMinutes: params.nowMinutes,
      dayEnd: DAY_END,
      isPastDay: params.isPastDay ?? false,
    }).budget
  }

  const DAY_MINUTES = at('23:00') - at('06:30')

  it('día en marcha: hecho · en marcha · planeado · libre, con sus minutos', () => {
    const budget = budgetOf({
      items: [block('b1', 'a', '07:00', '07:30'), block('b2', 'b', '09:00', '09:45')],
      followUps: [session('s1', 'a', '07:00', 30), session('s2', 'b', '09:00', null)],
      nowMinutes: at('09:20'),
    })
    expect(budget.form).toBe('running')
    expect(budget.legend.map((item) => item.label)).toEqual([
      'hecho',
      'en marcha',
      'planeado',
      'libre',
    ])
    expect(budget.legend.find((item) => item.kind === 'done')!.minutes).toBe(30)
    expect(budget.legend.find((item) => item.kind === 'running')!.minutes).toBe(20)
    // Del bloque de las 9:00 quedan 25 min por delante que siguen siendo plan.
    expect(budget.legend.find((item) => item.kind === 'planned')!.minutes).toBe(25)
    expect(budget.note).toBe('Tu día está en marcha: esto llevas y esto queda.')
  })

  it('día cerrado: seguido · de más · fuera del plan · sin dato, y lo dice', () => {
    const budget = budgetOf({
      items: [block('b1', 'a', '07:30', '08:00')],
      followUps: [session('s1', 'a', '07:30', 41), session('s2', 'otra', '10:00', 25)],
      nowMinutes: null,
      isPastDay: true,
    })
    expect(budget.form).toBe('closed')
    expect(budget.legend.map((item) => item.label)).toEqual([
      'seguido',
      'de más',
      'fuera del plan',
      'sin dato',
    ])
    expect(budget.legend.find((item) => item.kind === 'followed')!.minutes).toBe(30)
    expect(budget.legend.find((item) => item.kind === 'over')!.minutes).toBe(11)
    expect(budget.legend.find((item) => item.kind === 'off-plan')!.minutes).toBe(25)
    expect(budget.note).toBe('Tu día ya terminó: esto es lo que pasó.')
  })

  it('el día cerrado por la hora de fin cambia de forma aunque sea hoy', () => {
    const budget = budgetOf({
      items: [block('b1', 'a', '07:30', '08:00')],
      followUps: [session('s1', 'a', '07:30', 30)],
      nowMinutes: at('23:10'),
    })
    expect(budget.form).toBe('closed')
  })

  it('los anchos suman el 100 % del día, también con sesiones solapadas (criterio 26)', () => {
    const cases: { followUps: ActivityFollowUp[]; nowMinutes: number | null; isPastDay: boolean }[] = [
      { followUps: [], nowMinutes: at('12:00'), isPastDay: false },
      {
        followUps: [session('s1', 'a', '07:30', 41), session('s2', 'otra', '07:40', 60)],
        nowMinutes: at('12:00'),
        isPastDay: false,
      },
      {
        followUps: [session('s1', 'a', '07:30', 41), session('s2', 'otra', '07:40', 60)],
        nowMinutes: null,
        isPastDay: true,
      },
      {
        followUps: [session('s1', 'a', '22:40', 120)],
        nowMinutes: null,
        isPastDay: true,
      },
      {
        followUps: [session('s1', 'a', '05:00', 30)],
        nowMinutes: null,
        isPastDay: true,
      },
      {
        followUps: [session('s1', 'a', '09:00', null)],
        nowMinutes: at('09:52'),
        isPastDay: false,
      },
    ]
    for (const testCase of cases) {
      const budget = budgetOf({
        items: [block('b1', 'a', '07:30', '08:00'), block('b2', 'b', '09:00', '09:45')],
        followUps: testCase.followUps,
        nowMinutes: testCase.nowMinutes,
        isPastDay: testCase.isPastDay,
      })
      const total = budget.segments.reduce((sum, segment) => sum + segment.trackMinutes, 0)
      expect(total).toBe(budget.dayMinutes)
      const legendTotal = budget.legend.reduce((sum, item) => sum + item.minutes, 0)
      expect(legendTotal).toBe(budget.dayMinutes)
    }
  })

  it('la leyenda no inventa tramos de cero', () => {
    const budget = budgetOf({
      items: [block('b1', 'a', '07:30', '08:00')],
      followUps: [session('s1', 'a', '07:30', 30)],
      nowMinutes: at('09:00'),
    })
    // El único bloque ya está hecho: no queda «planeado» por delante y ese
    // tramo **no se pinta en cero**.
    expect(budget.legend.map((item) => item.kind)).toEqual(['done', 'free'])
    expect(budget.legend.every((item) => item.minutes > 0)).toBe(true)
  })

  it('un día entero sin plan y sin registro sigue siendo planeado · libre', () => {
    const budget = budgetOf({ items: [], followUps: [], nowMinutes: at('12:00') })
    expect(budget.form).toBe('planned')
    expect(budget.legend.map((item) => item.label)).toEqual(['libre'])
    expect(budget.legend[0]!.minutes).toBe(DAY_MINUTES)
    expect(budget.note).toBeNull()
  })

  it('un día sin plan pero con sesiones sí las cuenta (criterio 53)', () => {
    const budget = budgetOf({
      items: [],
      followUps: [session('s1', 'a', '10:00', 45)],
      nowMinutes: null,
      isPastDay: true,
    })
    expect(budget.form).toBe('closed')
    expect(budget.legend.find((item) => item.kind === 'off-plan')!.minutes).toBe(45)
  })

  it('getExecutedBudget es puro: mismos datos, mismos minutos', () => {
    const agenda = agendaOf([block('b1', 'a', '07:30', '08:00')])
    const spans = toSessionSpans({
      followUps: [session('s1', 'a', '07:30', 41)],
      date: DATE,
      nowMinutes: null,
    })
    const { byBlockId } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    const first = getExecutedBudget({ agenda, spans, byBlockId, isDayClosed: true })
    const second = getExecutedBudget({ agenda, spans, byBlockId, isDayClosed: true })
    expect(first.legend).toEqual(second.legend)
  })
})

describe('isDayClosed (criterio 24)', () => {
  it('un día pasado está cerrado siempre', () => {
    expect(isDayClosed({ nowMinutes: null, dayEnd: DAY_END, isPastDay: true })).toBe(true)
  })

  it('un día futuro no está cerrado', () => {
    expect(isDayClosed({ nowMinutes: null, dayEnd: DAY_END, isPastDay: false })).toBe(false)
  })

  it('hoy se cierra al llegar la hora de fin de los ajustes', () => {
    expect(isDayClosed({ nowMinutes: at('22:59'), dayEnd: DAY_END, isPastDay: false })).toBe(false)
    expect(isDayClosed({ nowMinutes: at('23:00'), dayEnd: DAY_END, isPastDay: false })).toBe(true)
  })
})

describe('el vocabulario (criterio 59)', () => {
  it('ninguna etiqueta del presupuesto usa una palabra de culpa', () => {
    const agenda = agendaOf([block('b1', 'a', '07:30', '08:00')])
    const execution = buildDayExecution({
      agenda,
      followUps: [session('s1', 'a', '09:30', 41)],
      date: DATE,
      nowMinutes: null,
      dayEnd: DAY_END,
      isPastDay: true,
    })
    const words = [
      ...execution.budget.legend.map((item) => item.label),
      execution.budget.note ?? '',
      ...execution.sessions.map((entry) => entry.label),
      ...Object.values(execution.byBlockId).map((item) => item.movedToLabel ?? ''),
    ]
      .join(' ')
      .toLowerCase()
    for (const forbidden of ['desperdici', 'perdiste', 'fallaste', 'vacío', 'cancel', 'elimin']) {
      expect(words).not.toContain(forbidden)
    }
  })
})
