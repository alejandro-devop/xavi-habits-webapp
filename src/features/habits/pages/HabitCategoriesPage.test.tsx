import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitCategoriesPage } from '@/features/habits/pages/HabitCategoriesPage'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { CORE_COLORS } from '@/shared/ui/ColorPicker/color-palette'
import { renderWithProviders } from '@/test/render'

/**
 * FEAT-026 tajada 1: la pantalla Categorías elige el color en la paleta.
 * Crear nace con un color del núcleo que no repite el de otra categoría;
 * editar enseña el que hay y no lo cambia si no se toca.
 *
 * El mock lista **los cuatro hooks** que la pantalla usa; si un día usa otro,
 * que reviente aquí y no pase en verde por casualidad.
 */

type QueryState = {
  data: HabitCategory[] | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

type MutationState = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  variables?: unknown
}

let categoriesState: QueryState
let createMutation: MutationState
let updateMutation: MutationState
let removeMutation: MutationState

vi.mock('@/features/habits/hooks/useHabitCategories', () => ({
  useHabitCategoriesQuery: () => categoriesState,
  useCreateHabitCategoryMutation: () => createMutation,
  useUpdateHabitCategoryMutation: () => updateMutation,
  useRemoveHabitCategoryMutation: () => removeMutation,
}))

const [MINT, OLIVE, AMBER, CRIMSON, VIOLET, BLUE] = CORE_COLORS

function buildCategory(overrides: Partial<HabitCategory> = {}): HabitCategory {
  return {
    id: '1',
    userId: 1,
    name: 'Salud',
    description: null,
    icon: null,
    color: MINT.hex,
    orderIndex: 0,
    ...overrides,
  }
}

function arrived(data: HabitCategory[]): QueryState {
  return { data, isLoading: false, isError: false, error: null, refetch: vi.fn() }
}

function colorGroup() {
  return screen.getByRole('radiogroup', { name: 'Color de la categoría' })
}

function checkedLabels() {
  return within(colorGroup())
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    .map((radio) => radio.getAttribute('aria-label'))
}

let randomSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  createMutation = { mutate: vi.fn(), isPending: false }
  updateMutation = { mutate: vi.fn(), isPending: false }
  removeMutation = { mutate: vi.fn(), isPending: false }
  categoriesState = arrived([])
  randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
})

afterEach(() => {
  randomSpy.mockRestore()
})

