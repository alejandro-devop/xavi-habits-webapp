import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  PATTERN_MIN_OCCURRENCES,
  answerNoteFor,
  bridgeAnswerNoteFor,
  buildActivityPatterns,
  isBridgeSilencedByAnswer,
  isSuggestionSilenced,
  pickBlockHints,
  suggestionReturnDate,
  buildTemplateSheetAdvice,
  usualDurationsByActivityId,
  vidaPatternSuggestionId,
  type BlockHintCandidate,
  type PatternDayInput,
  type VidaPatternSuggestion,
} from '@/features/vida/utils/vida-patterns.utils'
import { calculateEndTime } from '@/features/vida/utils/vida-time.utils'

/**
 * **Los patrones por actividad y la respuesta guardada** (FEAT-007, tajada 2):
 * criterios 74–85.
 *
 * Todo con **reloj inyectado**: sin eso los tres momentos de la regla de las
 * cuatro semanas (criterio 83) no se pueden probar. Aquí no hay React ni
 * `localStorage`: las respuestas entran como datos.
 */

const DAY_HOURS = { startTime: '06:30', endTime: '23:00' }
/** Lunes 21 de septiembre de 2026. Todo lo que se cuenta es anterior. */
const TODAY = '2026-09-21'

function item(overrides: Partial<VidaItem> & Pick<VidaItem, 'id' | 'activityId'>): VidaItem {
  return {
    userId: 1,
    days: ['monday', 'wednesday', 'friday'],
    startTime: '09:00',
    durationMinutes: 45,
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    activity: { id: overrides.activityId, title: 'Organizar la casa', category: null },
    ...overrides,
  }
}

function block(
  date: string,
  activityId: string,
  startTime: string,
  durationMinutes: number,
): ActivityDayPlanItem {
  return {
    id: `b-${activityId}-${date}`,
    userId: 1,
    activityId,
    date,
    startTime,
    endTime: calculateEndTime(startTime, durationMinutes),
    orderIndex: 0,
    completedAt: null,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    activity: { id: activityId, title: 'Organizar la casa', category: null },
  }
}

function session(
  date: string,
  activityId: string,
  startTime: string,
  durationMinutes: number,
): ActivityFollowUp {
  return {
    id: `s-${activityId}-${date}`,
    activityId,
    date,
    startTime,
    durationMinutes,
    endTime: calculateEndTime(startTime, durationMinutes),
    endDate: date,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title: 'Organizar la casa', category: null },
  }
}

/** Un día planeado y, si se dice, vivido. */
function day(
  date: string,
  planned: { activityId: string; startTime: string; durationMinutes: number },
  real: { startTime: string; durationMinutes: number } | null,
): PatternDayInput {
  return {
    date,
    planItems: [block(date, planned.activityId, planned.startTime, planned.durationMinutes)],
    followUps: real ? [session(date, planned.activityId, real.startTime, real.durationMinutes)] : [],
  }
}

/** Cinco lunes/miércoles/viernes seguidos, todos iguales. */
const FIVE_DATES = ['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-16']

function fiveDays(real: { startTime: string; durationMinutes: number } | null): PatternDayInput[] {
  return FIVE_DATES.map((date) =>
    day(date, { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, real),
  )
}

function build(days: PatternDayInput[], items: VidaItem[]) {
  return buildActivityPatterns({ days, items, dayHours: DAY_HOURS, today: TODAY })
}

describe('la tarjeta de una actividad (criterios 74, 75, 76 y 77)', () => {
  it('dice la plantilla, lo que sueles hacer, la mini-fila y la fracción del pie', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ])

    const card = patterns[0]!
    expect(card.templateLabel).toBe('En tu plantilla: L X V · 9:00 · 45m')
    expect(card.startLine).toMatchObject({ label: 'Sueles empezar', valueLabel: '9:06' })
    expect(card.durationLine).toMatchObject({
      label: 'Suele llevarte',
      valueLabel: '1h 10',
      offsetLabel: '+25 min',
    })
    // La cifra del pie va **en fracción**, nunca en porcentaje (criterio 74).
    expect(card.followedLabel).toBe('se siguió 5 de 5 veces')
    expect(card.footnote).toContain('se siguió 5 de 5 veces')
    expect(card.footnote).not.toContain('%')
  })

  it('un día que no está en la plantilla o sin dato enseña «·», nunca un 0 (76)', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ])

    const cells = patterns[0]!.weekdayCells
    expect(cells.map((cell) => cell.day)).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])
    const empty = cells.filter((cell) => !cell.hasData)
    expect(empty.map((cell) => cell.day)).toEqual(['tuesday', 'thursday', 'saturday', 'sunday'])
    for (const cell of empty) {
      expect(cell.offsetLabel).toBe('·')
      expect(cell.offsetLabel).not.toBe('0')
    }
    expect(cells.find((cell) => cell.day === 'monday')?.offsetLabel).toBe('+25')
  })

  it('por debajo de cuatro apariciones no se pinta un promedio: «llevas 2 de 4» (75)', () => {
    const { patterns, waiting } = build(
      fiveDays({ startTime: '09:06', durationMinutes: 70 }).slice(0, 2),
      [item({ id: 'i1', activityId: 'a1' })],
    )

    expect(patterns).toEqual([])
    expect(waiting).toEqual([
      expect.objectContaining({ itemId: 'i1', occurrences: 2, label: 'llevas 2 de 4' }),
    ])
    expect(PATTERN_MIN_OCCURRENCES).toBe(4)
  })

  it('una actividad que va como se planeó **no propone nada y lo dice** (77)', () => {
    const { patterns } = build(fiveDays({ startTime: '09:03', durationMinutes: 44 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ])

    const card = patterns[0]!
    expect(card.suggestion).toBeNull()
    expect(card.settledLabel).toBe('Esto pasa como lo planeaste. Aquí no hay nada que proponer.')
    expect(card.startLine?.offsetLabel).toBe('a su hora')
    expect(card.durationLine?.offsetLabel).toBe('como lo diste')
  })
})

