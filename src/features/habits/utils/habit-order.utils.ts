import type { HabitMyDayEntry } from '@/features/habits/types/habit.types'

/**
 * El backend no garantiza un orden estable en `habitMyDay`: al registrar un
 * follow-up la fila cambia y el refetch puede devolver los hábitos en otro
 * orden. Ordenamos en el cliente para que la lista no se mueva bajo el cursor.
 */
function compareHabits(
  a: HabitMyDayEntry['habit'],
  b: HabitMyDayEntry['habit'],
): number {
  const orderA = a.orderIndex ?? 0
  const orderB = b.orderIndex ?? 0
  if (orderA !== orderB) return orderA - orderB

  const createdA = a.createdAt ?? ''
  const createdB = b.createdAt ?? ''
  if (createdA !== createdB) return createdA < createdB ? -1 : 1

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Devuelve las entradas de Mi Día en un orden determinista y estable. */
export function sortMyDayEntries(entries: HabitMyDayEntry[]): HabitMyDayEntry[] {
  return [...entries].sort((a, b) => compareHabits(a.habit, b.habit))
}
