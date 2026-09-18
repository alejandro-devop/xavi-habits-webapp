import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  buildWeekdayBreakdown,
  getWorstWeekday,
  type RangeSummary,
  type StreakEpisode,
} from '@/features/habits/utils/habit-panel.utils'
import { renderWithProviders } from '@/test/render'
import { HabitPanelTiles } from './HabitPanelTiles'
import { HabitStreakEpisodesChart } from './HabitStreakEpisodesChart'
import { HabitWeekdayChart } from './HabitWeekdayChart'

const habit: Habit = {
  id: 'h-1',
  userId: '1',
  name: 'Meditar',
  description: null,
  habitType: 'boolean',
  periodDays: 0,
  restartCount: 3,
  weeklyLifelines: 2,
  status: 'active',
  hidden: false,
  shouldAvoid: false,
  shouldKeep: true,
  streak: 12,
  maxStreak: 21,
  days: 148,
  dailyGoal: 0,
  timerGoal: 0,
  timesGoal: 0,
  icon: null,
  color: null,
  orderIndex: 0,
  startDate: '2026-04-20',
  endDate: null,
  categoryId: null,
  measureId: null,
  purposeId: null,
  createdAt: '2026-04-20',
  updatedAt: '2026-04-20',
}

const summary: RangeSummary = {
  total: 30,
  covered: 24,
  accomplished: 22,
  lifelines: 2,
  failed: 4,
  untracked: 2,
  percent: 80,
}

const previous: RangeSummary = { ...summary, covered: 18, percent: 60 }

describe('HabitPanelTiles', () => {
  it('la ficha cuenta las veces que volviste, nunca las recaídas', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
      />,
    )

    expect(screen.getByText('Veces que volviste')).toBeInTheDocument()
    expect(screen.getByText('La última, hace 34 días')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/reca[ií]d/i)
  })

  it('enseña la diferencia en puntos frente al periodo anterior', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 0, lastDaysAgo: null }}
        rangeLabel="30 d"
      />,
    )

    expect(screen.getByText('Cumplimiento 30 d')).toBeInTheDocument()
    expect(screen.getByText('▲ 20 pts vs. periodo anterior')).toBeInTheDocument()
  })

  it('sin periodo anterior no hay diferencia que enseñar', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={null}
        comebacks={{ total: 0, lastDaysAgo: null }}
        rangeLabel="30 d"
      />,
    )

    expect(screen.queryByText(/pts vs\. periodo anterior/)).not.toBeInTheDocument()
    expect(screen.getByText('Todavía no has tenido que volver')).toBeInTheDocument()
  })
})

describe('HabitWeekdayChart', () => {
  // Dos semanas completas con los dos domingos fallados.
  const days = [...'aaaaaafaaaaaaf'].map((token, index) => {
    const date = `2026-09-${String(7 + index).padStart(2, '0')}`
    return {
      date,
      status: token === 'a' ? ('accomplished' as const) : ('failed' as const),
      followUp: null,
    }
  })
  const stats = buildWeekdayBreakdown(days)
  const worst = getWorstWeekday(stats)

  it('marca el peor día con una etiqueta, no solo con el color', () => {
    renderWithProviders(
      <HabitWeekdayChart stats={stats} worst={worst} rangeLabel="90 días" />,
    )

    expect(screen.getByText('peor día')).toBeInTheDocument()
    expect(screen.getByText('Peor día: domingo')).toBeInTheDocument()
  })

  it('lleva una tabla con los mismos números que dibuja', () => {
    renderWithProviders(
      <HabitWeekdayChart stats={stats} worst={worst} rangeLabel="90 días" />,
    )

    const table = screen.getByRole('table', { name: 'Cumplimiento por día de la semana' })
    const sunday = within(table).getByRole('row', { name: /domingo/ })
    expect(within(sunday).getByText('0 de 2')).toBeInTheDocument()
    expect(within(sunday).getByText('0%')).toBeInTheDocument()
  })
})

describe('HabitStreakEpisodesChart', () => {
  const episodes: StreakEpisode[] = [
    {
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      length: 5,
      isCurrent: false,
      isRecord: false,
      label: 'ago',
    },
    {
      startDate: '2026-08-10',
      endDate: '2026-08-30',
      length: 21,
      isCurrent: false,
      isRecord: true,
      label: 'ago',
    },
    {
      startDate: '2026-09-06',
      endDate: '2026-09-17',
      length: 12,
      isCurrent: true,
      isRecord: false,
      label: 'sep',
    },
  ]

  it('rotula el récord y la racha en curso, además de distinguirlos por color', () => {
    renderWithProviders(<HabitStreakEpisodesChart episodes={episodes} />)

    // Rotulado en el dibujo y repetido en la tabla oculta.
    const chart = screen.getByRole('img')
    expect(within(chart).getByText('récord')).toBeInTheDocument()
    expect(within(chart).getByText('en curso')).toBeInTheDocument()

    const table = screen.getByRole('table', { name: 'Rachas del rango' })
    expect(within(table).getByRole('row', { name: /21 días.*récord/ })).toBeInTheDocument()
  })
})