describe('la pregunta, con el número dentro y dos salidas (criterios 78, 79, 80 y 81)', () => {
  it('la duración: «Ponerlo en 1h 10» y un parche con **solo** ese campo', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ])

    const suggestion = patterns[0]!.suggestion!
    expect(suggestion.kind).toBe('duration')
    expect(suggestion.affirmativeLabel).toBe('Ponerlo en 1h 10')
    expect(suggestion.dismissLabel).toBe('Dejarlo')
    expect(suggestion.ask).toBe('¿Le damos 1h 10 en tu plantilla?')
    expect(suggestion.templatePatch).toEqual({ durationMinutes: 70 })
    // La consecuencia se lee **antes** de tocar nada, y nombra los días (80).
    expect(suggestion.consequence).toBe(
      'En tu plantilla está 3 días (L X V): se cambia en todos. Los días que ya tienes armados se quedan como están.',
    )
  })

  it('la hora: «Moverlo a las 19:30», redondeada al cuarto, y solo `startTime`', () => {
    const days = FIVE_DATES.map((date) =>
      day(
        date,
        { activityId: 'a1', startTime: '19:00', durationMinutes: 30 },
        { startTime: '19:28', durationMinutes: 32 },
      ),
    )
    const { patterns } = build(days, [
      item({ id: 'i1', activityId: 'a1', startTime: '19:00', durationMinutes: 30 }),
    ])

    const suggestion = patterns[0]!.suggestion!
    expect(suggestion.kind).toBe('start-time')
    expect(suggestion.affirmativeLabel).toBe('Moverlo a las 19:30')
    expect(suggestion.templatePatch).toEqual({ startTime: '19:30' })
    expect(suggestion.offsetMinutes).toBe(28)
    expect(suggestion.basis).toBe('19:00 planeado · 19:28 real')
  })

  it('un patrón de **un solo día** sale por «Quitar el martes», con los días que quedan (81)', () => {
    const template = item({
      id: 'i1',
      activityId: 'a1',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:30',
      durationMinutes: 30,
    })
    // Lunes, miércoles, jueves y viernes calcados; **los dos martes**, a las 9:40.
    const plan = { activityId: 'a1', startTime: '08:30', durationMinutes: 30 }
    const days = [
      day('2026-09-07', plan, { startTime: '08:34', durationMinutes: 30 }),
      day('2026-09-08', plan, { startTime: '09:40', durationMinutes: 30 }),
      day('2026-09-09', plan, { startTime: '08:35', durationMinutes: 30 }),
      day('2026-09-10', plan, { startTime: '08:33', durationMinutes: 30 }),
      day('2026-09-14', plan, { startTime: '08:36', durationMinutes: 30 }),
      day('2026-09-15', plan, { startTime: '09:40', durationMinutes: 30 }),
    ]

    const { patterns } = build(days, [template])
    const card = patterns[0]!
    const suggestion = card.suggestion!

    expect(suggestion.kind).toBe('drop-day')
    expect(suggestion.dayOfWeek).toBe('tuesday')
    expect(suggestion.affirmativeLabel).toBe('Quitar el martes')
    // **Nunca un `vidaItemDelete`**: es un `update` con los días que quedan.
    expect(suggestion.templatePatch).toEqual({
      days: ['monday', 'wednesday', 'thursday', 'friday'],
    })
    expect(suggestion.ask).toContain('Tu día empieza más tarde ese día')
    // Y el día del que habla se lee en la tarjeta, no solo en el botón.
    expect(card.dayLine).toMatchObject({ label: 'Los martes', valueLabel: '9:40' })
  })

  it('si al quitar el día solo quedara uno, **no se ofrece** nada (81)', () => {
    const template = item({
      id: 'i1',
      activityId: 'a1',
      days: ['monday', 'tuesday'],
      startTime: '08:30',
      durationMinutes: 30,
    })
    const plan = { activityId: 'a1', startTime: '08:30', durationMinutes: 30 }
    const days = [
      day('2026-09-07', plan, { startTime: '08:33', durationMinutes: 30 }),
      day('2026-09-08', plan, { startTime: '09:40', durationMinutes: 30 }),
      day('2026-09-14', plan, { startTime: '08:35', durationMinutes: 30 }),
      day('2026-09-15', plan, { startTime: '09:41', durationMinutes: 30 }),
    ]

    const card = build(days, [template]).patterns[0]!
    expect(card.suggestion).toBeNull()
    // El dato **sí** se enseña: lo que no hay es pregunta.
    expect(card.dayLine).toMatchObject({ label: 'Los martes' })
    // Y no termina muda: dice por qué no propone nada.
    expect(card.closingLabel).toContain('Los martes van por su cuenta')
    expect(card.settledLabel).toBeNull()
  })

  it('ninguna sugerencia propone lo que el ítem ya tiene', () => {
    const days = FIVE_DATES.map((date) =>
      day(
        date,
        { activityId: 'a1', startTime: '09:00', durationMinutes: 45 },
        { startTime: '09:00', durationMinutes: 45 },
      ),
    )
    expect(build(days, [item({ id: 'i1', activityId: 'a1' })]).patterns[0]!.suggestion).toBeNull()
  })
})

