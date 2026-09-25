import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import { parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'
import {
  buildDayAgenda,
  buildGuidanceLine,
  findLargestGap,
  findNextBlockId,
  formatGapRange,
  getDayBudget,
  type AgendaBlock,
  type AgendaGap,
} from '@/features/vida/utils/vida-agenda.utils'

/**
 * Los números de la agenda, sin pintar nada: criterios 13, 14, 15, 17, 18 y 19.
 *
 * El «ahora» se inyecta como minutos desde medianoche —nunca se llama a
 * `new Date()` aquí dentro—, así que la marca se puede probar a cualquier hora.
 */

const DAY_START = '06:30'
const DAY_END = '23:00'

function block(
  id: string,
  startTime: string,
  endTime: string,
  overrides: Partial<ActivityDayPlanItem> = {},
): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    date: '2026-09-18',
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    activity: { id: `a-${id}`, title: `Actividad ${id}`, category: null },
    ...overrides,
  }
}

const gapOf = (startMinutes: number, endMinutes: number, isPast = false): AgendaGap => ({
  kind: 'gap',
  id: `gap-${startMinutes}-${endMinutes}`,
  startMinutes,
  endMinutes,
  durationMinutes: endMinutes - startMinutes,
  trackMinutes: endMinutes - startMinutes,
  isSliver: endMinutes - startMinutes < 15,
  isPast,
  nextBlockTitle: null,
})

