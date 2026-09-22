import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  type AdherenceDayInput,
  buildAdherence,
} from '@/features/vida/utils/vida-adherence.utils'
import { shiftYmd } from '@/features/vida/utils/vida-date.utils'
import { buildWeekReview } from '@/features/vida/utils/vida-week-review.utils'

/**
 * **La adherencia de las seis semanas** (FEAT-007, tajada 1): criterios 65,
 * 66, 67, 68, 69, 70, 71 y 73.
 *
 * Todo puro y con el reloj inyectado, como manda la cabecera de
 * `vida-week-review.utils.ts`: una regla de seis semanas no se prueba
 * esperando seis semanas.
 */

const HOURS = { startTime: '06:30', endTime: '23:00' }
/** Domingo: la ventana mide sus 42 días enteros. */
const TODAY = '2026-09-20'
/** Los seis lunes de la ventana, del más viejo al de esta semana. */
const MONDAYS = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14']

function block(date: string, index: number): ActivityDayPlanItem {
  const hour = 8 + index
  const activityId = `act-${index}`
  return {
    id: `${date}-b${index}`,
    userId: 1,
    activityId,
    date,
    startTime: `${String(hour).padStart(2, '0')}:00`,
    endTime: `${String(hour).padStart(2, '0')}:30`,
    orderIndex: index,
    completedAt: null,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    activity: { id: activityId, title: `Cosa ${index}`, category: null },
  }
}

function session(date: string, index: number): ActivityFollowUp {
  const hour = 8 + index
  const activityId = `act-${index}`
  return {
    id: `${date}-s${index}`,
    activityId,
    date,
    startTime: `${String(hour).padStart(2, '0')}:00`,
    durationMinutes: 30,
    isOpen: false,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title: `Cosa ${index}`, category: null },
  }
}

/** Un día con `planned` bloques, de los que `followed` se siguieron. */
function day(date: string, planned: number, followed: number): AdherenceDayInput {
  return {
    date,
    planItems: Array.from({ length: planned }, (_, index) => block(date, index)),
    followUps: Array.from({ length: followed }, (_, index) => session(date, index)),
  }
}

/** Una semana: `days` días seguidos desde el lunes, cada uno con su cifra. */
function week(monday: string, days: { planned: number; followed: number }[]): AdherenceDayInput[] {
  return days.map((counts, index) => day(shiftYmd(monday, index), counts.planned, counts.followed))
}

/** Cuatro días de 5 bloques con `followed` seguidos en cada uno. */
function evenWeek(monday: string, followedPerDay: number): AdherenceDayInput[] {
  return week(
    monday,
    Array.from({ length: 4 }, () => ({ planned: 5, followed: followedPerDay })),
  )
}

function build(days: AdherenceDayInput[], today = TODAY) {
  return buildAdherence({ days, dayHours: HOURS, today, nowMinutes: null })
}

describe('buildAdherence — la frase y de cuántos datos habla (criterios 65 y 66)', () => {
  it('con dos semanas computables abre con la fracción de cada diez, y sin tendencia', () => {
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 4)])

    expect(adherence.hasAdherence).toBe(true)
    expect(adherence.computableWeeks).toBe(2)
    expect(adherence.headline).toEqual(['De cada 10 bloques que planeas, sigues 8.'])
  })

  it('la coletilla de «subiendo» necesita tres semanas y que suba en las tres', () => {
    const subiendo = build([
      ...evenWeek(MONDAYS[2]!, 2),
      ...evenWeek(MONDAYS[3]!, 3),
      ...evenWeek(MONDAYS[4]!, 4),
    ])
    expect(subiendo.headline[1]).toBe('Llevas 3 semanas subiendo.')

    // Plana: ni tendencia, ni una palabra de que baja.
    const plana = build([
      ...evenWeek(MONDAYS[2]!, 3),
      ...evenWeek(MONDAYS[3]!, 3),
      ...evenWeek(MONDAYS[4]!, 3),
    ])
    expect(plana.headline).toHaveLength(1)

    // Bajando: **tampoco se dice nada**.
    const bajando = build([
      ...evenWeek(MONDAYS[2]!, 4),
      ...evenWeek(MONDAYS[3]!, 3),
      ...evenWeek(MONDAYS[4]!, 2),
    ])
    expect(bajando.headline).toHaveLength(1)
    expect(bajando.headline.join(' ')).not.toMatch(/baj/i)
  })

  it('debajo se lee siempre de cuántos datos habla y qué se deja fuera', () => {
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 4)])
    expect(adherence.dataNote).toBe(
      'Con 2 semanas de datos. Las semanas con menos de 3 días planeados se quedan fuera, para que una semana de viaje no arrastre la línea.',
    )
  })
})

