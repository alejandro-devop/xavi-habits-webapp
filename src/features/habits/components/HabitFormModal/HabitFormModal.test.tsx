import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { HABIT_COLORS } from '@/features/habits/data/habit-colors'
import type { Habit, HabitInput } from '@/features/habits/types/habit.types'
import { renderWithProviders } from '@/test/render'

const createMutate = vi.fn()
const updateMutate = vi.fn()

const measures = [{ id: 'm-vasos', name: 'Vasos', abbreviation: 'vasos' }]
const categories = [{ id: 'c-salud', name: 'Salud' }]
/** Colores ya en uso, con el caso mixto que llega de verdad de la API. */
const activeHabits = [{ color: '#10B981' }, { color: null }]

vi.mock('@/features/habits/hooks/useHabits', () => ({
  useHabitCategoriesQuery: () => ({ data: categories }),
  useHabitMeasuresQuery: () => ({ data: measures }),
  useHabitsQuery: () => ({ data: { habits: activeHabits, page: 1, limit: 50, total: 2 } }),
  useCreateHabitMutation: () => ({
    mutate: createMutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useUpdateHabitMutation: () => ({
    mutate: updateMutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
}))

vi.mock('@/features/habits/hooks/useHabitPurposes', () => ({
  useHabitPurposesQuery: () => ({
    data: [{ id: 'p1', name: 'Alguien sereno', icon: 'dove', placement: 'want' }],
    isLoading: false,
  }),
  useCreateHabitPurposeMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/habits/hooks/useHabitMeasures', () => ({
  useCreateHabitMeasureMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/habits/hooks/useHabitCategories', () => ({
  useCreateHabitCategoryMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Meditar',
    description: null,
    habitType: 'boolean',
    periodDays: 1,
    weeklyLifelines: 0,
    status: 'active',
    hidden: false,
    shouldAvoid: false,
    shouldKeep: true,
    streak: 0,
    maxStreak: 0,
    days: 0,
    dailyGoal: 0,
    timerGoal: 0,
    timesGoal: 0,
    icon: null,
    color: null,
    orderIndex: 0,
    startDate: null,
    endDate: null,
    categoryId: null,
    measureId: null,
    purposeId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Habit
}

function lastCreatePayload(): HabitInput {
  return createMutate.mock.calls.at(-1)?.[0] as HabitInput
}

async function goToStep3(user: ReturnType<typeof userEvent.setup>, name = 'Meditación matutina') {
  await user.type(screen.getByLabelText('O dale un nombre'), name)
  await user.click(screen.getByRole('button', { name: /Siguiente/ }))
  await user.click(screen.getByRole('button', { name: /Siguiente/ }))
}

beforeEach(() => {
  createMutate.mockReset()
  updateMutate.mockReset()
})

describe('HabitFormModal — crear', () => {
  it('abre el wizard en el paso 1 de 3', () => {
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '¿Qué quieres cambiar?' })).toBeInTheDocument()
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument()
  })

  it('no usa jerga en el camino por defecto', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('O dale un nombre'), 'Meditar')
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))

    const body = document.body.textContent ?? ''
    expect(body).not.toMatch(/booleano/i)
    expect(body).not.toMatch(/contador/i)
    expect(body).not.toMatch(/tipo de hábito/i)
    expect(screen.getByText('Lo hice o no lo hice')).toBeInTheDocument()
  })

  it('pide el nombre y nada más para avanzar', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText(/Ponle un nombre para seguir/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('O dale un nombre'), 'Meditar')
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(
      screen.getByRole('heading', { name: '¿Cómo sabrás que lo cumpliste?' }),
    ).toBeInTheDocument()
  })

  it('crea el hábito recorriendo los tres pasos sin rellenar nada más', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    const payload = lastCreatePayload()
    expect(payload.name).toBe('Meditación matutina')
    expect(payload.habitType).toBe('boolean')
  })

  it('«Omitir y crear» crea con lo que haya', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: 'Omitir y crear' }))

    expect(createMutate).toHaveBeenCalledTimes(1)
  })

  it('guarda la frase de intención dentro de description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: '¿cuándo?' }))
    await user.click(screen.getByRole('menuitem', { name: 'me levante' }))
    await user.type(screen.getByLabelText('Dónde (opcional)'), 'el salón')
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    expect(lastCreatePayload().description).toBe(
      'Cuando me levante, haré meditación matutina en el salón.',
    )
  })

  it('los salvavidas se preguntan en lenguaje natural y guardan weeklyLifelines', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    expect(
      screen.getByText('¿Cuántos días puedes fallar sin romper la racha?'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    expect(lastCreatePayload().weeklyLifelines).toBe(2)
  })

  it('el propósito se elige entre píldoras y nunca bloquea', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /Alguien sereno/ }))
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    expect(lastCreatePayload().purposeId).toBe('p1')
  })

  it('una plantilla rellena los campos y deja seguir editando', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Beber agua/ }))

    const nameInput = screen.getByLabelText('O dale un nombre') as HTMLInputElement
    expect(nameInput.value).toBe('Beber agua')

    await user.clear(nameInput)
    await user.type(nameInput, 'Dos litros')
    expect(nameInput.value).toBe('Dos litros')
  })

  it('una plantilla con medida preselecciona la del usuario si existe por nombre', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Beber agua/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))

    const measureSelect = screen.getByLabelText('¿En qué lo cuentas?') as HTMLSelectElement
    expect(measureSelect.value).toBe('m-vasos')
    expect(screen.queryByText(/todavía no la tienes/)).not.toBeInTheDocument()
  })

  it('avisa antes de sustituir un nombre ya escrito por el de una plantilla', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    const nameInput = screen.getByLabelText('O dale un nombre') as HTMLInputElement
    await user.type(nameInput, 'Mi hábito')
    await user.click(screen.getByRole('button', { name: /Beber agua/ }))

    expect(await screen.findByText('¿Sustituir lo que ya escribiste?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dejarlo como está' }))
    expect(nameInput.value).toBe('Mi hábito')
  })

  it('dice que nada se guarda hasta el final', () => {
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)
    expect(screen.getByText('Nada se guarda hasta el último paso.')).toBeInTheDocument()
  })

  it('el color llega ya puesto, y no es ninguno de los que ya se usan', () => {
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    const checked = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true')

    expect(checked).toHaveLength(1)
    // La menta (#10b981) ya está cogida, aunque venga en mayúsculas.
    expect(checked[0].getAttribute('aria-label')).not.toBe('Menta')
  })

  it('guarda el color sorteado aunque nadie lo toque', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    expect(HABIT_COLORS.map((c) => c.hex)).toContain(lastCreatePayload().color)
  })

  it('el color no parpadea mientras se escribe el nombre', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    const selectedLabel = () =>
      screen
        .getAllByRole('radio')
        .find((radio) => radio.getAttribute('aria-checked') === 'true')
        ?.getAttribute('aria-label')

    const before = selectedLabel()
    await user.type(screen.getByLabelText('O dale un nombre'), 'Meditación matutina')

    expect(selectedLabel()).toBe(before)
  })

  it('aplicar una plantilla sustituye el color sorteado por el suyo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="create" open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Beber agua/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    await user.click(screen.getByRole('button', { name: /Crear hábito/ }))

    // El color de la plantilla «Beber agua».
    expect(lastCreatePayload().color).toBe('#0ea5e9')
  })

  it('ya no queda ninguna rueda de color del sistema', () => {
    const { container } = renderWithProviders(
      <HabitFormModal mode="create" open onClose={vi.fn()} />,
    )
    expect(container.querySelector('input[type="color"]')).toBeNull()
  })
})

