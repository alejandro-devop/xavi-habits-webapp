import type { Habit } from '@/features/habits/types/habit.types'

/**
 * Derivados de la rejilla de "Mis Hábitos". Todo se calcula en cliente sobre
 * los hábitos ya cargados: buscar, ordenar y filtrar no lanzan ni una petición.
 *
 * Nada de aquí toca la racha: `habit.streak` y `habit.maxStreak` vienen de la
 * API y se muestran tal cual. Contar barras pintadas para "adivinar" la racha
 * es exactamente el error que esta pantalla no puede repetir.
 */

export type HabitSortKey = 'streak' | 'name' | 'period' | 'recent'

export const HABIT_SORT_OPTIONS: Array<{ value: HabitSortKey; label: string }> = [
  { value: 'streak', label: 'Racha' },
  { value: 'name', label: 'Nombre' },
  { value: 'period', label: 'Progreso del periodo' },
  { value: 'recent', label: 'Más reciente' },
]

export type HabitIntent = 'keep' | 'avoid'

export type HabitListFilters = {
  search: string
  categoryId: string | null
  purposeId: string | null
}

export const EMPTY_HABIT_LIST_FILTERS: HabitListFilters = {
  search: '',
  categoryId: null,
  purposeId: null,
}

/** Minúsculas y sin diacríticos: "meditacion" tiene que encontrar "Meditación". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesHabitSearch(habit: Habit, search: string): boolean {
  const needle = normalizeSearchText(search)
  if (needle === '') return true
  const haystack = normalizeSearchText(`${habit.name} ${habit.description ?? ''}`)
  return haystack.includes(needle)
}

export function hasActiveHabitFilters(filters: HabitListFilters): boolean {
  return (
    filters.search.trim() !== '' || filters.categoryId !== null || filters.purposeId !== null
  )
}

/** Buscador + categoría + propósito, combinables entre sí. */
export function filterHabits(habits: Habit[], filters: HabitListFilters): Habit[] {
  return habits.filter((habit) => {
    if (filters.categoryId !== null && habit.categoryId !== filters.categoryId) return false
    if (filters.purposeId !== null && habit.purposeId !== filters.purposeId) return false
    return matchesHabitSearch(habit, filters.search)
  })
}

/** 0–1 · `habit.days` sobre `habit.periodDays`. Nunca un recuento de barras. */
export function getHabitPeriodRatio(habit: Habit): number {
  if (habit.periodDays <= 0) return 0
  return Math.min(Math.max(habit.days ?? 0, 0) / habit.periodDays, 1)
}

function compareByName(a: Habit, b: Habit): number {
  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
}

export function sortHabits(habits: Habit[], key: HabitSortKey): Habit[] {
  const sorted = [...habits]

  switch (key) {
    case 'name':
      return sorted.sort(compareByName)
    case 'period':
      return sorted.sort((a, b) => {
        const diff = getHabitPeriodRatio(b) - getHabitPeriodRatio(a)
        return diff !== 0 ? diff : compareByName(a, b)
      })
    case 'recent':
      return sorted.sort((a, b) => {
        const createdA = a.createdAt ?? ''
        const createdB = b.createdAt ?? ''
        if (createdA !== createdB) return createdA < createdB ? 1 : -1
        return compareByName(a, b)
      })
    case 'streak':
    default:
      return sorted.sort((a, b) => {
        const diff = (b.streak ?? 0) - (a.streak ?? 0)
        if (diff !== 0) return diff
        const maxDiff = (b.maxStreak ?? 0) - (a.maxStreak ?? 0)
        if (maxDiff !== 0) return maxDiff
        return compareByName(a, b)
      })
  }
}

function countBy(habits: Habit[], pick: (habit: Habit) => string | null): Map<string, number> {
  const tally = new Map<string, number>()
  for (const habit of habits) {
    const key = pick(habit)
    if (key == null) continue
    tally.set(key, (tally.get(key) ?? 0) + 1)
  }
  return tally
}

export function countHabitsByCategory(habits: Habit[]): Map<string, number> {
  return countBy(habits, (habit) => habit.categoryId)
}

export function countHabitsByPurpose(habits: Habit[]): Map<string, number> {
  return countBy(habits, (habit) => habit.purposeId)
}

export function getHabitIntent(habit: Habit): HabitIntent {
  return habit.shouldAvoid ? 'avoid' : 'keep'
}

/**
 * La insignia de frecuencia. Mismo vocabulario que la microcopia de Mi Día
 * para que las dos pantallas no digan lo mismo de dos maneras.
 */
export function getHabitFrequencyLabel(habit: Habit): string {
  if (habit.habitType === 'count' || habit.habitType === 'time') return 'Con medida'
  if (habit.periodDays > 1) return `Objetivo de ${habit.periodDays} días`
  return 'Diario'
}