describe('lo que no propone nada (criterio 85) y lo que no se cuenta', () => {
  it('un ítem **desactivado** enseña su dato y no pregunta', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1', isActive: false }),
    ])

    expect(patterns[0]!.suggestion).toBeNull()
    expect(patterns[0]!.mutedReason).toContain('desactivada en tu plantilla')
    expect(patterns[0]!.durationLine?.valueLabel).toBe('1h 10')
  })

  it('una actividad **archivada** tampoco pregunta', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({
        id: 'i1',
        activityId: 'a1',
        activity: { id: 'a1', title: 'Organizar la casa', status: 'cancelled', category: null },
      }),
    ])

    expect(patterns[0]!.suggestion).toBeNull()
    expect(patterns[0]!.mutedReason).toContain('archivada')
  })

  it('los días en vuelo, los caídos y los que no han cerrado **no cuentan**', () => {
    const days = [
      ...fiveDays({ startTime: '09:06', durationMinutes: 70 }),
      { ...day('2026-09-18', { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, null), isPending: true },
      { ...day('2026-09-19', { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, null), isError: true },
      // Hoy y mañana: ni uno ni otro han cerrado.
      day(TODAY, { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, null),
      day('2026-09-22', { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, null),
    ]

    const card = build(days, [item({ id: 'i1', activityId: 'a1' })]).patterns[0]!
    expect(card.occurrences).toBe(5)
    expect(card.followedLabel).toBe('se siguió 5 de 5 veces')
  })
})

describe('«Dejarlo» y la regla de las cuatro semanas (D1, criterio 83)', () => {
  const suggestion: VidaPatternSuggestion = {
    id: vidaPatternSuggestionId('duration', 'i1'),
    kind: 'duration',
    itemId: 'i1',
    activityId: 'a1',
    title: 'Organizar la casa',
    icon: 'circle',
    color: null,
    offsetMinutes: 25,
    dayOfWeek: null,
    basis: '',
    ask: '',
    consequence: '',
    affirmativeLabel: '',
    dismissLabel: 'Dejarlo',
    templatePatch: { durationMinutes: 70 },
    dayPatch: { durationMinutes: 70 },
  }
  const answer = { answeredOn: '2026-09-21', offsetMinutes: 25, dayOfWeek: null }

  it('la identidad de la pregunta **no lleva el número**', () => {
    expect(suggestion.id).toBe('duration|i1')
    expect(vidaPatternSuggestionId('drop-day', 'i1', 'tuesday')).toBe('drop-day|i1|tuesday')
  })

  it('al día siguiente **no vuelve**', () => {
    expect(isSuggestionSilenced({ suggestion, answer, today: '2026-09-22' })).toBe(true)
  })

  it('a las cuatro semanas **vuelve**', () => {
    expect(suggestionReturnDate(answer)).toBe('2026-10-19')
    expect(isSuggestionSilenced({ suggestion, answer, today: '2026-10-18' })).toBe(true)
    expect(isSuggestionSilenced({ suggestion, answer, today: '2026-10-19' })).toBe(false)
  })

  it('con el número movido **10 min o más**, vuelve antes de plazo', () => {
    const moved = { ...suggestion, offsetMinutes: 70 }
    expect(isSuggestionSilenced({ suggestion: moved, answer, today: '2026-09-22' })).toBe(false)
    const nudged = { ...suggestion, offsetMinutes: 34 }
    expect(isSuggestionSilenced({ suggestion: nudged, answer, today: '2026-09-22' })).toBe(true)
  })

  it('si cambia **el día** del que habla, vuelve', () => {
    const otherDay = { ...suggestion, kind: 'drop-day' as const, dayOfWeek: 'tuesday' as const }
    expect(isSuggestionSilenced({ suggestion: otherDay, answer, today: '2026-09-22' })).toBe(false)
  })

  it('la fecha de vuelta se puede decir **desde el día en que se contesta** (99)', () => {
    expect(answerNoteFor(answer)).toBe(
      'Lo dejaste el 21 de septiembre. Vuelve el 19 de octubre si el patrón sigue igual.',
    )
  })

  it('el puente de FEAT-006 y esta sugerencia **no preguntan dos veces** (punto 5 del plan)', () => {
    const start: VidaPatternSuggestion = { ...suggestion, kind: 'start-time', id: 'start-time|i1' }
    expect(
      isSuggestionSilenced({
        suggestion: start,
        answer: null,
        today: '2026-09-22',
        dismissedBridgeItemIds: ['i1'],
      }),
    ).toBe(true)
    // Y solo calla a la de **hora**: la de duración es otra pregunta.
    expect(
      isSuggestionSilenced({
        suggestion,
        answer: null,
        today: '2026-09-22',
        dismissedBridgeItemIds: ['i1'],
      }),
    ).toBe(false)
  })
})

describe('planeada y nunca registrada: se dice, no se finge (74, 77)', () => {
  it('las dos líneas están, y dicen **«sin dato»** en vez de un cero', () => {
    const { patterns } = build(fiveDays(null), [item({ id: 'i1', activityId: 'a1' })])

    const card = patterns[0]!
    expect(card.followedLabel).toBe('se siguió 0 de 5 veces')
    // Criterio 74: **todas** las tarjetas llevan estas dos líneas.
    expect(card.startLine).toEqual({
      label: 'Sueles empezar',
      valueLabel: '—',
      offsetLabel: 'sin dato',
      isSettled: false,
    })
    expect(card.durationLine).toEqual({
      label: 'Suele llevarte',
      valueLabel: '—',
      offsetLabel: 'sin dato',
      isSettled: false,
    })
    for (const cell of card.weekdayCells) expect(cell.offsetLabel).toBe('·')
  })

  it('**no** dice que pasa como se planeó: no hay patrón del que hablar (77)', () => {
    const card = build(fiveDays(null), [item({ id: 'i1', activityId: 'a1' })]).patterns[0]!

    expect(card.settledLabel).toBeNull()
    expect(card.suggestion).toBeNull()
    expect(card.closingLabel).toBe(
      'De estas 5 veces no hay ninguna registrada: sin dato no se puede decir cómo te sale.',
    )
  })

  it('con dato de hora pero **ninguna duración**, tampoco se afirma que va clavado', () => {
    // Sesiones abiertas: se sabe a qué hora empezó y no cuánto llevó. Aquí sí
    // hay patrón de hora —y va a su hora—, así que la tarjeta confirma; lo que
    // no puede pasar es que la duración inexistente cuente como desfase cero.
    const days = FIVE_DATES.map((date) => ({
      ...day(date, { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, null),
      followUps: [
        {
          id: `open-${date}`,
          activityId: 'a1',
          date,
          startTime: '09:04',
          durationMinutes: null,
          endTime: null,
          endDate: null,
          endDateTime: null,
          notes: null,
        },
      ],
    }))

    const card = build(days, [item({ id: 'i1', activityId: 'a1' })]).patterns[0]!
    expect(card.startLine.valueLabel).toBe('9:04')
    expect(card.durationLine.offsetLabel).not.toBe('sin dato')
  })

  it('**ninguna tarjeta termina muda**: siempre hay pregunta, confirmación o porqué', () => {
    const casos = [
      // Sin una sola sesión.
      build(fiveDays(null), [item({ id: 'i1', activityId: 'a1' })]),
      // Todo dentro de tolerancia.
      build(fiveDays({ startTime: '09:03', durationMinutes: 44 }), [
        item({ id: 'i1', activityId: 'a1' }),
      ]),
      // Con algo que proponer.
      build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
        item({ id: 'i1', activityId: 'a1' }),
      ]),
      // Desactivada.
      build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
        item({ id: 'i1', activityId: 'a1', isActive: false }),
      ]),
      // Sin hora en la plantilla.
      build(fiveDays({ startTime: '09:40', durationMinutes: 45 }), [
        item({ id: 'i1', activityId: 'a1', startTime: null }),
      ]),
    ]

    for (const { patterns } of casos) {
      for (const card of patterns) {
        const final =
          card.suggestion?.ask ?? card.settledLabel ?? card.closingLabel ?? card.mutedReason
        expect(final).toBeTruthy()
      }
    }
  })
})