describe('buildDayAgenda', () => {
  it('ordena por hora y pone un hueco antes del primero y después del último (criterio 17)', () => {
    const agenda = buildDayAgenda({
      planItems: [block('b', '10:00', '11:00'), block('a', '08:00', '08:45')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(agenda.entries.map((entry) => entry.kind)).toEqual([
      'gap',
      'block',
      'gap',
      'block',
      'gap',
    ])
    expect(agenda.blocks.map((b) => b.id)).toEqual(['a', 'b'])
    // 6:30 → 8:00, 8:45 → 10:00 y 11:00 → 23:00
    expect(agenda.gaps.map((g) => g.durationMinutes)).toEqual([90, 75, 720])
    expect(agenda.windowStart).toBe(390)
    expect(agenda.windowEnd).toBe(1380)
  })

  it('un día sin plan es un solo hueco del principio al fin', () => {
    const agenda = buildDayAgenda({ planItems: [], dayStart: DAY_START, dayEnd: DAY_END })

    expect(agenda.blocks).toHaveLength(0)
    expect(agenda.gaps).toHaveLength(1)
    expect(agenda.gaps[0]!.durationMinutes).toBe(990)
  })

  it('un resto de menos de 15 min no desaparece: se marca como `isSliver` (criterio 14)', () => {
    const agenda = buildDayAgenda({
      planItems: [block('a', '06:30', '08:00'), block('b', '08:10', '23:00')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(agenda.gaps).toHaveLength(1)
    expect(agenda.gaps[0]).toMatchObject({ durationMinutes: 10, isSliver: true })
  })

  it('la ventana se estira si un bloque cae fuera del horario de los ajustes', () => {
    const agenda = buildDayAgenda({
      planItems: [block('a', '05:00', '06:00')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(agenda.windowStart).toBe(300)
    expect(agenda.entries[0]!.kind).toBe('block')
  })

  it('dos bloques pisados no producen un hueco negativo (D4: el API no valida solapes)', () => {
    const agenda = buildDayAgenda({
      planItems: [block('a', '08:00', '09:30'), block('b', '09:00', '10:00')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(agenda.gaps.every((gap) => gap.durationMinutes > 0)).toBe(true)
    expect(agenda.entries.map((entry) => entry.kind)).toEqual(['gap', 'block', 'block', 'gap'])
  })
})

/**
 * El defecto por el que volvió la tajada: la marca de «ahora» dependía de que
 * quedara alguna entrada por **empezar**, así que desaparecía toda la franja
 * posterior al último bloque y el día sin plan entero. Ahora existe siempre que
 * el reloj caiga dentro del horario del día, dentro del tramo que la contiene.
 */
describe('la marca de «ahora» (criterio 20)', () => {
  const tresBloques = [
    block('a', '08:00', '08:45'),
    block('b', '10:00', '10:30'),
    block('c', '13:00', '14:00'),
  ]

  function agendaAt(nowMinutes: number | null, planItems = tresBloques) {
    return buildDayAgenda({ planItems, dayStart: DAY_START, dayEnd: DAY_END, nowMinutes })
  }

  it('con ahora DESPUÉS del último bloque hay marca, dentro del último hueco', () => {
    const agenda = agendaAt(20 * 60)

    expect(agenda.hasNowMark).toBe(true)
    const marks = agenda.entries.filter((entry) => entry.kind === 'now')
    expect(marks).toHaveLength(1)
    // El hueco 14:00–23:00 se parte en 14:00–20:00 (pasado) y 20:00–23:00.
    expect(agenda.gaps.map((gap) => [gap.startMinutes, gap.endMinutes])).toContainEqual([1200, 1380])
    expect(agenda.gaps.find((gap) => gap.startMinutes === 840)).toMatchObject({
      endMinutes: 1200,
      isPast: true,
    })
  })

  it('con un solo bloque por la mañana y ahora a las 12:00, también hay marca', () => {
    const agenda = agendaAt(12 * 60, [block('a', '08:00', '08:45')])

    expect(agenda.hasNowMark).toBe(true)
    expect(agenda.entries.filter((entry) => entry.kind === 'now')).toHaveLength(1)
  })

  it('con ahora en medio de un hueco ENTRE bloques, el hueco se parte por ahora', () => {
    const agenda = agendaAt(11 * 60 + 30)

    expect(agenda.hasNowMark).toBe(true)
    const index = agenda.entries.findIndex((entry) => entry.kind === 'now')
    const antes = agenda.entries[index - 1]!
    const despues = agenda.entries[index + 1]!
    expect(antes).toMatchObject({ kind: 'gap', endMinutes: 690, isPast: true })
    expect(despues).toMatchObject({ kind: 'gap', startMinutes: 690, durationMinutes: 90 })
  })

  it('HOY SIN PLAN: el día entero es un hueco y la marca sigue estando', () => {
    const agenda = agendaAt(9 * 60 + 24, [])

    expect(agenda.hasNowMark).toBe(true)
    expect(agenda.entries.map((entry) => entry.kind)).toEqual(['gap', 'now', 'gap'])
    expect(agenda.gaps.map((gap) => gap.durationMinutes)).toEqual([174, 816])
  })

  it('con ahora dentro de un bloque, la marca va justo debajo y el bloque NO se parte', () => {
    const agenda = agendaAt(8 * 60 + 30)

    const index = agenda.entries.findIndex((entry) => entry.kind === 'now')
    expect(agenda.entries[index - 1]).toMatchObject({ kind: 'block', id: 'a', durationMinutes: 45 })
    expect(agenda.blocks).toHaveLength(3)
  })

  it('a la hora de inicio y a la de fin exactas sigue habiendo marca', () => {
    expect(agendaAt(parseTimeToMinutes(DAY_START)).hasNowMark).toBe(true)
    expect(agendaAt(parseTimeToMinutes(DAY_END)).hasNowMark).toBe(true)
  })

  it('FUERA del horario del día no hay marca: ni antes de empezar ni después de cerrar', () => {
    expect(agendaAt(5 * 60).hasNowMark).toBe(false)
    expect(agendaAt(23 * 60 + 30).hasNowMark).toBe(false)
    expect(agendaAt(5 * 60).entries.some((entry) => entry.kind === 'now')).toBe(false)
    expect(agendaAt(23 * 60 + 30).entries.some((entry) => entry.kind === 'now')).toBe(false)
  })

  it('sin «ahora» (el día mostrado no es hoy) tampoco hay marca', () => {
    expect(agendaAt(null).hasNowMark).toBe(false)
  })

  it('partir el hueco no cambia lo que suma el día (criterio 14)', () => {
    const conMarca = agendaAt(11 * 60 + 30)
    const sinMarca = agendaAt(null)
    const suma = (agenda: typeof conMarca) =>
      agenda.gaps.reduce((total, gap) => total + gap.durationMinutes, 0)

    expect(suma(conMarca)).toBe(suma(sinMarca))
  })
})

describe('getDayBudget', () => {
  const agenda = buildDayAgenda({
    planItems: [block('a', '08:00', '08:45'), block('b', '10:00', '11:00')],
    dayStart: DAY_START,
    dayEnd: DAY_END,
  })

  it('los anchos suman el 100% y planeado + libre es el día entero (criterios 13 y 14)', () => {
    const budget = getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: null })

    expect(budget.dayMinutes).toBe(990)
    expect(budget.plannedMinutes).toBe(105)
    expect(budget.freeMinutes).toBe(885)
    expect(budget.plannedMinutes + budget.freeMinutes).toBe(budget.dayMinutes)
    expect(budget.plannedPercent + budget.freePercent).toBeCloseTo(100, 10)

    const total = agenda.entries.reduce(
      (sum, entry) => sum + (entry.durationMinutes / budget.dayMinutes) * 100,
      0,
    )
    expect(total).toBeCloseTo(100, 10)
  })

  it('la marca de «ahora» cae pegada a la izquierda al empezar y a la derecha al terminar', () => {
    expect(getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 390 }).nowPercent).toBe(0)
    expect(getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 1380 }).nowPercent).toBe(100)
    expect(getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 885 }).nowPercent).toBeCloseTo(50, 10)
  })

  it('fuera del día no hay marca, y «te quedan» no baja de cero', () => {
    const early = getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 300 })
    expect(early.nowPercent).toBeNull()
    expect(early.remainingMinutes).toBe(1080)

    const late = getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 1430 })
    expect(late.nowPercent).toBeNull()
    expect(late.remainingMinutes).toBe(0)
  })

  it('con bloques pisados los anchos siguen sumando el 100% (hallazgo del revisor)', () => {
    // El API acepta solapes aunque la web no los cree (D4). Sumando duraciones,
    // el revisor midió 106,06%.
    const pisados = buildDayAgenda({
      planItems: [block('a', '08:00', '10:00'), block('b', '09:00', '11:00')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })
    const budget = getDayBudget({ agenda: pisados, dayEnd: DAY_END, nowMinutes: null })

    expect(budget.plannedMinutes + budget.freeMinutes).toBe(budget.dayMinutes)
    expect(budget.plannedPercent + budget.freePercent).toBeCloseTo(100, 10)

    const anchos = pisados.entries.reduce(
      (sum, entry) => sum + (entry.trackMinutes / budget.dayMinutes) * 100,
      0,
    )
    expect(anchos).toBeCloseTo(100, 10)
    // Y el bloque pisado sigue diciendo su duración de verdad en la tarjeta.
    expect(pisados.blocks[1]).toMatchObject({ durationMinutes: 120, trackMinutes: 60 })
    // La guía no puede decir «4h» donde la leyenda dice «planeado 3h».
    expect(
      buildGuidanceLine({ agenda: pisados, nowMinutes: null, dayStart: DAY_START, dayEnd: DAY_END }),
    ).toContain('2 bloques · 3h')
  })

  it('el día ya cerrado deja «te quedan» en cero para que nadie escriba «0m»', () => {
    const budget = getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: 23 * 60 + 30 })
    expect(budget.remainingMinutes).toBe(0)
  })

  it('sin «ahora» (día que no es hoy) no hay marca ni «te quedan»', () => {
    const budget = getDayBudget({ agenda, dayEnd: DAY_END, nowMinutes: null })
    expect(budget.nowPercent).toBeNull()
    expect(budget.remainingMinutes).toBeNull()
  })
})