describe('HabitFormModal — editar', () => {
  it('abre el formulario plano, no el wizard', () => {
    renderWithProviders(
      <HabitFormModal mode="edit" habit={buildHabit()} open onClose={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar hábito' })).toBeInTheDocument()
    expect(screen.queryByText('Paso 1 de 3')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })

  it('descompone la intención guardada en los tres huecos', () => {
    renderWithProviders(
      <HabitFormModal
        mode="edit"
        habit={buildHabit({
          description: 'Cuando desayune, haré 20 minutos de lectura en el sofá.',
        })}
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'desayune' })).toBeInTheDocument()
    expect(screen.getByLabelText('Qué haré')).toHaveValue('20 minutos de lectura')
    expect(screen.getByLabelText('Dónde (opcional)')).toHaveValue('el sofá')
  })

  it('conserva intacta una descripción libre previa y ofrece convertirla', async () => {
    const user = userEvent.setup()
    const legacy = 'Notas viejas sin formato, escritas a mano hace meses'
    renderWithProviders(
      <HabitFormModal
        mode="edit"
        habit={buildHabit({ description: legacy })}
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Descripción')).toHaveValue(legacy)
    expect(screen.getByRole('button', { name: 'Convertirlo en intención' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(updateMutate.mock.calls.at(-1)?.[0].description).toBe(legacy)
  })

  it('no le inventa un color a un hábito que no lo tiene', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HabitFormModal mode="edit" habit={buildHabit()} open onClose={vi.fn()} />)

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('aria-checked')).toBe('false')
    }

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(updateMutate.mock.calls.at(-1)?.[0].color).toBeNull()
  })

  it('muestra marcado el color que ya tiene el hábito', () => {
    renderWithProviders(
      <HabitFormModal mode="edit" habit={buildHabit({ color: '#8B5CF6' })} open onClose={vi.fn()} />,
    )

    expect(screen.getByRole('radio', { name: 'Violeta' }).getAttribute('aria-checked')).toBe('true')
  })

  it('ya no queda ninguna rueda de color del sistema', () => {
    const { container } = renderWithProviders(
      <HabitFormModal mode="edit" habit={buildHabit()} open onClose={vi.fn()} />,
    )
    expect(container.querySelector('input[type="color"]')).toBeNull()
  })
})
