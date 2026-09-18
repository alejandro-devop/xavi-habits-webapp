import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HabitListCard } from '@/features/habits/components/HabitListCard'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { getRecentDays, getVisibleDays } from '@/features/habits/utils/habit-week.utils'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/habits/hooks/useHabits', () => ({
  useCompleteHabitMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateHabitMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const TODAY = '2026-09-17'
const days = getRecentDays(14, TODAY, TODAY)

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Meditación matutina',
    description: '15 min al despertar',
    habitType: 'boolean',
    periodDays: 30,
    weeklyLifelines: 0,
    status: 'active',
    shouldAvoid: false,
    shouldKeep: true,
    streak: 20,
    maxStreak: 25,
    days: 19,
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

function buildFollowUps(dates: string[]): Map<string, HabitFollowUp> {
  return new Map(
    dates.map((date) => [
      date,
      {
        id: `fu-${date}`,
        date,
        habitId: 'h1',
        isAccomplished: true,
        isFailed: false,
        isLifeline: false,
        difficulty: null,
        count: null,
        time: null,
        notes: null,
        story: null,
        archived: false,
      },
    ]),
  )
}

function renderCard(habit: Habit, options: { compact?: boolean; purpose?: HabitPurpose } = {}) {
  const visibleDays = getVisibleDays(days, options.compact ? 7 : 14)
  renderWithProviders(
    <HabitListCard
      habit={habit}
      purpose={options.purpose ?? null}
      days={visibleDays}
      followUpByDate={buildFollowUps(visibleDays.slice(0, 3).map((day) => day.date))}
      onEdit={vi.fn()}
    />,
  )
  return visibleDays
}

describe('HabitListCard', () => {
  it('muestra la racha de habit.streak, no el recuento de la tira', () => {
    renderCard(buildHabit({ streak: 20 }), { compact: true })

    // Siete barras a la vista y solo tres días registrados: la racha sigue
    // siendo la que manda la API.
    expect(screen.getByLabelText('20 días de racha')).toBeInTheDocument()
    expect(screen.getByText('Últimos 7 días')).toBeInTheDocument()
    expect(screen.getByText('3 / 7')).toBeInTheDocument()
  })

  it('mantiene la misma racha con la ventana de 14 días', () => {
    renderCard(buildHabit({ streak: 20 }))

    expect(screen.getByLabelText('20 días de racha')).toBeInTheDocument()
    expect(screen.getByText('Últimos 14 días')).toBeInTheDocument()
    expect(screen.getByText('3 / 14')).toBeInTheDocument()
  })

  it('saca el progreso del periodo de habit.days sobre habit.periodDays', () => {
    renderCard(buildHabit({ days: 19, periodDays: 30 }))

    expect(screen.getByText('Periodo de 30 días')).toBeInTheDocument()
    expect(screen.getByText('19 / 30')).toBeInTheDocument()
  })

  it('distingue Mantener de Evitar', () => {
    renderCard(buildHabit({ shouldAvoid: true, shouldKeep: false }))
    expect(screen.getByText('Evitar')).toBeInTheDocument()
    expect(screen.queryByText('Mantener')).not.toBeInTheDocument()
  })

  it('muestra "Te acerca a: …" solo cuando hay propósito', () => {
    const purpose: HabitPurpose = {
      id: 'p1',
      userId: 1,
      name: 'Alguien sereno',
      description: null,
      icon: 'star',
      placement: 'want',
      orderIndex: 0,
      createdAt: '',
      updatedAt: '',
    }

    const { unmount } = renderWithProviders(
      <HabitListCard
        habit={buildHabit()}
        purpose={purpose}
        days={days}
        followUpByDate={new Map()}
        onEdit={vi.fn()}
      />,
    )
    expect(screen.getByText(/Te acerca a: Alguien sereno/)).toBeInTheDocument()
    unmount()

    renderCard(buildHabit())
    expect(screen.queryByText(/Te acerca a:/)).not.toBeInTheDocument()
  })

  it('el propósito no se pinta en tono de culpa para un hábito en pausa', () => {
    const purpose: HabitPurpose = {
      id: 'p1',
      userId: 1,
      name: 'Alguien sereno',
      description: null,
      icon: 'star',
      placement: 'want',
      orderIndex: 0,
      createdAt: '',
      updatedAt: '',
    }
    renderCard(buildHabit({ status: 'completed' }), { purpose })

    expect(screen.getByText('En pausa')).toBeInTheDocument()
    const line = screen.getByText(/Te acerca a: Alguien sereno/)
    expect(line.className).not.toMatch(/danger|error|muted/i)
  })

  it('conserva el menú de acciones', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    renderCard(buildHabit())

    await userEvent.click(screen.getByRole('button', { name: 'Más opciones de Meditación matutina' }))

    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Completar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeInTheDocument()
  })
})
