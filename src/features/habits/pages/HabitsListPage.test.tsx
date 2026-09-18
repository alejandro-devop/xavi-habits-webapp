import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitsListPage } from '@/features/habits/pages/HabitsListPage'
import type { Habit } from '@/features/habits/types/habit.types'
import { addDaysToString, getTodayString } from '@/features/habits/utils/habit-type.utils'
import { renderWithProviders } from '@/test/render'

const followUpsQuerySpy = vi.fn()

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
    color: '#10b981',
    categoryId: 'mente',
    purposeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Habit
}

const habits = [
  buildHabit(),
  buildHabit({
    id: 'h2',
    name: 'Correr al amanecer',
    description: 'Cinco kilómetros',
    categoryId: 'cuerpo',
    streak: 3,
    days: 4,
  }),
]

vi.mock('@/features/habits/hooks/useHabits', () => ({
  useHabitsQuery: () => ({
    data: { habits, page: 1, limit: 20, total: habits.length },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useHabitCategoriesQuery: () => ({
    data: [
      { id: 'mente', name: 'Mente', icon: null, color: null, orderIndex: 0 },
      { id: 'cuerpo', name: 'Cuerpo', icon: null, color: null, orderIndex: 1 },
    ],
  }),
  useHabitFollowUpsInDatesQuery: (from: string, to: string) => {
    followUpsQuerySpy(from, to)
    return { data: [], isPending: false }
  },
  useCompleteHabitMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateHabitMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/habits/hooks/useHabitPurposes', () => ({
  useHabitPurposesQuery: () => ({ data: [] }),
}))

vi.mock('@/features/habits/components/HabitFormModal', () => ({
  HabitFormModal: () => null,
}))

function mockViewport({ isCompact }: { isCompact: boolean }) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px') ? isCompact : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

beforeEach(() => {
  followUpsQuerySpy.mockClear()
  window.localStorage.clear()
  mockViewport({ isCompact: false })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HabitsListPage', () => {
  it('pinta una rejilla plana, sin secciones por categoría', () => {
    renderWithProviders(<HabitsListPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Mis hábitos' })).toBeInTheDocument()
    expect(screen.getByText('Meditación matutina')).toBeInTheDocument()
    expect(screen.getByText('Correr al amanecer')).toBeInTheDocument()
    // Las categorías ya no son secciones: son filtro e insignia.
    expect(screen.queryByRole('heading', { level: 2, name: 'Mente' })).not.toBeInTheDocument()
  })

  it('busca sin distinguir acentos y combina con el filtro de categoría', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitsListPage />)

    await user.type(screen.getByLabelText('Buscar hábitos'), 'meditacion')

    expect(screen.getByText('Meditación matutina')).toBeInTheDocument()
    expect(screen.queryByText('Correr al amanecer')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cuerpo/ }))

    expect(screen.getByText('Ningún hábito con estos filtros')).toBeInTheDocument()
    expect(screen.queryByText('Sin hábitos activos')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Correr al amanecer')).toBeInTheDocument()
  })

  it('pide 14 días y pinta 7 en móvil, con la racha intacta', () => {
    mockViewport({ isCompact: true })
    renderWithProviders(<HabitsListPage />)

    const today = getTodayString()
    expect(followUpsQuerySpy).toHaveBeenCalledWith(addDaysToString(today, -13), today)
    expect(screen.getAllByText('Últimos 7 días')).toHaveLength(2)
    expect(screen.getByLabelText('20 días de racha')).toBeInTheDocument()
  })

  it('pide el mismo rango en escritorio y pinta 14 días', () => {
    renderWithProviders(<HabitsListPage />)

    const today = getTodayString()
    expect(followUpsQuerySpy).toHaveBeenCalledWith(addDaysToString(today, -13), today)
    expect(screen.getAllByText('Últimos 14 días')).toHaveLength(2)
  })

  it('conmuta a tabla y recuerda la preferencia', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(<HabitsListPage />)

    await user.click(screen.getByRole('button', { name: 'Tabla' }))

    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: /Racha/ })).toBeInTheDocument()
    expect(window.localStorage.getItem('xavi:habits:list-view')).toBe('table')

    unmount()
    renderWithProviders(<HabitsListPage />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
