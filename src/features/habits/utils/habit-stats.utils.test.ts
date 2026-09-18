import { describe, expect, it } from 'vitest'
import {
  countEntriesByCategory,
  filterEntriesByCategory,
  getHabitDayTotals,
  getHabitStreakSummary,
  getStarHabit,
} from '@/features/habits/utils/habit-stats.utils'
import type { HabitFollowUp, HabitMyDayEntry } from '@/features/habits/types/habit.types'

type EntryOptions = {
  streak?: number
  maxStreak?: number
  days?: number
  periodDays?: number
  categoryId?: string | null
  followUp?: Partial<HabitFollowUp> | null
}

function entry(id: string, options: EntryOptions = {}): HabitMyDayEntry {
  const {
    streak = 0,
    maxStreak = 0,
    days = 0,
    periodDays = 0,
    categoryId = null,
    followUp = null,
  } = options

  return {
    habit: {
      id,
      name: `Hábito ${id}`,
      streak,
      maxStreak,
      days,
      periodDays,
      categoryId,
    } as HabitMyDayEntry['habit'],
    followUp: followUp
      ? ({
          id: `fu-${id}`,
          habitId: id,
          isAccomplished: false,
          isFailed: false,
          isLifeline: false,
          ...followUp,
        } as HabitFollowUp)
      : null,
    lifelinesUsedThisWeek: 0,
    lifelinesRemaining: 0,
  }
}

describe('getHabitDayTotals', () => {
  it('reparte los hábitos entre logrados, salvavidas, fallados y pendientes', () => {
    const totals = getHabitDayTotals([
      entry('a', { followUp: { isAccomplished: true } }),
      entry('b', { followUp: { isAccomplished: true } }),
      entry('c', { followUp: { isFailed: true } }),
      entry('d', { followUp: null }),
    ])

    expect(totals).toMatchObject({
      total: 4,
      accomplished: 2,
      lifelines: 0,
      failed: 1,
      pending: 1,
    })
  })

  it('no cuenta dos veces un salvavidas que además llega marcado como logrado', () => {
    const totals = getHabitDayTotals([
      entry('a', { followUp: { isAccomplished: true, isLifeline: true } }),
      entry('b', { followUp: { isAccomplished: true } }),
    ])

    expect(totals.accomplished).toBe(1)
    expect(totals.lifelines).toBe(1)
    expect(totals.accomplished + totals.lifelines + totals.failed + totals.pending).toBe(
      totals.total,
    )
  })

  it('el porcentaje suma logrados y salvavidas sobre el total', () => {
    const totals = getHabitDayTotals([
      entry('a', { followUp: { isAccomplished: true } }),
      entry('b', { followUp: { isLifeline: true } }),
      entry('c', { followUp: { isFailed: true } }),
      entry('d'),
    ])

    expect(totals.percent).toBe(50)
  })

  it('con cero hábitos devuelve cero por ciento y no divide por cero', () => {
    expect(getHabitDayTotals([])).toMatchObject({ total: 0, percent: 0, pending: 0 })
  })
})

describe('getHabitStreakSummary', () => {
  it('devuelve null con menos de dos hábitos', () => {
    expect(getHabitStreakSummary([])).toBeNull()
    expect(getHabitStreakSummary([entry('a', { streak: 9 })])).toBeNull()
  })

  it('promedia las rachas y cuenta las que pasan de diez días', () => {
    const summary = getHabitStreakSummary([
      entry('a', { streak: 12, maxStreak: 20 }),
      entry('b', { streak: 16, maxStreak: 32 }),
      entry('c', { streak: 2, maxStreak: 4 }),
    ])

    expect(summary).toMatchObject({ average: 10, aboveTen: 2, best: 32 })
  })

  it('mide el progreso contra la mejor racha histórica real, no contra una meta fija', () => {
    const summary = getHabitStreakSummary([
      entry('a', { streak: 5, maxStreak: 10 }),
      entry('b', { streak: 5, maxStreak: 10 }),
    ])

    expect(summary?.best).toBe(10)
    expect(summary?.ratio).toBeCloseTo(0.5)
  })

  it('usa la racha activa como mejor marca si supera a maxStreak', () => {
    const summary = getHabitStreakSummary([
      entry('a', { streak: 40, maxStreak: 10 }),
      entry('b', { streak: 0, maxStreak: 0 }),
    ])

    expect(summary?.best).toBe(40)
  })

  it('sin rachas todavía, el progreso es cero y no NaN', () => {
    const summary = getHabitStreakSummary([entry('a'), entry('b')])
    expect(summary).toMatchObject({ average: 0, aboveTen: 0, best: 0, ratio: 0 })
  })
})

describe('getStarHabit', () => {
  it('devuelve null con menos de dos hábitos', () => {
    expect(getStarHabit([entry('a', { streak: 30 })])).toBeNull()
  })

  it('elige el hábito con la racha activa más alta', () => {
    const star = getStarHabit([
      entry('a', { streak: 3 }),
      entry('b', { streak: 32, days: 30, periodDays: 30 }),
      entry('c', { streak: 12 }),
    ])

    expect(star?.entry.habit.id).toBe('b')
    expect(star?.streak).toBe(32)
    expect(star?.periodRatio).toBe(1)
  })

  it('sin periodo definido no calcula progreso de periodo', () => {
    const star = getStarHabit([entry('a', { streak: 8 }), entry('b', { streak: 1 })])

    expect(star?.periodDays).toBeNull()
    expect(star?.periodRatio).toBeNull()
  })

  it('en empate se queda con el primero del orden recibido', () => {
    const star = getStarHabit([entry('a', { streak: 5 }), entry('b', { streak: 5 })])
    expect(star?.entry.habit.id).toBe('a')
  })
})

describe('filtro por categoría', () => {
  const entries = [
    entry('a', { categoryId: 'mente' }),
    entry('b', { categoryId: 'mente' }),
    entry('c', { categoryId: 'cuerpo' }),
    entry('d', { categoryId: null }),
  ]

  it('cuenta los hábitos del día por categoría', () => {
    const tally = countEntriesByCategory(entries)
    expect(tally.get('mente')).toBe(2)
    expect(tally.get('cuerpo')).toBe(1)
    expect(tally.has('sin-categoria')).toBe(false)
  })

  it('con null devuelve todos los hábitos', () => {
    expect(filterEntriesByCategory(entries, null)).toHaveLength(4)
  })

  it('acota la lista a la categoría elegida', () => {
    expect(filterEntriesByCategory(entries, 'mente').map((e) => e.habit.id)).toEqual(['a', 'b'])
  })

  it('devuelve lista vacía si la categoría no tiene hábitos hoy', () => {
    expect(filterEntriesByCategory(entries, 'descanso')).toEqual([])
  })
})
