import { describe, expect, it } from 'vitest'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  composeIdentityEvidence,
  composeIdentityLine,
  composeMomentHeadline,
  composePortrait,
  composePurposeDescription,
  composeSetbackLine,
  composeTraitProgressLine,
  detectHabitMilestone,
  formatEvidenceSentence,
  getIdentityVisibility,
  getSnoozeUntil,
  getTraitProgress,
  readPurposeDescription,
  selectIdentityMoment,
  type HabitIdentitySilence,
} from '@/features/habits/utils/habit-identity.utils'
import { getIdentitySuggestions } from '@/features/habits/data/identity-suggestions'

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    userId: '1',
    name: 'Meditar',
    description: null,
    habitType: 'boolean',
    periodDays: 1,
    restartCount: 0,
    weeklyLifelines: 1,
    status: 'active',
    hidden: false,
    shouldAvoid: false,
    shouldKeep: false,
    streak: 0,
    maxStreak: 0,
    days: 0,
    dailyGoal: 0,
    timerGoal: 0,
    timesGoal: 0,
    icon: 'spa',
    color: null,
    orderIndex: 0,
    startDate: null,
    endDate: null,
    categoryId: null,
    measureId: null,
    purposeId: null,
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  }
}

const NO_WINDOW = { previousAccomplishedDates: [], previousWindowStart: '2026-09-18' }

describe('detectHabitMilestone', () => {
  it('no celebra nada si hoy no se ha cumplido', () => {
    const habit = makeHabit({ streak: 7 })
    expect(
      detectHabitMilestone({
        habit,
        date: '2026-09-18',
        accomplishedToday: false,
        ...NO_WINDOW,
      }),
    ).toBeNull()
  })

  it('detecta el séptimo día seguido', () => {
    const habit = makeHabit({ streak: 7, maxStreak: 7 })
    expect(
      detectHabitMilestone({
        habit,
        date: '2026-09-18',
        accomplishedToday: true,
        ...NO_WINDOW,
      }),
    ).toBe('racha7')
  })

  it('detecta el récord solo por encima de tres días', () => {
    const record = makeHabit({ streak: 9, maxStreak: 9 })
    expect(
      detectHabitMilestone({ habit: record, date: '2026-09-18', accomplishedToday: true, ...NO_WINDOW }),
    ).toBe('record')

    const tiny = makeHabit({ streak: 3, maxStreak: 3 })
    expect(
      detectHabitMilestone({ habit: tiny, date: '2026-09-18', accomplishedToday: true, ...NO_WINDOW }),
    ).toBeNull()
  })

  it('detecta los tres meses el primer día del mes', () => {
    const habit = makeHabit({ streak: 2, maxStreak: 12, days: 64 })
    expect(
      detectHabitMilestone({ habit, date: '2026-10-01', accomplishedToday: true, ...NO_WINDOW }),
    ).toBe('mes')
    expect(
      detectHabitMilestone({ habit, date: '2026-10-02', accomplishedToday: true, ...NO_WINDOW }),
    ).toBeNull()
  })

  it('detecta el regreso tras siete días sin cumplir', () => {
    const habit = makeHabit({ streak: 1, maxStreak: 20, days: 40, restartCount: 2 })
    expect(
      detectHabitMilestone({
        habit,
        date: '2026-09-18',
        accomplishedToday: true,
        previousAccomplishedDates: ['2026-09-01'],
        previousWindowStart: '2026-08-20',
      }),
    ).toBe('regreso')
  })

  it('no lo llama regreso si cumplió hace tres días', () => {
    const habit = makeHabit({ streak: 1, maxStreak: 20, days: 40, restartCount: 2 })
    expect(
      detectHabitMilestone({
        habit,
        date: '2026-09-18',
        accomplishedToday: true,
        previousAccomplishedDates: ['2026-09-15'],
        previousWindowStart: '2026-08-20',
      }),
    ).toBeNull()
  })

  it('calla el regreso cuando la ventana consultada no llega a siete días', () => {
    const habit = makeHabit({ streak: 1, maxStreak: 20, days: 40, restartCount: 2 })
    expect(
      detectHabitMilestone({
        habit,
        date: '2026-09-18',
        accomplishedToday: true,
        previousAccomplishedDates: [],
        previousWindowStart: '2026-09-16',
      }),
    ).toBeNull()
  })
})

