import { describe, expect, it } from 'vitest'
import type {
  Habit,
  HabitDayEntry,
  HabitDayStatus,
  HabitFollowUp,
} from '@/features/habits/types/habit.types'
import {
  buildAverageDifficulty,
  buildDayEntries,
  buildDifficultySeries,
  buildGoalSeries,
  buildRangeSummary,
  buildStreakEpisodes,
  buildWeekdayBreakdown,
  buildWeeklyCompliance,
  composeReading,
  composeWeekdayFailNote,
  countComebacks,
  countDaysInclusive,
  getWeekdayIndex,
  getComparableWeekdays,
  getMostFailedWeekday,
  leadsByFar,
  hasAnyDifficulty,
  resolvePreviousWindow,
  resolveRangeWindow,
  shouldShowGoalChart,
} from '@/features/habits/utils/habit-panel.utils'
import { addDaysToString } from '@/features/habits/utils/habit-type.utils'

function makeFollowUp(overrides: Partial<HabitFollowUp> = {}): HabitFollowUp {
  return {
    id: 'fu-1',
    date: '2026-09-01',
    habitId: 'h-1',
    isAccomplished: true,
    isFailed: false,
    isLifeline: false,
    difficulty: null,
    count: null,
    time: null,
    notes: null,
    story: null,
    archived: false,
    timeOfDay: null,
    ...overrides,
  }
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h-1',
    userId: '1',
    name: 'Meditar',
    description: null,
    habitType: 'boolean',
    periodDays: 0,
    restartCount: 0,
    weeklyLifelines: 2,
    status: 'active',
    hidden: false,
    shouldAvoid: false,
    shouldKeep: true,
    streak: 0,
    maxStreak: 0,
    days: 0,
    dailyGoal: 0,
    timerGoal: 0,
    timesGoal: 0,
    icon: null,
    color: null,
    orderIndex: 0,
    startDate: '2026-01-01',
    endDate: null,
    categoryId: null,
    measureId: null,
    purposeId: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

/**
 * Días desde una cadena de estados: `a` logrado, `l` salvavidas, `f` fallado,
 * `.` sin registro. `2026-09-07` es lunes.
 */
function daysFrom(first: string, pattern: string): HabitDayEntry[] {
  const statuses: Record<string, HabitDayStatus> = {
    a: 'accomplished',
    l: 'lifeline',
    f: 'failed',
    '.': 'empty',
  }
  return [...pattern].map((token, index) => {
    const date = addDaysToString(first, index)
    const status = statuses[token]
    return {
      date,
      status,
      followUp:
        status === 'empty'
          ? null
          : makeFollowUp({
              date,
              isAccomplished: status === 'accomplished',
              isFailed: status === 'failed',
              isLifeline: status === 'lifeline',
            }),
    }
  })
}

describe('habit-panel.utils · fechas y ventanas', () => {
  it('countDaysInclusive cuenta ambos extremos y devuelve 0 si el rango está invertido', () => {
    expect(countDaysInclusive('2026-09-01', '2026-09-01')).toBe(1)
    expect(countDaysInclusive('2026-09-01', '2026-09-10')).toBe(10)
    expect(countDaysInclusive('2026-09-10', '2026-09-01')).toBe(0)
  })

  it('getWeekdayIndex pone el lunes en 0 y el domingo en 6', () => {
    expect(getWeekdayIndex('2026-09-07')).toBe(0)
    expect(getWeekdayIndex('2026-09-13')).toBe(6)
  })

  it('resolveRangeWindow recorta el eje a la fecha de inicio del hábito', () => {
    // Hábito creado hace 10 días, rango de 90: el eje empieza en su fecha de inicio.
    const window = resolveRangeWindow(90, '2026-09-08', '2026-09-17')
    expect(window.from).toBe('2026-09-08')
    expect(window.to).toBe('2026-09-17')
    expect(window.days).toBe(10)
  })

  it('resolveRangeWindow usa el rango completo cuando el hábito es más viejo', () => {
    const window = resolveRangeWindow(30, '2020-01-01', '2026-09-17')
    expect(window.from).toBe('2026-08-19')
    expect(window.days).toBe(30)
  })

  it('resolveRangeWindow no pasa de la fecha de fin del hábito', () => {
    const window = resolveRangeWindow(30, '2020-01-01', '2026-09-17', '2026-09-10')
    expect(window.to).toBe('2026-09-10')
  })

  it('resolvePreviousWindow devuelve null cuando el hábito no llega más atrás', () => {
    const current = resolveRangeWindow(90, '2026-09-08', '2026-09-17')
    expect(resolvePreviousWindow(current, 90, '2026-09-08')).toBeNull()
  })

  it('resolvePreviousWindow devuelve el tramo previo de igual longitud', () => {
    const current = resolveRangeWindow(30, '2020-01-01', '2026-09-17')
    const previous = resolvePreviousWindow(current, 30, '2020-01-01')
    expect(previous).toEqual({ from: '2026-07-20', to: '2026-08-18', days: 30 })
  })

  it('resolvePreviousWindow descarta un tramo previo demasiado corto', () => {
    // El hábito arrancó solo 3 días antes del tramo actual: comparar no dice nada.
    const current = resolveRangeWindow(30, '2026-08-16', '2026-09-17')
    const previous = resolvePreviousWindow(current, 30, '2026-08-16')
    expect(previous).toBeNull()
  })
})

describe('habit-panel.utils · buildDayEntries', () => {
  it('materializa un día por fecha, con o sin registro', () => {
    const habit = makeHabit()
    const followUps = new Map([['2026-09-08', makeFollowUp({ date: '2026-09-08' })]])
    const entries = buildDayEntries(habit, { from: '2026-09-07', to: '2026-09-09', days: 3 }, followUps)

    expect(entries.map((entry) => entry.status)).toEqual(['empty', 'accomplished', 'empty'])
    expect(entries[1].followUp).not.toBeNull()
  })

  it('devuelve vacío cuando la ventana no tiene días', () => {
    expect(buildDayEntries(makeHabit(), { from: '2026-09-09', to: '2026-09-07', days: 0 }, new Map()))
      .toEqual([])
  })
})

describe('habit-panel.utils · buildRangeSummary', () => {
  it('un rango vacío no rompe ni inventa porcentajes', () => {
    expect(buildRangeSummary([])).toEqual({
      total: 0,
      covered: 0,
      accomplished: 0,
      lifelines: 0,
      failed: 0,
      untracked: 0,
      percent: 0,
    })
  })

  it('un solo día cubierto da el 100%', () => {
    expect(buildRangeSummary(daysFrom('2026-09-07', 'a')).percent).toBe(100)
  })

  it('el salvavidas cuenta como cubierto y el hueco no es un fallo', () => {
    const summary = buildRangeSummary(daysFrom('2026-09-07', 'alf.'))
    expect(summary).toMatchObject({
      total: 4,
      accomplished: 1,
      lifelines: 1,
      covered: 2,
      failed: 1,
      untracked: 1,
      percent: 50,
    })
  })
})

describe('habit-panel.utils · buildWeeklyCompliance', () => {
  it('agrupa por semana ISO y empieza en lunes', () => {
    // 2026-09-07 es lunes: 7 días cubiertos, luego 7 días a medias.
    const weeks = buildWeeklyCompliance(daysFrom('2026-09-07', 'aaaaaaaaaaf...f'))
    expect(weeks).toHaveLength(3)
    expect(weeks[0].weekStart).toBe('2026-09-07')
    expect(weeks[0].percent).toBe(100)
    expect(weeks[1].weekStart).toBe('2026-09-14')
    expect(weeks[1].percent).toBe(43)
  })

  it('una semana parcial solo cuenta los días que hay en el rango', () => {
    const weeks = buildWeeklyCompliance(daysFrom('2026-09-11', 'aa.'))
    expect(weeks[0].total).toBe(3)
    expect(weeks[0].percent).toBe(67)
  })

  it('un rango vacío no produce semanas', () => {
    expect(buildWeeklyCompliance([])).toEqual([])
  })

  it('promedia la dificultad registrada en cada semana', () => {
    const days = daysFrom('2026-09-07', 'aa')
    days[0].followUp!.difficulty = 4
    days[1].followUp!.difficulty = 2
    expect(buildWeeklyCompliance(days)[0].avgDifficulty).toBe(3)
  })
})

describe('habit-panel.utils · buildWeekdayBreakdown', () => {
  it('siempre devuelve siete días, aunque el rango no los cubra todos', () => {
    const stats = buildWeekdayBreakdown(daysFrom('2026-09-07', 'aa'))
    expect(stats).toHaveLength(7)
    expect(stats.map((stat) => stat.label)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
    expect(stats[2].total).toBe(0)
    expect(stats[2].percent).toBe(0)
  })

  it('separa fallos de huecos en cada día de la semana', () => {
    // Dos semanas: el domingo falla una vez y la otra no hay registro.
    const stats = buildWeekdayBreakdown(daysFrom('2026-09-07', 'aaaaaafaaaaaa.'))
    const sunday = stats[6]
    expect(sunday).toMatchObject({ total: 2, covered: 0, failed: 1, untracked: 1, percent: 0 })
  })

  it('cuenta las apariciones con registro aparte del total', () => {
    // Dos domingos: uno fallado, otro sin registro. Solo uno cuenta como aparición.
    const sunday = buildWeekdayBreakdown(daysFrom('2026-09-07', 'aaaaaafaaaaaa.'))[6]
    expect(sunday).toMatchObject({ total: 2, tracked: 1, failed: 1, untracked: 1 })
  })
})

/**
 * El umbral (`MIN_TRACKED_PER_WEEKDAY = 4`) manda sobre todo lo de aquí: decide
 * si el panel habla o calla, y por eso cada caso de abajo es un estado distinto
 * del panel, no una variante del mismo.
 */
describe('habit-panel.utils · dónde se falla, contado como fallos', () => {
  /** `pattern` son los siete días de una semana, repetidos `count` veces. */
  function weeks(pattern: string, count: number): HabitDayEntry[] {
    return daysFrom('2026-09-07', pattern.repeat(count))
  }

  it('señala el día de más fallos, no el de menos cumplimiento (criterio 441)', () => {
    // Seis domingos SIN REGISTRAR y 0 fallados; seis martes con 4 fallados.
    // Por porcentaje de cumplimiento ganaba el domingo (0%); por fallos, el martes.
    const days = [...weeks('afaaaa.', 4), ...weeks('aaaaaa.', 2)]
    const stats = buildWeekdayBreakdown(days)

    expect(stats[6]).toMatchObject({ longLabel: 'domingo', tracked: 0, failed: 0, untracked: 6 })
    expect(stats[1]).toMatchObject({ longLabel: 'martes', tracked: 6, failed: 4 })
    expect(stats[6].percent).toBe(0)

    expect(getMostFailedWeekday(stats)?.longLabel).toBe('martes')
    expect(composeWeekdayFailNote(stats, getMostFailedWeekday(stats))).toBe(
      'Los martes fallas 4 de 6 veces. Es el día donde más se te cae, de largo.',
    )
  })

  it('un día sin registrar no entra en el denominador (criterio 440)', () => {
    // Seis viernes: dos fallados, dos cumplidos y dos sin registrar.
    const days = [...weeks('aaaafa.', 2), ...weeks('aaaaaa.', 2), ...weeks('aaaa.a.', 2)]
    const friday = buildWeekdayBreakdown(days)[4]
    expect(friday).toMatchObject({ total: 6, tracked: 4, covered: 2, failed: 2, untracked: 2 })
  })

  it('con menos de 4 apariciones no señala nada y dice cuánto falta (criterio 442)', () => {
    const stats = buildWeekdayBreakdown(weeks('afaaaa.', 3))
    expect(getComparableWeekdays(stats)).toHaveLength(0)
    expect(getMostFailedWeekday(stats)).toBeNull()
    expect(composeWeekdayFailNote(stats, null)).toBe(
      'De cada día de la semana hay 3 registros o menos en este tramo. Con 4 ya se puede comparar: todavía no hay bastante para decir dónde se te cae.',
    )
  })

  it('con un solo día comparable tampoco compara, y lo dice (criterio 442)', () => {
    const stats = buildWeekdayBreakdown(weeks('f......', 4))
    expect(getComparableWeekdays(stats)).toHaveLength(1)
    expect(getMostFailedWeekday(stats)).toBeNull()
    expect(composeWeekdayFailNote(stats, null)).toBe(
      'Solo los lunes llegan a 4 registros en este tramo. Con 2 días ya se puede comparar.',
    )
  })

  it('al callar cuenta registros, no apariciones en el calendario', () => {
    // Nueve semanas (63 días): los martes aparecen NUEVE veces en el tramo,
    // pero solo tres están registrados. La frase tiene que hablar de los tres
    // registros y no decir que el martes «apareció» tres veces.
    const days = [...weeks('.f.....', 3), ...weeks('.......', 6)]
    const stats = buildWeekdayBreakdown(days)
    expect(stats[1]).toMatchObject({ longLabel: 'martes', total: 9, tracked: 3, untracked: 6 })

    const note = composeWeekdayFailNote(stats, getMostFailedWeekday(stats))
    expect(note).toBe(
      'De cada día de la semana hay 3 registros o menos en este tramo. Con 4 ya se puede comparar: todavía no hay bastante para decir dónde se te cae.',
    )
    // La cifra que se dice es la de registros; la de apariciones sería 9.
    expect(note).not.toMatch(/aparec/i)
    expect(note).not.toContain('9')
  })

  it('con un solo día comparable tampoco llama apariciones a los registros', () => {
    // Nueve semanas: lunes con 6 registros, martes con 3; los martes siguen
    // apareciendo nueve veces en el tramo.
    const stats = buildWeekdayBreakdown([
      ...weeks('ff.....', 3),
      ...weeks('a......', 3),
      ...weeks('.......', 3),
    ])
    expect(stats[0]).toMatchObject({ longLabel: 'lunes', total: 9, tracked: 6 })
    expect(stats[1]).toMatchObject({ longLabel: 'martes', total: 9, tracked: 3 })

    const note = composeWeekdayFailNote(stats, getMostFailedWeekday(stats))
    expect(note).toBe(
      'Solo los lunes llegan a 4 registros en este tramo. Con 2 días ya se puede comparar.',
    )
    expect(note).not.toMatch(/aparic|aparec/i)
  })

  it('no desempata en silencio cuando dos días empatan arriba (criterio 443)', () => {
    const stats = buildWeekdayBreakdown([...weeks('ffaaaa.', 3), ...weeks('aaaaaa.', 3)])
    expect(getMostFailedWeekday(stats)).toBeNull()
    expect(composeWeekdayFailNote(stats, null)).toBe(
      'Ningún día destaca en este tramo: 2 días empatan a 3 fallos.',
    )
  })

  it('sin ningún fallo no inventa un día flojo (criterio 443)', () => {
    const stats = buildWeekdayBreakdown(weeks('aaaaaaa', 4))
    expect(getMostFailedWeekday(stats)).toBeNull()
    expect(composeWeekdayFailNote(stats, null)).toBe('En este tramo no hay ningún día fallado.')
  })

  it('«de largo» solo se dice cuando la ventaja es de verdad', () => {
    // Lunes 3 fallos de 4, martes 2 de 4: va por delante, pero no de largo.
    const close = buildWeekdayBreakdown([
      ...weeks('ffaaaa.', 2),
      ...weeks('faaaaa.', 1),
      ...weeks('aaaaaa.', 1),
    ])
    const closeTop = getMostFailedWeekday(close)
    expect(closeTop?.longLabel).toBe('lunes')
    expect(leadsByFar(close, closeTop!)).toBe(false)
    expect(composeWeekdayFailNote(close, closeTop)).toBe(
      'Los lunes fallas 3 de 4 veces. Es el día donde más se te cae.',
    )
  })

  it('sin ninguna aparición con registro no escribe nada', () => {
    expect(composeWeekdayFailNote(buildWeekdayBreakdown([]), null)).toBeNull()
    expect(composeWeekdayFailNote(buildWeekdayBreakdown(weeks('.......', 4)), null)).toBeNull()
  })

  it('ni la frase ni sus estados contienen reproche (criterios 444 y 446)', () => {
    const prohibidas =
      /sueles fallar|tu punto flaco|tu peor día|incumpliste|fallaste|no lo lograste|deberías|intenta|ánimo|llevas \d+ días sin|vas peor|vas mejor/i
    const stats = [
      buildWeekdayBreakdown([...weeks('afaaaa.', 4), ...weeks('aaaaaa.', 2)]),
      buildWeekdayBreakdown(weeks('afaaaa.', 3)),
      buildWeekdayBreakdown(weeks('f......', 4)),
      buildWeekdayBreakdown([...weeks('ffaaaa.', 3), ...weeks('aaaaaa.', 3)]),
      buildWeekdayBreakdown(weeks('aaaaaaa', 4)),
    ]
    for (const stat of stats) {
      const note = composeWeekdayFailNote(stat, getMostFailedWeekday(stat)) ?? ''
      expect(note).not.toMatch(prohibidas)
      expect(note).not.toMatch(/sueles|siempre|nunca|otra vez|ya van/i)
      // El guardián que heredó esta frase de `composeReading`: la regla de
      // producto del módulo, que no es la lista de frases prohibidas.
      expect(note).not.toMatch(/propósito|identidad|recaíd/i)
    }
  })
})

describe('habit-panel.utils · buildStreakEpisodes', () => {
  it('un rango vacío no tiene episodios', () => {
    expect(buildStreakEpisodes([])).toEqual([])
  })

  it('un solo día cubierto es una racha en curso de un día', () => {
    const episodes = buildStreakEpisodes(daysFrom('2026-09-07', 'a'))
    expect(episodes).toHaveLength(1)
    expect(episodes[0]).toMatchObject({ length: 1, isCurrent: true, isRecord: true })
  })

  it('los huecos sin registro rompen la racha igual que un fallo', () => {
    const episodes = buildStreakEpisodes(daysFrom('2026-09-07', 'aa.aaafa'))
    expect(episodes.map((episode) => episode.length)).toEqual([2, 3, 1])
  })

  it('marca como en curso la racha que llega al último día del rango', () => {
    const episodes = buildStreakEpisodes(daysFrom('2026-09-07', 'aaa.aaaaa'))
    expect(episodes[0].isCurrent).toBe(false)
    expect(episodes[1]).toMatchObject({ length: 5, isCurrent: true, isRecord: true })
  })

  it('una racha cortada al final del rango no está en curso', () => {
    const episodes = buildStreakEpisodes(daysFrom('2026-09-07', 'aaaf'))
    expect(episodes[0].isCurrent).toBe(false)
  })

  it('el récord es uno solo aunque haya empate', () => {
    const episodes = buildStreakEpisodes(daysFrom('2026-09-07', 'aa.aa'))
    expect(episodes.filter((episode) => episode.isRecord)).toHaveLength(1)
    expect(episodes[0].isRecord).toBe(true)
  })
})

describe('habit-panel.utils · countComebacks', () => {
  it('no cuenta la primera racha del rango como una vuelta', () => {
    expect(countComebacks(daysFrom('2026-09-07', 'aaaaa'))).toEqual({
      total: 0,
      lastDaysAgo: null,
    })
  })

  it('cuenta cada racha que arranca después de un hueco', () => {
    // Vuelve el día 4 y el día 8; el rango acaba el día 9.
    const result = countComebacks(daysFrom('2026-09-07', 'aa.aa.faa'))
    expect(result.total).toBe(2)
    expect(result.lastDaysAgo).toBe(1)
  })

  it('un rango vacío no tiene vueltas', () => {
    expect(countComebacks([])).toEqual({ total: 0, lastDaysAgo: null })
  })
})

describe('habit-panel.utils · composeReading', () => {
  const current = buildRangeSummary(daysFrom('2026-09-07', 'aaaaaaaaff'))
  const worse = buildRangeSummary(daysFrom('2026-09-07', 'aaaaffffff'))

  it('no escribe nada sin periodo anterior con el que comparar', () => {
    expect(composeReading(current, null)).toBeNull()
  })

  it('no escribe nada si el periodo anterior está vacío', () => {
    expect(composeReading(current, buildRangeSummary([]))).toBeNull()
  })

  it('dice las dos cifras y la diferencia, sin veredicto, cuando sube', () => {
    expect(composeReading(current, worse)).toBe(
      'Cumpliste el 80% de los días de este tramo; en el tramo anterior, el 40%. Son 40 puntos más.',
    )
  })

  it('dice las dos cifras y la diferencia, sin veredicto, cuando baja', () => {
    expect(composeReading(worse, current)).toBe(
      'Cumpliste el 40% de los días de este tramo; en el tramo anterior, el 80%. Son 40 puntos menos.',
    )
  })

  it('con una diferencia pequeña se queda en las dos cifras', () => {
    // 40 de 50 (80%) frente a 41 de 50 (82%): dos puntos no se nombran.
    const fifty = buildRangeSummary(daysFrom('2026-09-07', 'a'.repeat(40) + '.'.repeat(10)))
    const almost = buildRangeSummary(daysFrom('2026-09-07', 'a'.repeat(41) + '.'.repeat(9)))
    expect(composeReading(fifty, almost)).toBe(
      'Cumpliste el 80% de los días de este tramo; en el tramo anterior, el 82%.',
    )
  })

  it('no emite ningún veredicto sobre el usuario (criterios 445 y 446)', () => {
    const readings = [
      composeReading(current, worse) ?? '',
      composeReading(worse, current) ?? '',
      composeReading(
        buildRangeSummary(daysFrom('2026-09-07', 'a'.repeat(40) + '.'.repeat(10))),
        buildRangeSummary(daysFrom('2026-09-07', 'a'.repeat(41) + '.'.repeat(9))),
      ) ?? '',
    ]
    for (const reading of readings) {
      expect(reading).not.toMatch(/vas (peor|mejor|parecido)/i)
      expect(reading).not.toMatch(/deberías|intenta|ánimo|sueles/i)
      expect(reading).not.toMatch(/propósito|identidad|recaíd/i)
    }
  })
})

describe('habit-panel.utils · cantidad y dificultad', () => {
  it('shouldShowGoalChart descarta booleanos y hábitos sin objetivo diario', () => {
    expect(shouldShowGoalChart(makeHabit({ habitType: 'boolean', dailyGoal: 10 }))).toBe(false)
    expect(shouldShowGoalChart(makeHabit({ habitType: 'count', dailyGoal: 0 }))).toBe(false)
    expect(shouldShowGoalChart(makeHabit({ habitType: 'count', dailyGoal: 3 }))).toBe(true)
    expect(shouldShowGoalChart(makeHabit({ habitType: 'time', timerGoal: 20 }))).toBe(true)
  })

  it('buildGoalSeries marca los días que llegaron al objetivo y los que no tienen registro', () => {
    const habit = makeHabit({ habitType: 'count', dailyGoal: 3 })
    const days = daysFrom('2026-09-07', 'aa.')
    days[0].followUp!.count = 4
    days[1].followUp!.count = 1

    expect(buildGoalSeries(days, habit)).toEqual([
      { date: '2026-09-07', value: 4, met: true, tracked: true },
      { date: '2026-09-08', value: 1, met: false, tracked: true },
      { date: '2026-09-09', value: 0, met: false, tracked: false },
    ])
  })

  it('buildGoalSeries se queda con los últimos días del rango', () => {
    const habit = makeHabit({ habitType: 'count', dailyGoal: 1 })
    const series = buildGoalSeries(daysFrom('2026-09-07', 'aaaaa'), habit, 2)
    expect(series.map((point) => point.date)).toEqual(['2026-09-10', '2026-09-11'])
  })

  it('hasAnyDifficulty y buildDifficultySeries ignoran los rangos sin dificultad', () => {
    const days = daysFrom('2026-09-07', 'aa')
    expect(hasAnyDifficulty(days)).toBe(false)
    expect(buildDifficultySeries(days)).toEqual([])

    days[0].followUp!.difficulty = 0
    expect(hasAnyDifficulty(days)).toBe(true)
    expect(buildDifficultySeries(days)).toEqual([
      { weekStart: '2026-09-07', label: expect.any(String), average: 0, samples: 1 },
    ])
  })
})

describe('habit-panel.utils · buildAverageDifficulty', () => {
  it('sin ningún día con dificultad devuelve null: un cero aquí sería mentira', () => {
    expect(buildAverageDifficulty(daysFrom('2026-09-07', 'aaff'))).toBeNull()
    expect(buildAverageDifficulty([])).toBeNull()
  })

  it('promedia solo los días CON dificultad y dice sobre cuántos', () => {
    const days = daysFrom('2026-09-07', 'aaaa')
    days[0].followUp!.difficulty = 4
    days[1].followUp!.difficulty = 1
    // days[2] y days[3] se quedan sin anotar: no entran en el denominador.

    expect(buildAverageDifficulty(days)).toEqual({ average: 2.5, daysWithDifficulty: 2 })
  })

  it('un cero anotado sí cuenta: «muy fácil» es un dato, no un hueco', () => {
    const days = daysFrom('2026-09-07', 'aa')
    days[0].followUp!.difficulty = 0

    expect(buildAverageDifficulty(days)).toEqual({ average: 0, daysWithDifficulty: 1 })
  })

  it('también cuenta la dificultad de un día fallado o de salvavidas', () => {
    const days = daysFrom('2026-09-07', 'fl')
    days[0].followUp!.difficulty = 4
    days[1].followUp!.difficulty = 2

    expect(buildAverageDifficulty(days)).toEqual({ average: 3, daysWithDifficulty: 2 })
  })
})