describe('buildAdherence — semana a semana (criterios 67 y 68)', () => {
  it('cada semana lleva su rango, su fracción y el porcentaje al lado', () => {
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 3)])
    const [first, second] = adherence.weeks

    expect(adherence.weeks).toHaveLength(2)
    expect(first?.monday).toBe(MONDAYS[3])
    expect(first?.fractionLabel).toBe('16/20')
    expect(first?.percentLabel).toBe('80 %')
    // La semana cruza de mes: la columna lo dice, «ago–sep».
    expect(first?.monthLabel).toBe('ago–sep')
    expect(first?.daysLabel).toBe('31 – 6')
    expect(first?.rangeLabel).toBe('31 de agosto al 6 de septiembre')
    expect(second?.fractionLabel).toBe('12/20')
    expect(second?.percentLabel).toBe('60 %')
  })

  it('ningún porcentaje viaja sin su fracción al lado', () => {
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 3)])
    const conPorcentaje = JSON.stringify(adherence).match(/[^"]*%[^"]*/g) ?? []

    // El único sitio del derivado donde aparece un «%» es `percentLabel`, y
    // esa propiedad convive siempre con su `fractionLabel` en la misma fila.
    expect(conPorcentaje.every((text) => /^\d+ %$/.test(text))).toBe(true)
    for (const semana of adherence.weeks) {
      expect(semana.fractionLabel).toMatch(/^\d+\/\d+$/)
    }
  })

  it('una semana con menos de 3 días planeados no se pinta ni entra en la media', () => {
    const adherence = build([
      // Dos días sueltos: no llega al umbral.
      ...week(MONDAYS[2]!, [
        { planned: 5, followed: 0 },
        { planned: 5, followed: 0 },
      ]),
      ...evenWeek(MONDAYS[3]!, 4),
      ...evenWeek(MONDAYS[4]!, 4),
    ])

    expect(adherence.computableWeeks).toBe(2)
    expect(adherence.weeks.map((semana) => semana.monday)).toEqual([MONDAYS[3], MONDAYS[4]])
    // Si la semana coja hubiera entrado, la frase sería otra: sus diez bloques
    // sin seguir tirarían de la cifra hacia abajo.
    expect(adherence.headline[0]).toBe('De cada 10 bloques que planeas, sigues 8.')
  })

  it('la semana en curso se marca: la leyenda dice que cuenta hasta hoy', () => {
    const adherence = build([...evenWeek(MONDAYS[4]!, 4), ...evenWeek(MONDAYS[5]!, 4)])
    expect(adherence.weeks.at(-1)?.isCurrent).toBe(true)
    expect(adherence.weeks.at(0)?.isCurrent).toBe(false)
  })

  it('los días que no se pudieron leer —y los que siguen en vuelo— no cuentan', () => {
    const rotos: AdherenceDayInput[] = [
      { date: shiftYmd(MONDAYS[4]!, 4), planItems: [], followUps: [], isError: true },
      { date: shiftYmd(MONDAYS[4]!, 5), planItems: [], followUps: [], isPending: true },
    ]
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 4), ...rotos])

    expect(adherence.weeks.at(-1)?.plannedCount).toBe(20)
    expect(adherence.weeks.at(-1)?.plannedDays).toBe(4)
  })
})

