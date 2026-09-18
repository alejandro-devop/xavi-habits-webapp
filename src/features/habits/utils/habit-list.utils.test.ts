import { describe, expect, it } from 'vitest'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  filterHabits,
  getHabitFrequencyLabel,
  getHabitPeriodRatio,
  hasActiveHabitFilters,
  matchesHabitSearch,
  normalizeSearchText,
  sortHabits,
} from '@/features/habits/utils/habit-list.utils'

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Meditación matutina',
    description: 'Quince minutos al despertar',
    habitType: 'boolean',
    periodDays: 30,
    weeklyLifelines: 0,
    status: 'active',
    shouldAvoid: false,
    shouldKeep: true,
    streak: 4,
    maxStreak: 9,
    days: 12,
    dailyGoal: 0,
    timerGoal: 0,
    icon: 'spa',
    color: null,
    categoryId: null,
    purposeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Habit
}

const NO_FILTERS = { search: '', categoryId: null, purposeId: null }

describe('normalizeSearchText', () => {
  it('quita acentos y mayúsculas', () => {
    expect(normalizeSearchText('  Meditación ')).toBe('meditacion')
  })
})

describe('matchesHabitSearch', () => {
  it('encuentra "Meditación" escribiendo "meditacion"', () => {
    expect(matchesHabitSearch(buildHabit(), 'meditacion')).toBe(true)
  })

  it('también busca en la descripción', () => {
    expect(matchesHabitSearch(buildHabit(), 'despertar')).toBe(true)
  })

  it('devuelve todos con la búsqueda vacía', () => {
    expect(matchesHabitSearch(buildHabit({ description: null }), '   ')).toBe(true)
  })

  it('descarta lo que no coincide', () => {
    expect(matchesHabitSearch(buildHabit(), 'correr')).toBe(false)
  })
})

describe('filterHabits', () => {
  const meditar = buildHabit({ id: 'a', categoryId: 'mente', purposeId: 'calma' })
  const correr = buildHabit({
    id: 'b',
    name: 'Correr',
    description: null,
    categoryId: 'cuerpo',
    purposeId: 'salud',
  })

  it('combina búsqueda, categoría y propósito', () => {
    expect(
      filterHabits([meditar, correr], { search: 'corr', categoryId: 'cuerpo', purposeId: 'salud' }),
    ).toEqual([correr])

    expect(
      filterHabits([meditar, correr], { search: 'corr', categoryId: 'mente', purposeId: null }),
    ).toEqual([])
  })

  it('sin filtros devuelve todo', () => {
    expect(filterHabits([meditar, correr], NO_FILTERS)).toHaveLength(2)
  })
})

describe('hasActiveHabitFilters', () => {
  it('distingue la lista sin filtrar de la filtrada', () => {
    expect(hasActiveHabitFilters(NO_FILTERS)).toBe(false)
    expect(hasActiveHabitFilters({ ...NO_FILTERS, search: 'a' })).toBe(true)
    expect(hasActiveHabitFilters({ ...NO_FILTERS, purposeId: 'p1' })).toBe(true)
  })
})

describe('sortHabits', () => {
  const alta = buildHabit({ id: 'a', name: 'Zen', streak: 20, days: 3, createdAt: '2026-01-01' })
  const media = buildHabit({ id: 'b', name: 'Agua', streak: 7, days: 27, createdAt: '2026-05-01' })

  it('por racha, de mayor a menor y desde habit.streak', () => {
    expect(sortHabits([media, alta], 'streak').map((h) => h.id)).toEqual(['a', 'b'])
  })

  it('por nombre, alfabético en español', () => {
    expect(sortHabits([alta, media], 'name').map((h) => h.id)).toEqual(['b', 'a'])
  })

  it('por progreso del periodo, con habit.days sobre habit.periodDays', () => {
    expect(sortHabits([alta, media], 'period').map((h) => h.id)).toEqual(['b', 'a'])
  })

  it('por más reciente', () => {
    expect(sortHabits([alta, media], 'recent').map((h) => h.id)).toEqual(['b', 'a'])
  })

  it('no muta el array recibido', () => {
    const input = [media, alta]
    sortHabits(input, 'streak')
    expect(input.map((h) => h.id)).toEqual(['b', 'a'])
  })
})

describe('getHabitPeriodRatio', () => {
  it('sale de habit.days sobre habit.periodDays', () => {
    expect(getHabitPeriodRatio(buildHabit({ days: 15, periodDays: 30 }))).toBe(0.5)
  })

  it('no pasa de 1 ni se va a infinito sin periodo', () => {
    expect(getHabitPeriodRatio(buildHabit({ days: 40, periodDays: 30 }))).toBe(1)
    expect(getHabitPeriodRatio(buildHabit({ days: 40, periodDays: 0 }))).toBe(0)
  })
})

describe('getHabitFrequencyLabel', () => {
  it('distingue medida, periodo y diario', () => {
    expect(getHabitFrequencyLabel(buildHabit({ habitType: 'count' }))).toBe('Con medida')
    expect(getHabitFrequencyLabel(buildHabit({ periodDays: 7 }))).toBe('Objetivo de 7 días')
    expect(getHabitFrequencyLabel(buildHabit({ periodDays: 1 }))).toBe('Diario')
  })
})
