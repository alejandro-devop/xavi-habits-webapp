import { describe, expect, it } from 'vitest'
import { sortMyDayEntries } from '@/features/habits/utils/habit-order.utils'
import type { HabitMyDayEntry } from '@/features/habits/types/habit.types'

function entry(
  id: string,
  orderIndex: number,
  createdAt: string,
): HabitMyDayEntry {
  return {
    habit: { id, orderIndex, createdAt } as HabitMyDayEntry['habit'],
    followUp: null,
    lifelinesUsedThisWeek: 0,
    lifelinesRemaining: 0,
  }
}

const ids = (entries: HabitMyDayEntry[]) => entries.map((e) => e.habit.id)

describe('habit-order.utils', () => {
  it('ordena por orderIndex ascendente', () => {
    const result = sortMyDayEntries([
      entry('c', 2, '2026-01-01'),
      entry('a', 0, '2026-01-01'),
      entry('b', 1, '2026-01-01'),
    ])
    expect(ids(result)).toEqual(['a', 'b', 'c'])
  })

  it('desempata por createdAt y luego por id', () => {
    const result = sortMyDayEntries([
      entry('z', 0, '2026-03-01'),
      entry('b', 0, '2026-01-01'),
      entry('a', 0, '2026-01-01'),
    ])
    expect(ids(result)).toEqual(['a', 'b', 'z'])
  })

  it('devuelve el mismo orden aunque el backend cambie el orden de llegada', () => {
    const a = entry('a', 0, '2026-01-01')
    const b = entry('b', 1, '2026-01-02')
    const c = entry('c', 2, '2026-01-03')
    expect(ids(sortMyDayEntries([a, b, c]))).toEqual(ids(sortMyDayEntries([c, a, b])))
    expect(ids(sortMyDayEntries([b, c, a]))).toEqual(['a', 'b', 'c'])
  })

  it('no muta el arreglo original', () => {
    const input = [entry('b', 1, '2026-01-02'), entry('a', 0, '2026-01-01')]
    sortMyDayEntries(input)
    expect(ids(input)).toEqual(['b', 'a'])
  })
})