describe('selectIdentityMoment', () => {
  const quiet: HabitIdentitySilence = { snoozedUntil: {}, lastShown: null }

  it('gana el de racha más larga cuando hay dos el mismo día', () => {
    const a = { habit: makeHabit({ id: 'a', streak: 7 }), milestone: 'racha7' as const }
    const b = { habit: makeHabit({ id: 'b', streak: 21 }), milestone: 'record' as const }
    expect(selectIdentityMoment([a, b], quiet, '2026-09-18')?.habit.id).toBe('b')
  })

  it('respeta los catorce días de silencio tras un «ahora no»', () => {
    const candidate = { habit: makeHabit({ id: 'a', streak: 7 }), milestone: 'racha7' as const }
    const silence: HabitIdentitySilence = {
      snoozedUntil: { a: getSnoozeUntil('2026-09-18') },
      lastShown: null,
    }
    expect(selectIdentityMoment([candidate], silence, '2026-09-20')).toBeNull()
    expect(selectIdentityMoment([candidate], silence, '2026-10-02')?.habit.id).toBe('a')
  })

  it('no enseña más de uno por semana', () => {
    const candidate = { habit: makeHabit({ id: 'b', streak: 7 }), milestone: 'racha7' as const }
    const silence: HabitIdentitySilence = {
      snoozedUntil: {},
      lastShown: { habitId: 'a', date: '2026-09-15' },
    }
    expect(selectIdentityMoment([candidate], silence, '2026-09-18')).toBeNull()
    expect(selectIdentityMoment([candidate], silence, '2026-09-23')?.habit.id).toBe('b')
  })

  it('vuelve a pintar el mismo hito del mismo día', () => {
    const a = { habit: makeHabit({ id: 'a', streak: 7 }), milestone: 'racha7' as const }
    const b = { habit: makeHabit({ id: 'b', streak: 30 }), milestone: 'record' as const }
    const silence: HabitIdentitySilence = {
      snoozedUntil: {},
      lastShown: { habitId: 'a', date: '2026-09-18' },
    }
    expect(selectIdentityMoment([a, b], silence, '2026-09-18')?.habit.id).toBe('a')
  })
})

describe('readPurposeDescription — los casos feos', () => {
  it('la descripción vacía no es evidencia ni texto', () => {
    expect(readPurposeDescription(null)).toEqual({ evidence: null, freeText: '' })
    expect(readPurposeDescription('')).toEqual({ evidence: null, freeText: '' })
    expect(readPurposeDescription(undefined)).toEqual({ evidence: null, freeText: '' })
  })

  it('lee la evidencia sola', () => {
    const note = readPurposeDescription('Ganado el 2026-08-12 · racha7 · 7 días seguidos')
    expect(note.evidence).toEqual({
      wonAt: '2026-08-12',
      milestone: 'racha7',
      detail: '7 días seguidos',
    })
    expect(note.freeText).toBe('')
  })

  it('lee la evidencia y devuelve el texto libre intacto', () => {
    const raw = 'Ganado el 2026-08-12 · racha7 · 7 días seguidos\n\nEsto lo escribí yo.\nY esto también.'
    const note = readPurposeDescription(raw)
    expect(note.evidence?.wonAt).toBe('2026-08-12')
    expect(note.freeText).toBe('Esto lo escribí yo.\nY esto también.')
    expect(composePurposeDescription(note)).toBe(raw)
  })

  it('un texto libre que empieza por «Ganado» se queda como texto libre', () => {
    const raw = 'Ganado el partido del domingo, y me sentí imparable'
    const note = readPurposeDescription(raw)
    expect(note.evidence).toBeNull()
    expect(note.freeText).toBe(raw)
    expect(composePurposeDescription(note)).toBe(raw)
  })

  it('una fecha inválida convierte todo en texto libre', () => {
    const raw = 'Ganado el 2026-02-31 · racha7 · 7 días seguidos'
    const note = readPurposeDescription(raw)
    expect(note.evidence).toBeNull()
    expect(note.freeText).toBe(raw)
  })

  it('una fecha con otro formato convierte todo en texto libre', () => {
    const raw = 'Ganado el 12/08/2026 · racha7 · 7 días seguidos'
    expect(readPurposeDescription(raw).evidence).toBeNull()
    expect(readPurposeDescription(raw).freeText).toBe(raw)
  })

  it('un hito desconocido convierte todo en texto libre', () => {
    const raw = 'Ganado el 2026-08-12 · racha8 · 8 días seguidos'
    expect(readPurposeDescription(raw).evidence).toBeNull()
    expect(readPurposeDescription(raw).freeText).toBe(raw)
  })

  it('varias líneas en blanco se conservan carácter a carácter', () => {
    const raw = 'Ganado el 2026-08-12 · racha7 · 7 días seguidos\n\n\n\nTexto con aire.'
    const note = readPurposeDescription(raw)
    expect(note.evidence?.milestone).toBe('racha7')
    expect(note.freeText).toBe('\n\nTexto con aire.')
    expect(composePurposeDescription(note)).toBe(raw)
  })

  it('sin línea en blanco tras la evidencia no la reconocemos', () => {
    const raw = 'Ganado el 2026-08-12 · racha7 · 7 días seguidos\nPegado justo debajo'
    const note = readPurposeDescription(raw)
    expect(note.evidence).toBeNull()
    expect(note.freeText).toBe(raw)
  })

  it('un salto suelto al final no se reescribe', () => {
    const raw = 'Ganado el 2026-08-12 · racha7 · 7 días seguidos\n'
    const note = readPurposeDescription(raw)
    expect(note.evidence).toBeNull()
    expect(note.freeText).toBe(raw)
    expect(composePurposeDescription(note)).toBe(raw)
  })

  it('un separador de más hace la línea ambigua y la deja intacta', () => {
    const raw = 'Ganado el 2026-08-12 · racha7 · 7 días · seguidos'
    expect(readPurposeDescription(raw).evidence).toBeNull()
    expect(readPurposeDescription(raw).freeText).toBe(raw)
  })

  it('ida y vuelta sin pérdidas para cualquier texto libre', () => {
    const samples = [
      'Ser mejor padre',
      '  espacios    raros  ',
      'Ganado',
      'Ganado el ',
      '\n\n',
      'línea 1\nlínea 2',
    ]
    for (const sample of samples) {
      const note = readPurposeDescription(sample)
      expect(composePurposeDescription(note)).toBe(sample)
    }
  })
})