describe('buildAdherence — por día de la semana (criterio 69)', () => {
  it('un día con tres semanas o más enseña su fracción; por debajo dice cuántas lleva', () => {
    const adherence = build([
      ...evenWeek(MONDAYS[2]!, 4),
      ...evenWeek(MONDAYS[3]!, 4),
      ...evenWeek(MONDAYS[4]!, 4),
    ])
    const lunes = adherence.weekdays.find((weekday) => weekday.day === 'monday')
    const viernes = adherence.weekdays.find((weekday) => weekday.day === 'friday')
    const domingo = adherence.weekdays.find((weekday) => weekday.day === 'sunday')

    expect(lunes?.hasEnough).toBe(true)
    expect(lunes?.fractionLabel).toBe('12/15')
    expect(lunes?.waitingLabel).toBeNull()

    // El viernes nunca se planeó (las semanas son de lunes a jueves).
    expect(viernes?.fractionLabel).toBeNull()
    expect(viernes?.waitingLabel).toBe('0 sem')
    expect(domingo?.waitingLabel).toBe('0 sem')
    expect(JSON.stringify(adherence.weekdays)).not.toContain('0/0')
  })

  it('con dos semanas el día dice «2 sem» y el pie explica el umbral', () => {
    const adherence = build([...evenWeek(MONDAYS[3]!, 4), ...evenWeek(MONDAYS[4]!, 4)])
    const lunes = adherence.weekdays.find((weekday) => weekday.day === 'monday')

    expect(lunes?.waitingLabel).toBe('2 sem')
    expect(adherence.weekdayNote.join(' ')).toContain('a partir de 3 se puede hablar de')
  })

  it('nombra el día que más se parece al plan solo si uno destaca', () => {
    const destacado = build([
      ...week(MONDAYS[2]!, [
        { planned: 5, followed: 5 },
        { planned: 5, followed: 1 },
        { planned: 5, followed: 1 },
      ]),
      ...week(MONDAYS[3]!, [
        { planned: 5, followed: 5 },
        { planned: 5, followed: 1 },
        { planned: 5, followed: 1 },
      ]),
      ...week(MONDAYS[4]!, [
        { planned: 5, followed: 5 },
        { planned: 5, followed: 1 },
        { planned: 5, followed: 1 },
      ]),
    ])
    expect(destacado.weekdayNote[0]).toBe('Los lunes son los que más se parecen a tu plan.')
    // Y **no** se nombra el que menos: ninguna pantalla de Vida señala un día.
    expect(destacado.weekdayNote.join(' ')).not.toContain('los que menos')

    const parejo = build([
      ...evenWeek(MONDAYS[2]!, 4),
      ...evenWeek(MONDAYS[3]!, 4),
      ...evenWeek(MONDAYS[4]!, 4),
    ])
    expect(parejo.weekdayNote[0]).not.toContain('se parecen a tu plan')
  })
})

describe('buildAdherence — «seguido» es el de FEAT-006 (criterio 70)', () => {
  it('la suma de la semana es exactamente la de `buildWeekReview`', () => {
    const days = [...evenWeek(MONDAYS[3]!, 3), ...evenWeek(MONDAYS[4]!, 4)]
    const adherence = build(days)
    const rows = buildWeekReview({ days, dayHours: HOURS, today: TODAY, nowMinutes: null })

    const followed = rows.reduce((total, row) => total + row.followedCount, 0)
    const planned = rows.reduce((total, row) => total + row.plannedCount, 0)
    const sumaAdherencia = adherence.weeks.reduce(
      (total, semana) => ({
        followed: total.followed + semana.followedCount,
        planned: total.planned + semana.plannedCount,
      }),
      { followed: 0, planned: 0 },
    )

    expect(sumaAdherencia).toEqual({ followed, planned })
  })
})

describe('buildAdherence — cuando todavía no hay bastante (criterio 71)', () => {
  it('con una sola semana computable no se pinta adherencia: se dice qué falta y cuándo', () => {
    const adherence = build([...evenWeek(MONDAYS[4]!, 4)])

    expect(adherence.hasAdherence).toBe(false)
    expect(adherence.weeks).toEqual([])
    expect(adherence.weekdays).toEqual([])
    expect(adherence.headline).toEqual(['Llevas 4 días con plan.'])
    expect(adherence.waiting[0]).toEqual({
      title: 'Adherencia semana a semana',
      thresholdLabel: 'A partir de 2 semanas completas',
      missingLabel: 'te falta 1, la del 14 al 20 de septiembre',
    })
    expect(adherence.waiting[1]?.missingLabel).toBe('llevas 4 días de 21')
    expect(adherence.waitingNote).toContain('sale de los días que vives')
  })

  it('sin un solo día contado tampoco hay barras a cero ni pantalla vacía', () => {
    const adherence = build([])

    expect(adherence.weeks).toEqual([])
    expect(adherence.waiting).toHaveLength(2)
    expect(adherence.waiting[0]?.missingLabel).toContain('te faltan 2')
    expect(adherence.dataNote).toContain('Todavía no hay ninguna semana')
  })
})

describe('buildAdherence — ni una palabra de reproche (criterio 73)', () => {
  it('nada de lo que sale de aquí suena a bronca, tenga datos o no', () => {
    const textos = [
      JSON.stringify(build([...evenWeek(MONDAYS[3]!, 1), ...evenWeek(MONDAYS[4]!, 0)])),
      JSON.stringify(build([])),
      JSON.stringify(build([...evenWeek(MONDAYS[4]!, 2)])),
    ].join(' ')

    for (const palabra of [
      /desperdici/i,
      /fallaste/i,
      /incumpl/i,
      /deber[íi]as/i,
      /\bmal\b/i,
      /perdiste/i,
      /racha/i,
      /cumplimiento/i,
    ]) {
      expect(textos).not.toMatch(palabra)
    }
  })
})