describe('la dirección puente → patrón (D1 en las dos pantallas)', () => {
  const answer = { answeredOn: '2026-09-21', offsetMinutes: 28, dayOfWeek: null }

  it('dentro de las cuatro semanas y con el mismo número, el puente calla', () => {
    expect(isBridgeSilencedByAnswer({ answer, offsetMinutes: 30, today: '2026-09-22' })).toBe(true)
  })

  it('pasadas las cuatro semanas, vuelve', () => {
    expect(isBridgeSilencedByAnswer({ answer, offsetMinutes: 30, today: '2026-10-19' })).toBe(false)
  })

  it('con el desfase movido 10 min o más, **vuelve antes de plazo** igual que allí', () => {
    expect(isBridgeSilencedByAnswer({ answer, offsetMinutes: 75, today: '2026-09-22' })).toBe(false)
  })

  it('sin respuesta no calla nada', () => {
    expect(isBridgeSilencedByAnswer({ answer: null, offsetMinutes: 30, today: '2026-09-22' })).toBe(
      false,
    )
  })

  it('la respuesta dada en el puente **también se puede contar**, con su vuelta', () => {
    expect(bridgeAnswerNoteFor('2026-09-21')).toBe(
      'Lo dejaste como estaba en la semana del 21 de septiembre. Vuelve el 28 de septiembre si el patrón sigue igual.',
    )
  })
})

