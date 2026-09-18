import { describe, expect, it } from 'vitest'
import type {
  Habit,
  HabitDayEntry,
  HabitDayStatus,
  HabitFollowUp,
} from '@/features/habits/types/habit.types'
import {
  buildDayEntries,
  buildDifficultySeries,
  buildGoalSeries,
  buildRangeSummary,
  buildStreakEpisodes,
  buildWeekdayBreakdown,
  buildWeeklyCompliance,
  composeReading,
  countComebacks,
  countDaysInclusive,
  getWeekdayIndex,
  getWorstWeekday,
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

  it('getWorstWeekday señala el día más flojo', () => {
    const stats = buildWeekdayBreakdown(daysFrom('2026-09-07', 'aaaaaafaaaaaaf'))
    expect(getWorstWeekday(stats)?.longLabel).toBe('domingo')
  })

  it('getWorstWeekday devuelve null si todos van igual o no hay nada medido', () => {
    expect(getWorstWeekday(buildWeekdayBreakdown([]))).toBeNull()
    expect(getWorstWeekday(buildWeekdayBreakdown(daysFrom('2026-09-07', 'aaaaaaa')))).toBeNull()
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
    expect(composeReading(current, null, null)).toBeNull()
  })

  it('no escribe nada si el periodo anterior está vacío', () => {
    expect(composeReading(current, buildRangeSummary([]), null)).toBeNull()
  })

  it('dice que vas mejor cuando el porcentaje sube', () => {
    const reading = composeReading(current, worse, null)
    expect(reading).toBe(
      'Vas mejor que en el periodo anterior: cumpliste el 80% de los días frente al 40%.',
    )
  })

  it('dice que vas peor cuando el porcentaje baja', () => {
    expect(composeReading(worse, current, null)).toContain('Vas peor que en el periodo anterior')
  })

  it('añade el punto flaco solo cuando hay un día por debajo de la media', () => {
    const worst = getWorstWeekday(buildWeekdayBreakdown(daysFrom('2026-09-07', 'aaaaaafaaaaaaf')))
    expect(composeReading(current, worse, worst)).toContain('Donde se te cae: los domingos, al 0%.')
  })

  it('nunca habla de propósito ni de identidad', () => {
    const reading = composeReading(current, worse, null) ?? ''
    expect(reading).not.toMatch(/propósito|identidad|recaíd/i)
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