describe('composeIdentityEvidence', () => {
  it('compone la primera línea con el formato estable', () => {
    expect(
      composeIdentityEvidence({
        wonAt: '2026-08-12',
        milestone: 'racha7',
        detail: '7 días seguidos',
      }),
    ).toBe('Ganado el 2026-08-12 · racha7 · 7 días seguidos')
  })

  it('lo que se compone se vuelve a leer', () => {
    const evidence = {
      wonAt: '2026-08-12',
      milestone: 'record' as const,
      detail: 'récord de 21 días',
    }
    expect(readPurposeDescription(composeIdentityEvidence(evidence)).evidence).toEqual(evidence)
  })
})

describe('la regla innegociable', () => {
  it('oculta la identidad en un día fallado y con salvavidas gastado', () => {
    expect(getIdentityVisibility('failed')).toBe('hidden')
    expect(getIdentityVisibility('lifeline')).toBe('hidden')
  })

  it('la enseña al empezar y al lograr', () => {
    expect(getIdentityVisibility('empty')).toBe('start')
    expect(getIdentityVisibility('partial')).toBe('start')
    expect(getIdentityVisibility('accomplished')).toBe('done')
  })

  it('la frase del día fallado habla de la racha y del salvavidas, de nada más', () => {
    const line = composeSetbackLine(34, 1)
    expect(line).toBe('Un mal día no borra 34. Te queda 1 salvavidas esta semana.')
    expect(composeSetbackLine(34, 2)).toContain('Te quedan 2 salvavidas')
    expect(composeSetbackLine(0, 0)).toBe('No te quedan salvavidas esta semana.')
  })

  it('compone la línea de identidad en los dos tonos que sí empujan', () => {
    expect(composeIdentityLine('Alguien sereno', 'done')).toBe('Un día más siendo alguien sereno.')
    expect(composeIdentityLine('Alguien sereno', 'start')).toBe('Hoy, alguien sereno.')
  })
})

