import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitDayRow } from '@/features/habits/components/HabitDayRow'
import type { HabitFollowUp, HabitMyDayEntry } from '@/features/habits/types/habit.types'
import { getWeekDays } from '@/features/habits/utils/habit-week.utils'
import { renderWithProviders } from '@/test/render'

const addMutate = vi.fn()
const removeMutate = vi.fn()

vi.mock('@/features/habits/hooks/useHabitFollowUps', () => ({
  useAddHabitFollowUpMutation: () => ({ mutate: addMutate, isPending: false }),
  useRemoveHabitFollowUpMutation: () => ({ mutate: removeMutate, isPending: false }),
  useUpdateHabitFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  // Aunque esta suite no lo recorra: un `vi.mock` incompleto deja la siguiente
  // suite verde por casualidad.
  useSetFollowUpTimeOfDayMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/habits/hooks/useHabits', () => ({
  useUpdateHabitMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const WEEK_START = '2026-09-14'
const TODAY = '2026-09-16'
const days = getWeekDays(WEEK_START, TODAY)

function buildEntry(overrides: Partial<HabitMyDayEntry['habit']> = {}, followUp: HabitFollowUp | null = null): HabitMyDayEntry {
  return {
    habit: {
      id: 'h1',
      name: 'Meditación matutina',
      habitType: 'boolean',
      periodDays: 0,
      weeklyLifelines: 0,
      streak: 4,
      maxStreak: 9,
      days: 0,
      dailyGoal: 0,
      icon: 'spa',
      startDate: null,
      categoryId: null,
      ...overrides,
    } as HabitMyDayEntry['habit'],
    followUp,
    lifelinesUsedThisWeek: 0,
    lifelinesRemaining: 0,
  }
}

function renderRow(
  entry: HabitMyDayEntry,
  props: Partial<Parameters<typeof HabitDayRow>[0]> = {},
) {
  const onOpenRegister = vi.fn()
  renderWithProviders(
    <HabitDayRow
      entry={entry}
      days={days}
      focusDate={TODAY}
      followUpByDate={new Map()}
      canRegister
      onOpenRegister={onOpenRegister}
      {...props}
    />,
  )
  return { onOpenRegister }
}

beforeEach(() => {
  addMutate.mockClear()
  removeMutate.mockClear()
})

describe('HabitDayRow', () => {
  it('nombra cada día de la semana con el hábito y la fecha', () => {
    renderRow(buildEntry())

    expect(
      screen.getByRole('button', { name: /Registrar Meditación matutina, lunes 14/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Ver Meditación matutina, domingo 20/)).toBeInTheDocument()
  })

  it('los días futuros se ven pero no se pueden registrar', () => {
    renderRow(buildEntry())

    expect(
      screen.queryByRole('button', { name: /Registrar Meditación matutina, viernes 18/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Meditación matutina, viernes 18/)).toBeInTheDocument()
  })

  it('el control circular de un hábito booleano marca el día', async () => {
    const user = userEvent.setup()
    renderRow(buildEntry())

    await user.click(screen.getByRole('button', { name: 'Marcar Meditación matutina, miércoles 16' }))

    expect(addMutate).toHaveBeenCalledWith({
      habitId: 'h1',
      date: TODAY,
      isAccomplished: true,
    })
  })

  it('vuelve a pulsar y desmarca, sin pasar por el panel', async () => {
    const user = userEvent.setup()
    const followUp = {
      id: 'fu1',
      date: TODAY,
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
      timeOfDay: null,
    }
    const { onOpenRegister } = renderRow(buildEntry({}, followUp))

    await user.click(
      screen.getByRole('button', { name: 'Desmarcar Meditación matutina, miércoles 16' }),
    )

    expect(removeMutate).toHaveBeenCalledWith({
      id: 'fu1',
      context: { habitId: 'h1', date: TODAY },
    })
    expect(onOpenRegister).not.toHaveBeenCalled()
  })

  it('con medida el control abre el panel en vez de alternar', async () => {
    const user = userEvent.setup()
    const { onOpenRegister } = renderRow(
      buildEntry({ habitType: 'count', dailyGoal: 10, name: 'Beber agua' }),
    )

    await user.click(screen.getByRole('button', { name: 'Registrar Beber agua, miércoles 16' }))

    expect(addMutate).not.toHaveBeenCalled()
    expect(onOpenRegister).toHaveBeenCalledWith(TODAY, null)
  })

  it('pulsar un día abre el panel para ese día', async () => {
    const user = userEvent.setup()
    const { onOpenRegister } = renderRow(buildEntry())

    await user.click(
      screen.getByRole('button', { name: /Registrar Meditación matutina, martes 15/ }),
    )

    expect(onOpenRegister).toHaveBeenCalledWith('2026-09-15', null)
  })

  it('en semana futura el control sigue visible pero deshabilitado', () => {
    renderRow(buildEntry(), { canRegister: false })

    const toggle = screen.getByRole('button', { name: 'Marcar Meditación matutina, miércoles 16' })
    expect(toggle).toBeDisabled()
  })

  it('muestra un punto por salvavidas, apagando los gastados', () => {
    renderRow({ ...buildEntry({ weeklyLifelines: 3 }), lifelinesRemaining: 1 } as HabitMyDayEntry)

    expect(screen.getByLabelText('1 de 3 salvavidas disponibles')).toBeInTheDocument()
  })
})