describe('buildGuidanceLine', () => {
  const withPlan = buildDayAgenda({
    planItems: [
      block('a', '08:00', '08:45'),
      block('b', '10:00', '10:30'),
      block('c', '13:00', '13:30'),
    ],
    dayStart: DAY_START,
    dayEnd: DAY_END,
  })

  it('nombra números reales: bloques que quedan y el hueco más grande (criterio 15)', () => {
    const line = buildGuidanceLine({
      agenda: withPlan,
      nowMinutes: 9 * 60 + 24,
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(line).toContain('2 bloques')
    expect(line).toContain('1h')
    expect(line).toContain('13:30 – 23:00')
  })

  it('tiene una frase propia para el día sin plan', () => {
    const line = buildGuidanceLine({
      agenda: buildDayAgenda({ planItems: [], dayStart: DAY_START, dayEnd: DAY_END }),
      nowMinutes: 9 * 60,
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(line).toContain('Todavía no hay plan')
    expect(line).toContain('14h')
  })

  it('tiene una frase propia para el día lleno, sin hueco suelto', () => {
    const full = buildDayAgenda({
      planItems: [block('a', '06:30', '23:00')],
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })
    const line = buildGuidanceLine({
      agenda: full,
      nowMinutes: 9 * 60,
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(line).toContain('el día está completo')
  })

  it('a última hora dice que ya no queda hueco por delante, no que el día esté lleno', () => {
    const line = buildGuidanceLine({
      agenda: withPlan,
      nowMinutes: 22 * 60 + 59,
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(line).toContain('Ya no queda hueco por delante')
    expect(line).not.toContain('el día está completo')
  })

  it('tiene una frase propia para el día ya terminado', () => {
    const line = buildGuidanceLine({
      agenda: withPlan,
      nowMinutes: 23 * 60 + 30,
      dayStart: DAY_START,
      dayEnd: DAY_END,
    })

    expect(line).toContain('se cerró a las 23:00')
  })

  it('ninguna de las cuatro reprocha nada (criterio 56)', () => {
    const prohibidas = /desperdici|perdiste|fallaste|cancelar|eliminar|vacío|vacía/i
    const casos = [
      buildGuidanceLine({ agenda: withPlan, nowMinutes: 564, dayStart: DAY_START, dayEnd: DAY_END }),
      buildGuidanceLine({
        agenda: buildDayAgenda({ planItems: [], dayStart: DAY_START, dayEnd: DAY_END }),
        nowMinutes: 564,
        dayStart: DAY_START,
        dayEnd: DAY_END,
      }),
      buildGuidanceLine({
        agenda: withPlan,
        nowMinutes: 1410,
        dayStart: DAY_START,
        dayEnd: DAY_END,
      }),
      buildGuidanceLine({ agenda: withPlan, nowMinutes: null, dayStart: DAY_START, dayEnd: DAY_END }),
    ]

    for (const linea of casos) expect(linea).not.toMatch(prohibidas)
  })
})

describe('findLargestGap', () => {
  it('un hueco que ya empezó cuenta solo por lo que le queda', () => {
    const gaps = [gapOf(390, 600), gapOf(620, 660)]
    const largest = findLargestGap(gaps, 450)

    expect(largest).toMatchObject({ startMinutes: 450, durationMinutes: 150 })
  })

  it('los huecos ya pasados no se ofrecen', () => {
    expect(findLargestGap([gapOf(390, 480)], 600)).toBeNull()
  })
})

/**
 * **Lo que ya no se prueba aquí, y por qué.** `fitsInGap`, `suggestionsForGap`
 * y su `describe` de «la duración que sueles tardar, en las fichas del hueco»
 * vivían justo aquí. Se fueron con las fichas: **FEAT-010, criterio 381**
 * deroga el criterio 18 de FEAT-003 en su parte de fichas, el 19 y el 23
 * enteros, y la mitad del criterio 91 de FEAT-007 (la costumbre ofrecida en un
 * chip). `findFirstFittingGap` se fue con el panel lateral (criterio 383, que
 * deroga la primera mitad del criterio 48 de FEAT-003).
 *
 * No queda aritmética que probar en su lugar —lo que el hueco hace ahora es
 * enseñar su franja, su tamaño y **solo** «+ otra cosa» (criterio 382)—, así
 * que lo nuevo se afirma donde se pinta: `VidaAgendaGap.test.tsx`, y sitio por
 * sitio los cuatro caminos del criterio 384 en `VidaHoyPage.test.tsx`. La
 * mitad viva del 91 se prueba en `vida-patterns.utils.test.ts`, por actividad,
 * que es de donde la lee la tarjeta de «Lo que viene» (criterio 372).
 */

describe('findNextBlockId y formatGapRange', () => {
  const blocks: AgendaBlock[] = buildDayAgenda({
    planItems: [block('a', '08:00', '08:45'), block('b', '10:00', '11:00')],
    dayStart: DAY_START,
    dayEnd: DAY_END,
  }).blocks

  it('el «en N min» es del primero que aún no ha empezado (criterio 16)', () => {
    expect(findNextBlockId(blocks, 9 * 60)).toBe('b')
    expect(findNextBlockId(blocks, 7 * 60)).toBe('a')
    expect(findNextBlockId(blocks, 22 * 60)).toBeNull()
  })

  it('sin «ahora» no hay «en N min»', () => {
    expect(findNextBlockId(blocks, null)).toBeNull()
  })

  it('las horas del hueco se leen sin cero a la izquierda', () => {
    expect(formatGapRange(gapOf(630, 780))).toBe('10:30 – 13:00')
    expect(formatGapRange(gapOf(480, 540))).toBe('8:00 – 9:00')
  })
})