describe('HabitCategoriesPage — crear', () => {
  it('nace con una muestra marcada del núcleo que ninguna categoría usa, y es la que se envía (criterios 2 y 6)', async () => {
    const user = userEvent.setup()
    categoriesState = arrived([
      buildCategory({ id: '1', color: MINT.hex }),
      buildCategory({ id: '2', name: 'Mente', color: '#6366f1', orderIndex: 1 }),
      buildCategory({ id: '3', name: 'Casa', color: CRIMSON.hex.toUpperCase(), orderIndex: 2 }),
    ])
    const { container } = renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))

    expect(document.querySelector('input[type="color"]')).toBeNull()
    expect(container.ownerDocument.querySelector('input[placeholder="#6366f1"]')).toBeNull()
    // Con random = 0, el primero de los libres: ni Menta ni Carmín (usados), Oliva.
    expect(checkedLabels()).toEqual([OLIVE.label])
    expect(within(colorGroup()).getAllByRole('radio')).toHaveLength(22)

    await user.type(screen.getByLabelText('Nombre'), 'Deporte')
    expect(checkedLabels()).toEqual([OLIVE.label])

    await user.click(screen.getByRole('button', { name: 'Crear' }))
    expect(createMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Deporte', color: OLIVE.hex, orderIndex: 3 }),
      expect.anything(),
    )
  })

  it('con cualquier generador, nunca repite el color de otra categoría mientras quede uno libre (criterio 2)', async () => {
    const user = userEvent.setup()
    categoriesState = arrived([
      buildCategory({ id: '1', color: MINT.hex }),
      buildCategory({ id: '2', color: AMBER.hex }),
      buildCategory({ id: '3', color: BLUE.hex }),
    ])
    randomSpy.mockReturnValue(0.999)
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))

    // Libres: Oliva, Carmín, Violeta. Con 0.999, el último de ellos.
    expect(checkedLabels()).toEqual([VIOLET.label])
  })

  it('con los seis usados, marca el que menos categorías tienen (criterio 3)', async () => {
    const user = userEvent.setup()
    const twice = CORE_COLORS.filter((color) => color.hex !== AMBER.hex)
    categoriesState = arrived(
      [...CORE_COLORS, ...twice].map((color, index) =>
        buildCategory({ id: String(index), name: `C${index}`, color: color.hex, orderIndex: index }),
      ),
    )
    randomSpy.mockReturnValue(0.5)
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))

    expect(checkedLabels()).toEqual([AMBER.label])
  })

  it('sin ninguna categoría, cualquiera de los seis; y la pantalla no mira los hábitos (criterios 3 y 4)', async () => {
    // La pantalla no consulta hábitos: el sorteo solo recibe los colores de las
    // categorías. Con cero categorías reparte entre los seis, usen lo que usen
    // los hábitos.
    const user = userEvent.setup()
    randomSpy.mockReturnValue(0.99)
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Crear la primera categoría' }))

    expect(checkedLabels()).toEqual([BLUE.label])
  })

  it('si la lista aún no ha llegado, no se puede abrir crear; al llegar, sortea sobre ella (criterio 10)', async () => {
    const user = userEvent.setup()
    categoriesState = { data: undefined, isLoading: false, isError: false, error: null, refetch: vi.fn() }
    const { rerender } = renderWithProviders(<HabitCategoriesPage />)

    expect(screen.getByRole('button', { name: 'Nueva categoría' })).toBeDisabled()
    // Tampoco sale el «no hay categorías todavía»: no se sabe aún.
    expect(screen.queryByRole('button', { name: 'Crear la primera categoría' })).toBeNull()
    expect(randomSpy).not.toHaveBeenCalled()

    categoriesState = arrived([buildCategory({ id: '1', color: MINT.hex })])
    rerender(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    // Sobre la lista llegada: Menta está usada, así que con random = 0 sale Oliva.
    expect(checkedLabels()).toEqual([OLIVE.label])
  })

  it('mientras se crea, las muestras están deshabilitadas (criterio 11)', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(<HabitCategoriesPage />)
    await user.click(screen.getByRole('button', { name: 'Crear la primera categoría' }))

    createMutation = { ...createMutation, isPending: true }
    rerender(<HabitCategoriesPage />)

    for (const radio of within(colorGroup()).getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })
})

describe('HabitCategoriesPage — editar', () => {
  it('un color de fuera de la paleta sale como «Color actual» y guardar envía el mismo hex (criterio 7)', async () => {
    const user = userEvent.setup()
    categoriesState = arrived([buildCategory({ id: '9', name: 'Mente', color: '#6366F1' })])
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const radios = within(colorGroup()).getAllByRole('radio')
    expect(radios).toHaveLength(23)
    expect(radios[0]).toHaveAccessibleName('Color actual')
    expect(checkedLabels()).toEqual(['Color actual'])

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Mente clara')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: '9', name: 'Mente clara', color: '#6366F1' }),
      expect.anything(),
    )
    expect(randomSpy).not.toHaveBeenCalled()
  })

  it('una categoría sin color no marca nada y guardar envía color: null (criterio 8)', async () => {
    const user = userEvent.setup()
    categoriesState = arrived([buildCategory({ id: '4', color: null })])
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(checkedLabels()).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: '4', color: null }),
      expect.anything(),
    )
  })

  it('no sortea: una categoría con color del núcleo se abre con el suyo, aunque otra lo comparta (criterio 9)', async () => {
    const user = userEvent.setup()
    categoriesState = arrived([
      buildCategory({ id: '1', name: 'Salud', color: VIOLET.hex, orderIndex: 0 }),
      buildCategory({ id: '2', name: 'Mente', color: VIOLET.hex, orderIndex: 1 }),
    ])
    renderWithProviders(<HabitCategoriesPage />)

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[1])

    expect(checkedLabels()).toEqual([VIOLET.label])
    expect(randomSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('radio', { name: CRIMSON.label }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(updateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', color: CRIMSON.hex }),
      expect.anything(),
    )
  })
})
