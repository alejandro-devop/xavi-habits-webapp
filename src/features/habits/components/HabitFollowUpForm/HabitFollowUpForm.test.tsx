import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { renderWithProviders } from '@/test/render'

/**
 * Se mockea **el API**, no los hooks: así el recorrido de verdad —componente →
 * hook → input que viaja— queda cubierto, que es donde vive el sello de la hora.
 */
const addHabitFollowUp = vi.fn()
const updateHabitFollowUp = vi.fn()

vi.mock('@/features/habits/api/habit-follow-ups.api', () => ({
  addHabitFollowUp: (input: unknown) => addHabitFollowUp(input),
  updateHabitFollowUp: (input: unknown) => updateHabitFollowUp(input),
  removeHabitFollowUp: vi.fn(),
}))

const TODAY = '2026-09-25'
const PASADO = '2026-09-23'

const habit = {
  id: '7',
  name: 'Meditar',
  habitType: 'boolean',
  periodDays: 0,
  weeklyLifelines: 0,
  streak: 0,
  maxStreak: 0,
  days: 0,
  dailyGoal: 0,
  timerGoal: 0,
  timesGoal: 0,
  icon: null,
  color: null,
  startDate: null,
  categoryId: null,
  measure: null,
} as unknown as Habit

function buildFollowUp(overrides: Partial<HabitFollowUp> = {}): HabitFollowUp {
  return {
    id: 'log-1',
    date: TODAY,
    habitId: '7',
    isAccomplished: false,
    isFailed: true,
    isLifeline: false,
    difficulty: 4,
    count: null,
    time: null,
    notes: 'Llegué tarde.',
    story: null,
    archived: false,
    timeOfDay: '22:15',
    ...overrides,
  }
}

beforeEach(() => {
  addHabitFollowUp.mockReset()
  addHabitFollowUp.mockResolvedValue(buildFollowUp({ isAccomplished: true, isFailed: false }))
  updateHabitFollowUp.mockReset()
  updateHabitFollowUp.mockResolvedValue(buildFollowUp({ timeOfDay: '21:40' }))
  vi.useRealTimers()
})

describe('HabitFollowUpForm · la hora se guarda sola', () => {
  it('marcar hoy no añade ni un paso y viaja la hora del momento de pulsar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 25, 22, 15))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<HabitFollowUpForm habit={habit} date={TODAY} />)

    // Ni desplegable, ni pregunta, ni campo de hora en el camino de marcar.
    expect(screen.queryByText(/a qué hora/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/corregir/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /completé el hábito hoy/i }))

    await waitFor(() => expect(addHabitFollowUp).toHaveBeenCalledTimes(1))
    expect(addHabitFollowUp.mock.calls[0][0]).toMatchObject({
      habitId: '7',
      date: TODAY,
      isAccomplished: true,
      timeOfDay: '22:15',
    })
  })

  it('la hora es la del botón, no la de abrir la hoja', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 25, 22, 15))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<HabitFollowUpForm habit={habit} date={TODAY} />)

    // Diez minutos con la hoja abierta.
    vi.setSystemTime(new Date(2026, 8, 25, 22, 25))
    await user.click(screen.getByRole('button', { name: /completé el hábito hoy/i }))

    await waitFor(() => expect(addHabitFollowUp).toHaveBeenCalledTimes(1))
    expect(addHabitFollowUp.mock.calls[0][0].timeOfDay).toBe('22:25')
  })

  it('registrar un día pasado no inventa hora: la clave ni siquiera viaja', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 25, 22, 15))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<HabitFollowUpForm habit={habit} date={PASADO} />)
    await user.click(screen.getByRole('button', { name: /completé el hábito hoy/i }))

    await waitFor(() => expect(addHabitFollowUp).toHaveBeenCalledTimes(1))
    expect(addHabitFollowUp.mock.calls[0][0]).not.toHaveProperty('timeOfDay')
  })
})

describe('HabitFollowUpForm · la línea de la hora', () => {
  it('un registro con hora la dice, y ofrece corregirla', () => {
    renderWithProviders(
      <HabitFollowUpForm habit={habit} date={TODAY} existingFollowUp={buildFollowUp()} />,
    )

    expect(screen.getByText(/registrado a las/i)).toBeInTheDocument()
    expect(screen.getByText('22:15')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Corregir' })).toBeInTheDocument()
  })

  it('un registro sin hora no enseña nada: ni «sin hora», ni un guion', () => {
    renderWithProviders(
      <HabitFollowUpForm
        habit={habit}
        date={TODAY}
        existingFollowUp={buildFollowUp({ timeOfDay: null })}
      />,
    )

    expect(screen.queryByText(/registrado a las/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Corregir' })).not.toBeInTheDocument()
    expect(screen.queryByText(/sin hora/i)).not.toBeInTheDocument()
  })

  it('corregir manda un habitFollowUpEdit con la hora y nada más', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HabitFollowUpForm habit={habit} date={TODAY} existingFollowUp={buildFollowUp()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Corregir' }))

    const campo = screen.getByLabelText(/a qué hora fue de verdad/i)
    expect(campo).toHaveValue('22:15')

    await user.clear(campo)
    await user.type(campo, '21:40')
    await user.click(screen.getByRole('button', { name: /guardar hora/i }))

    await waitFor(() => expect(updateHabitFollowUp).toHaveBeenCalledTimes(1))
    expect(updateHabitFollowUp.mock.calls[0][0]).toEqual({ id: 'log-1', timeOfDay: '21:40' })

    // Y la línea se queda con la hora nueva, sin tocar notas ni dificultad.
    await waitFor(() => expect(screen.getByText('21:40')).toBeInTheDocument())
    expect(screen.getByRole('textbox')).toHaveValue('Llegué tarde.')
  })

  it('cancelar no manda nada', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HabitFollowUpForm habit={habit} date={TODAY} existingFollowUp={buildFollowUp()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Corregir' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(updateHabitFollowUp).not.toHaveBeenCalled()
    expect(screen.getByText(/registrado a las/i)).toBeInTheDocument()
  })
})