describe('el orden y el vocabulario', () => {
  it('primero las que traen pregunta, y el desempate es estable', () => {
    const settled = FIVE_DATES.map((date) =>
      day(
        date,
        { activityId: 'a2', startTime: '07:00', durationMinutes: 15 },
        { startTime: '07:03', durationMinutes: 14 },
      ),
    )
    const loud = fiveDays({ startTime: '09:06', durationMinutes: 70 })
    const days = settled.map((entry, index) => ({
      date: entry.date,
      planItems: [...entry.planItems, ...(loud[index]?.planItems ?? [])],
      followUps: [...entry.followUps, ...(loud[index]?.followUps ?? [])],
    }))

    const { patterns, withSuggestion } = build(days, [
      item({
        id: 'i2',
        activityId: 'a2',
        startTime: '07:00',
        durationMinutes: 15,
        days: ['monday', 'wednesday', 'friday'],
      }),
      item({ id: 'i1', activityId: 'a1' }),
    ])

    expect(patterns.map((pattern) => pattern.itemId)).toEqual(['i1', 'i2'])
    expect(withSuggestion).toBe(1)
  })

  it('ni una palabra de reproche en lo que se compone aquí (73)', () => {
    const { patterns } = build(fiveDays({ startTime: '09:06', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ])
    const card = patterns[0]!
    const texto = [
      card.templateLabel,
      card.footnote,
      card.startLine?.offsetLabel,
      card.durationLine?.offsetLabel,
      card.suggestion?.ask,
      card.suggestion?.consequence,
      card.suggestion?.affirmativeLabel,
      card.suggestion?.dismissLabel,
    ]
      .join(' ')
      .toLowerCase()

    for (const palabra of ['desperdicio', 'fallaste', 'incumpl', 'deberías', 'perdiste']) {
      expect(texto).not.toContain(palabra)
    }
    expect(texto).not.toMatch(/\bmal\b/)
  })
})

/* ── Los avisos de Hoy (FEAT-007, tajada 3: criterios 87, 88, 91 y 92) ──── */

/** Un bloque del plan de hoy, con hueco de sobra alrededor. */
function candidate(
  overrides: Partial<BlockHintCandidate> & Pick<BlockHintCandidate, 'blockId' | 'activityId'>,
): BlockHintCandidate {
  return {
    startMinutes: 9 * 60,
    durationMinutes: 45,
    windowStartMinutes: 7 * 60,
    windowEndMinutes: 13 * 60,
    isDone: false,
    ...overrides,
  }
}

function suggestionOf(overrides: Partial<VidaPatternSuggestion>): VidaPatternSuggestion {
  return {
    id: 'duration|i1',
    kind: 'duration',
    itemId: 'i1',
    activityId: 'a1',
    title: 'Organizar la casa',
    icon: 'fa-list',
    color: null,
    offsetMinutes: 25,
    dayOfWeek: null,
    basis: '45 min planeados · 1h 10 reales',
    ask: '¿Le damos 1h 10 en tu plantilla?',
    consequence: 'En tu plantilla está 3 días (L X V): se cambia en todos.',
    affirmativeLabel: 'Ponerlo en 1h 10',
    dismissLabel: 'Dejarlo',
    templatePatch: { durationMinutes: 70 },
    dayPatch: { durationMinutes: 70 },
    ...overrides,
  }
}

describe('los avisos pegados al bloque, en Hoy (criterios 87 y 88)', () => {
  it('sin patrones no hay ni un aviso: Hoy es exactamente el de antes (92)', () => {
    expect(pickBlockHints({ patterns: [], blocks: [candidate({ blockId: 'b1', activityId: 'a1' })] }))
      .toEqual([])
  })

  it('el aviso lleva su cuenta, las dos salidas escritas y el número dentro (87)', () => {
    const [hint] = pickBlockHints({
      patterns: [{ occurrences: 6, suggestion: suggestionOf({}) }],
      blocks: [candidate({ blockId: 'b1', activityId: 'a1' })],
    })

    expect(hint?.header).toBe('De tus últimas semanas')
    expect(hint?.counterLabel).toBe('1 de 1')
    expect(hint?.basis).toBe('Organizar la casa te suele llevar 25 min más')
    expect(hint?.ask).toBe('¿lo dejamos en 1h 10?')
    expect(hint?.affirmativeLabel).toBe('Sí, 1h 10')
    expect(hint?.dismissLabel).toBe('Así está bien')
    // La consecuencia, **antes** de tocar nada: D2 y criterio 89.
    expect(hint?.scopeNote).toBe('Esto cambia solo para hoy: tu plantilla se queda como está.')
    expect(hint?.dayPatch).toEqual({ durationMinutes: 70 })
  })

  it('el de la hora dice la hora, y también con dos salidas', () => {
    const [hint] = pickBlockHints({
      patterns: [
        {
          occurrences: 5,
          suggestion: suggestionOf({
            id: 'start-time|i1',
            kind: 'start-time',
            offsetMinutes: 22,
            templatePatch: { startTime: '19:30' },
            dayPatch: { startTime: '19:30' },
            title: 'Pasear a las mascotas',
          }),
        },
      ],
      blocks: [candidate({ blockId: 'b1', activityId: 'a1', startMinutes: 19 * 60, windowStartMinutes: 18 * 60, windowEndMinutes: 21 * 60 })],
    })

    expect(hint?.basis).toBe('Pasear a las mascotas sueles empezarlo 22 min más tarde')
    expect(hint?.ask).toBe('¿lo ponemos a las 19:30?')
    expect(hint?.affirmativeLabel).toBe('Sí, 19:30')
  })

  it('con tres candidatos se pintan DOS, los más repetidos, y el tercero no aparece (88)', () => {
    const hints = pickBlockHints({
      patterns: [
        { occurrences: 4, suggestion: suggestionOf({ id: 'duration|i3', itemId: 'i3', activityId: 'a3' }) },
        { occurrences: 9, suggestion: suggestionOf({ id: 'duration|i1', itemId: 'i1', activityId: 'a1' }) },
        { occurrences: 7, suggestion: suggestionOf({ id: 'duration|i2', itemId: 'i2', activityId: 'a2' }) },
      ],
      blocks: [
        candidate({ blockId: 'b1', activityId: 'a1' }),
        candidate({ blockId: 'b2', activityId: 'a2' }),
        candidate({ blockId: 'b3', activityId: 'a3' }),
      ],
    })

    expect(hints).toHaveLength(2)
    expect(hints.map((hint) => hint.blockId)).toEqual(['b1', 'b2'])
    expect(hints.map((hint) => hint.counterLabel)).toEqual(['1 de 2', '2 de 2'])
  })

  it('nunca dos del mismo bloque, ni dos veces la misma sugerencia', () => {
    const hints = pickBlockHints({
      patterns: [{ occurrences: 6, suggestion: suggestionOf({}) }],
      blocks: [
        candidate({ blockId: 'b1', activityId: 'a1' }),
        candidate({ blockId: 'b2', activityId: 'a1', startMinutes: 15 * 60, windowStartMinutes: 14 * 60, windowEndMinutes: 18 * 60 }),
      ],
    })

    expect(hints).toHaveLength(1)
    expect(hints[0]?.blockId).toBe('b1')
  })

  it('una contestada no llega aquí: el hook ya la calló (88, «entre las que no se han contestado»)', () => {
    expect(
      pickBlockHints({
        patterns: [{ occurrences: 9, suggestion: null }],
        blocks: [candidate({ blockId: 'b1', activityId: 'a1' })],
      }),
    ).toEqual([])
  })

  it('un desfase de diez minutos justos no sale en Hoy: el criterio pide MÁS de 10', () => {
    expect(
      pickBlockHints({
        patterns: [
          {
            occurrences: 9,
            suggestion: suggestionOf({ offsetMinutes: 10, dayPatch: { durationMinutes: 55 } }),
          },
        ],
        blocks: [candidate({ blockId: 'b1', activityId: 'a1' })],
      }),
    ).toEqual([])
  })

  it('«quitar el martes» no se traduce a un día armado: sin `dayPatch`, sin aviso', () => {
    expect(
      pickBlockHints({
        patterns: [
          {
            occurrences: 9,
            suggestion: suggestionOf({
              id: 'drop-day|i1|tuesday',
              kind: 'drop-day',
              offsetMinutes: 70,
              dayOfWeek: 'tuesday',
              templatePatch: { days: ['monday', 'wednesday'] },
              dayPatch: null,
            }),
          },
        ],
        blocks: [candidate({ blockId: 'b1', activityId: 'a1' })],
      }),
    ).toEqual([])
  })

  it('un bloque que ya tiene el número que se propone no vuelve a preguntarlo', () => {
    expect(
      pickBlockHints({
        patterns: [{ occurrences: 9, suggestion: suggestionOf({}) }],
        blocks: [candidate({ blockId: 'b1', activityId: 'a1', durationMinutes: 70 })],
      }),
    ).toEqual([])
  })

  it('si el cambio no cabe en lo libre de alrededor, no se ofrece aquí', () => {
    expect(
      pickBlockHints({
        patterns: [{ occurrences: 9, suggestion: suggestionOf({}) }],
        blocks: [
          candidate({ blockId: 'b1', activityId: 'a1', windowEndMinutes: 9 * 60 + 50 }),
        ],
      }),
    ).toEqual([])
  })

  it('un bloque que ya terminó, o que ya tiene sesión, no recibe aviso', () => {
    expect(
      pickBlockHints({
        patterns: [{ occurrences: 9, suggestion: suggestionOf({}) }],
        blocks: [candidate({ blockId: 'b1', activityId: 'a1', isDone: true })],
      }),
    ).toEqual([])
  })

  it('ni una palabra de reproche en lo que se pinta (93)', () => {
    const [hint] = pickBlockHints({
      patterns: [{ occurrences: 6, suggestion: suggestionOf({ offsetMinutes: -25, dayPatch: { durationMinutes: 20 } }) }],
      blocks: [candidate({ blockId: 'b1', activityId: 'a1' })],
    })
    const texto = [hint?.basis, hint?.ask, hint?.affirmativeLabel, hint?.dismissLabel, hint?.scopeNote]
      .join(' ')
      .toLowerCase()

    expect(hint?.basis).toBe('Organizar la casa te suele llevar 25 min menos')
    for (const palabra of ['desperdicio', 'fallaste', 'incumpl', 'deberías', 'perdiste', 'racha']) {
      expect(texto).not.toContain(palabra)
    }
    expect(texto).not.toMatch(/\bmal\b/)
  })
})

/**
 * **La mitad viva del criterio 91 de FEAT-007.** Los chips del hueco que
 * ofrecían «la duración que sueles tardar» se retiraron —FEAT-010 criterio 381
 * deroga esa mitad— y con ellos `usualDurationsByItemId`. Lo que la costumbre
 * mide **sigue siendo lo mismo** y sigue teniendo dueño: la tarjeta de «Lo que
 * viene» dice «suele durarte N» (criterio 372) leyendo
 * `usualDurationsByActivityId`. Por eso estos dos casos no se borran: se les
 * cambia la puerta de salida, no la aritmética.
 */
describe('la duración que sueles tardar (criterio 91, su mitad viva tras FEAT-010 381)', () => {
  it('con cinco datos la trae, redondeada a cinco minutos', () => {
    const { patterns } = build(
      fiveDays({ startTime: '09:00', durationMinutes: 68 }),
      [item({ id: 'i1', activityId: 'a1' })],
    )

    expect(patterns[0]?.usualDurationSamples).toBe(5)
    expect(patterns[0]?.usualDurationMinutes).toBe(70)
    expect(usualDurationsByActivityId(patterns)).toEqual({ a1: 70 })
  })

  it('planeada cinco veces y registrada dos: **no** hay costumbre que ofrecer', () => {
    const days = fiveDays(null)
    const conDato = FIVE_DATES.slice(0, 2).map((date) =>
      day(date, { activityId: 'a1', startTime: '09:00', durationMinutes: 45 }, {
        startTime: '09:00',
        durationMinutes: 68,
      }),
    )
    const { patterns } = build([...conDato, ...days.slice(2)], [item({ id: 'i1', activityId: 'a1' })])

    expect(patterns[0]?.usualDurationSamples).toBe(2)
    expect(patterns[0]?.usualDurationMinutes).toBeNull()
    expect(usualDurationsByActivityId(patterns)).toEqual({})
  })
})

describe('el dato bajo los campos de la hoja de la plantilla (criterios 95, 96 y 97)', () => {
  it('la línea de «Cuánto» **también cuando va bien**: confirma, no avisa (95)', () => {
    // Cinco veces calcadas: nada que proponer en ninguna de las dos.
    const card = build(fiveDays({ startTime: '09:02', durationMinutes: 45 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ]).patterns[0]!
    const advice = buildTemplateSheetAdvice(card)!

    expect(card.suggestion).toBeNull()
    expect(advice.durationText).toBe('Suele llevarte 45m. Esta duración va bien.')
    expect(advice.durationSuggestion).toBeNull()
    expect(advice.timeText).toBe('Sueles empezar a las 9:02. Esta hora va bien.')
    expect(advice.timeSuggestion).toBeNull()
    expect(advice.flaggedDay).toBeNull()
    // Ni reproche ni porcentaje en ninguna de las dos líneas.
    expect(`${advice.timeText} ${advice.durationText}`).not.toMatch(/%|deberías|mal\b/i)
  })

  it('la propuesta de duración va debajo de «Cuánto», y la hora se queda en su campo', () => {
    const card = build(fiveDays({ startTime: '09:02', durationMinutes: 70 }), [
      item({ id: 'i1', activityId: 'a1' }),
    ]).patterns[0]!
    const advice = buildTemplateSheetAdvice(card)!

    expect(advice.durationSuggestion?.kind).toBe('duration')
    expect(advice.durationSuggestion?.affirmativeLabel).toBe('Ponerlo en 1h 10')
    expect(advice.durationText).toContain('Suele llevarte 1h 10')
    // La hora va bien: se dice, y no lleva salida.
    expect(advice.timeSuggestion).toBeNull()
  })

  it('el día del que habla el aviso viaja aparte, para marcarlo en la fila (96)', () => {
    const template = item({
      id: 'i1',
      activityId: 'a1',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:30',
      durationMinutes: 30,
    })
    const plan = { activityId: 'a1', startTime: '08:30', durationMinutes: 30 }
    const days = [
      day('2026-09-07', plan, { startTime: '08:34', durationMinutes: 30 }),
      day('2026-09-08', plan, { startTime: '09:40', durationMinutes: 30 }),
      day('2026-09-09', plan, { startTime: '08:35', durationMinutes: 30 }),
      day('2026-09-10', plan, { startTime: '08:33', durationMinutes: 30 }),
      day('2026-09-14', plan, { startTime: '08:36', durationMinutes: 30 }),
      day('2026-09-15', plan, { startTime: '09:40', durationMinutes: 30 }),
    ]
    const advice = buildTemplateSheetAdvice(build(days, [template]).patterns[0]!)!

    expect(advice.flaggedDay).toBe('tuesday')
    expect(advice.timeSuggestion?.affirmativeLabel).toBe('Quitar el martes')
    expect(advice.timeText).toContain('Los martes, a las 9:40')
    // La única salida afirmativa es quitar el día: **nunca un borrado**.
    expect(advice.timeSuggestion?.templatePatch).toEqual({
      days: ['monday', 'wednesday', 'thursday', 'friday'],
    })
  })

  it('sin una sola sesión registrada **no hay línea** (97)', () => {
    const card = build(fiveDays(null), [item({ id: 'i1', activityId: 'a1' })]).patterns[0]!
    expect(buildTemplateSheetAdvice(card)).toBeNull()
  })
})

/**
 * **La misma costumbre, por actividad** (FEAT-011, criterio 238). Al registrar
 * en un hueco no hay ítem de plantilla: hay una actividad elegida a mano, que
 * puede ni estar en la plantilla de ese día.
 */
describe('usualDurationsByActivityId', () => {
  const pattern = (
    activityId: string,
    usualDurationMinutes: number | null,
    usualDurationSamples: number,
  ) => ({ activityId, usualDurationMinutes, usualDurationSamples })

  it('devuelve la mediana de cada actividad', () => {
    expect(usualDurationsByActivityId([pattern('a1', 25, 6), pattern('a2', 50, 4)])).toEqual({
      a1: 25,
      a2: 50,
    })
  })

  it('sin costumbre medida, la clave **no está** (criterio 240)', () => {
    expect(usualDurationsByActivityId([pattern('a1', null, 2)])).toEqual({})
    expect(usualDurationsByActivityId([])).toEqual({})
  })

  it('la misma actividad en dos ítems: gana la que más datos tiene', () => {
    expect(
      usualDurationsByActivityId([pattern('a1', 25, 4), pattern('a1', 70, 9)]),
    ).toEqual({ a1: 70 })
    expect(
      usualDurationsByActivityId([pattern('a1', 70, 9), pattern('a1', 25, 4)]),
    ).toEqual({ a1: 70 })
  })

  it('con empate de datos manda la primera: mezclar dos medianas inventaría un número', () => {
    expect(
      usualDurationsByActivityId([pattern('a1', 25, 5), pattern('a1', 70, 5)]),
    ).toEqual({ a1: 25 })
  })
})