describe('composePortrait', () => {
  const trait = (name: string, habitName: string, days: number) => ({
    name,
    habitName,
    days,
    shouldAvoid: false,
    streak: 0,
  })

  it('con menos de dos rasgos ganados no se inventa una frase', () => {
    expect(
      composePortrait({ traits: [trait('Alguien sereno', 'Meditar', 34)], records: 34, from: '2026-06-20', to: '2026-09-18' }),
    ).toBeNull()
    expect(composePortrait({ traits: [], records: 0, from: null, to: '2026-09-18' })).toBeNull()
  })

  it('compone el retrato con los rasgos y sus hábitos', () => {
    const portrait = composePortrait({
      traits: [
        trait('Alguien sereno', 'Meditar', 34),
        trait('Alguien que lee', 'Leer', 21),
        { name: 'Alguien presente', habitName: 'Redes por la mañana', days: 0, shouldAvoid: true, streak: 18 },
      ],
      records: 214,
      from: '2026-06-20',
      to: '2026-09-18',
    })

    expect(portrait?.lead).toBe('Alguien sereno, que lee y presente.')
    expect(portrait?.support).toBe(
      'Lo sostienen Meditar (34 días), Leer (21 días) y 18 días sin Redes por la mañana.',
    )
    expect(portrait?.source).toBe(
      'Compuesto con 214 registros entre el 20 de junio y el 18 de septiembre',
    )
  })
})

describe('«en camino»', () => {
  it('calcula lo que falta con datos reales', () => {
    expect(getTraitProgress(4)).toEqual({ done: 4, target: 7, remaining: 3, ratio: 4 / 7 })
    expect(getTraitProgress(9)).toEqual({ done: 7, target: 7, remaining: 0, ratio: 1 })
    expect(getTraitProgress(-2)).toEqual({ done: 0, target: 7, remaining: 7, ratio: 0 })
  })

  it('escribe lo que falta en palabras', () => {
    expect(composeTraitProgressLine(getTraitProgress(4))).toBe(
      'Cuatro de los últimos siete días. Faltan 3 para que esto se convierta en un rasgo que puedas reclamar.',
    )
    expect(composeTraitProgressLine(getTraitProgress(7))).toContain('Ya puedes reclamarlo.')
  })
})

describe('microcopia del hito', () => {
  it('el titular nombra el hábito y el hito', () => {
    expect(composeMomentHeadline('racha7', makeHabit())).toBe('Siete días seguidos con Meditar.')
    expect(composeMomentHeadline('regreso', makeHabit())).toBe(
      'Volviste a Meditar después de dejarlo.',
    )
  })

  it('la evidencia sin fecha no inventa una', () => {
    expect(formatEvidenceSentence(null)).toBe(
      'Lo escribiste tú. No hay fecha guardada de cuándo se ganó.',
    )
    expect(
      formatEvidenceSentence({ wonAt: '2026-08-12', milestone: 'racha7', detail: '7 días seguidos' }),
    ).toBe('Lo ganaste el 12 de agosto, al séptimo día seguido.')
  })
})

describe('getIdentitySuggestions', () => {
  it('propone siempre tres', () => {
    expect(getIdentitySuggestions({ habitName: 'Meditar' })).toHaveLength(3)
    expect(getIdentitySuggestions({ habitName: 'Zzzz sin categoría' })).toHaveLength(3)
    expect(getIdentitySuggestions({ habitName: 'Leer', shouldAvoid: true })).toHaveLength(3)
  })

  it('propone por palabra del nombre', () => {
    const names = getIdentitySuggestions({ habitName: 'Meditar 15 minutos' }).map((s) => s.name)
    expect(names).toEqual([
      'Alguien sereno',
      'Alguien que se cuida',
      'Alguien que empieza el día en calma',
    ])
  })

  it('propone por categoría cuando el nombre no dice nada', () => {
    const names = getIdentitySuggestions({ habitName: 'Rutina X', categoryName: 'Fitness' }).map(
      (s) => s.name,
    )
    expect(names).toContain('Alguien fuerte')
  })

  it('cae en el genérico decente cuando nada encaja', () => {
    expect(getIdentitySuggestions({ habitName: 'Qwerty' }).map((s) => s.name)).toEqual([
      'Alguien constante',
      'Alguien que cumple lo que dice',
      'Alguien que se cuida',
    ])
  })

  it('no vuelve a proponer lo descartado, y aun así devuelve tres', () => {
    const result = getIdentitySuggestions({
      habitName: 'Meditar',
      excludeIds: ['sereno', 'se-cuida', 'empieza-en-calma'],
    })
    expect(result).toHaveLength(3)
    expect(result.map((s) => s.id)).not.toContain('sereno')
  })

  it('los hábitos que se dejan atrás reciben identidades de dejar atrás', () => {
    const names = getIdentitySuggestions({
      habitName: 'Redes por la mañana',
      shouldAvoid: true,
    }).map((s) => s.name)
    expect(names).toContain('Alguien dueño de su atención')
  })
})
