import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaCategoriasPage } from '@/features/vida/pages/VidaCategoriasPage'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import { renderWithProviders } from '@/test/render'

/**
 * Criterio 27: se ven todas las categorías con su icono, su color, su nombre y
 * cuántas actividades tiene cada una, y se edita nombre, icono y color.
 *
 * `useDeleteActivityCategoryMutation` **no está en el mock a propósito**:
 * borrar categorías está fuera de alcance en F1 y si alguien lo llamara desde
 * aquí el test reventaría.
 */
type CategoriesState = {
  data?: ActivityCategory[]
  isPending: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  isError: boolean
  refetch: () => void
}

const refetch = vi.fn()
const updateCategory = { mutateAsync: vi.fn(), isPending: false, isError: false }
const setCategoryGoal = { mutateAsync: vi.fn(), isPending: false, isError: false }

let categoriesState: CategoriesState
let activitiesState: { data: { activities: Activity[]; page: number; limit: number; total: number } }

vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => categoriesState,
  useUpdateActivityCategoryMutation: () => updateCategory,
  useSetActivityCategoryGoalMutation: () => setCategoryGoal,
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => activitiesState,
}))

function buildCategory(overrides: Partial<ActivityCategory> = {}): ActivityCategory {
  return {
    id: 'casa',
    userId: 1,
    orderIndex: 0,
    name: 'Casa',
    description: null,
    icon: 'house-chimney',
    color: '#8b5cf6',
    goalId: null,
    goal: null,
    ...overrides,
  }
}

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Organizar la casa',
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId: 'casa',
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const categories = [
  buildCategory(),
  buildCategory({
    id: 'yo',
    name: 'Yo',
    icon: 'spa',
    color: '#0284c7',
    orderIndex: 1,
    goalId: 'goal-work',
    goal: {
      id: 'goal-work',
      slug: 'work',
      name: 'Trabajo',
      icon: 'briefcase',
      color: '#0284c7',
      targetMinutes: 480,
      activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      orderIndex: 0,
    },
  }),
]

const activities = [
  buildActivity({ id: 'a1', categoryId: 'casa' }),
  buildActivity({ id: 'a2', categoryId: 'casa' }),
  buildActivity({ id: 'a3', categoryId: 'yo' }),
  // Archivada: no cuenta, igual que en el «N actividades · M categorías».
  buildActivity({ id: 'a4', categoryId: 'casa', status: 'cancelled' }),
  // Sin categoría: no suma a ninguna fila.
  buildActivity({ id: 'a5', categoryId: null }),
]

beforeEach(() => {
  refetch.mockReset()
  updateCategory.mutateAsync.mockReset()
  updateCategory.mutateAsync.mockResolvedValue(undefined)
  updateCategory.isPending = false
  setCategoryGoal.mutateAsync.mockReset()
  setCategoryGoal.mutateAsync.mockResolvedValue(undefined)
  setCategoryGoal.isPending = false
  categoriesState = {
    data: categories,
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
    refetch,
  }
  activitiesState = { data: { activities, page: 1, limit: 100, total: activities.length } }
})

describe('VidaCategoriasPage', () => {
  it('lista cada categoría con su color y cuántas actividades tiene (criterio 27)', () => {
    const { container } = renderWithProviders(<VidaCategoriasPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Categorías' })).toBeInTheDocument()
    const rows = [...container.querySelectorAll('li')]
    expect(rows).toHaveLength(2)
    expect(rows[0]?.textContent).toContain('Casa')
    // Dos activas: la archivada y la que no tiene categoría no cuentan.
    expect(rows[0]?.textContent).toContain('2 actividades')
    expect(rows[0]?.getAttribute('style')).toContain('--vida-category-color: #8b5cf6')
    expect(rows[1]?.textContent).toContain('Yo')
    expect(rows[1]?.textContent).toContain('1 actividad')
  })

  it('«Editar» abre el formulario con el nombre puesto y guarda el cambio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Casa' }))

    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    const input = within(dialog).getByLabelText('Cómo la llamas')
    expect(input).toHaveValue('Casa')

    await user.clear(input)
    await user.type(input, 'Hogar')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(updateCategory.mutateAsync).toHaveBeenCalledTimes(1)
    expect(updateCategory.mutateAsync.mock.calls[0][0]).toEqual({
      id: 'casa',
      name: 'Hogar',
      icon: 'house-chimney',
      color: '#8b5cf6',
    })
    // La casilla no se tocó: el puntero no viaja.
    expect(setCategoryGoal.mutateAsync).not.toHaveBeenCalled()
  })

  it('con el nombre vacío no envía y señala el campo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Casa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    await user.clear(within(dialog).getByLabelText('Cómo la llamas'))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(updateCategory.mutateAsync).not.toHaveBeenCalled()
    expect(within(dialog).getByText('Ponle un nombre a la categoría.')).toBeInTheDocument()
  })

  it('si la mutación falla el formulario no se cierra (criterio 16)', async () => {
    const user = userEvent.setup()
    updateCategory.mutateAsync.mockRejectedValueOnce(new Error('sin red'))
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Casa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(updateCategory.mutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog', { name: 'Editar categoría' })).toBeInTheDocument()
  })

  it('la casilla «Esto es trabajo» llega marcada si la categoría apunta a una meta (criterio 485)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Yo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    const box = within(dialog).getByLabelText('Esto es trabajo')

    expect(box).toBeChecked()
    expect(
      within(dialog).getByText('Sus horas suman en el arco de trabajo de Hoy.'),
    ).toBeInTheDocument()
  })

  it('marcar la casilla y guardar apunta la categoría a la meta, sin pantalla intermedia (criterios 484 y 486)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Casa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    await user.click(within(dialog).getByLabelText('Esto es trabajo'))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(setCategoryGoal.mutateAsync).toHaveBeenCalledTimes(1))
    // Sin `goalId`: es el servidor quien crea la meta «Trabajo» si no existe.
    expect(setCategoryGoal.mutateAsync.mock.calls[0][0]).toEqual({
      categoryId: 'casa',
      attached: true,
    })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Editar categoría' })).not.toBeInTheDocument(),
    )
  })

  it('desmarcarla suelta el puntero', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaCategoriasPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Yo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
    await user.click(within(dialog).getByLabelText('Esto es trabajo'))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(setCategoryGoal.mutateAsync).toHaveBeenCalledTimes(1))
    expect(setCategoryGoal.mutateAsync.mock.calls[0][0]).toEqual({
      categoryId: 'yo',
      attached: false,
    })
  })

  it('sin sesión ofrece entrar en vez de girar para siempre (criterio 29)', () => {
    categoriesState = {
      data: undefined,
      isPending: true,
      fetchStatus: 'idle',
      isError: false,
      refetch,
    }
    renderWithProviders(<VidaCategoriasPage />)

    expect(screen.getByText('Entra para ver tus categorías')).toBeInTheDocument()
  })

  it('con error avisa y reintenta (criterio 30)', async () => {
    const user = userEvent.setup()
    categoriesState = {
      data: undefined,
      isPending: false,
      fetchStatus: 'idle',
      isError: true,
      refetch,
    }
    renderWithProviders(<VidaCategoriasPage />)

    expect(screen.getByText('No pudimos cargar tus categorías')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('sin ninguna categoría lo dice y deja volver', () => {
    categoriesState = { data: [], isPending: false, fetchStatus: 'idle', isError: false, refetch }
    renderWithProviders(<VidaCategoriasPage />)

    expect(screen.getByText('Todavía no tienes categorías')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toBeInTheDocument()
  })

  it('un nombre de categoría de cuarenta caracteres no rompe la fila (criterio 32)', () => {
    const longName = 'Cosas de casa que hago cada santo día ya'
    expect(longName.length).toBeGreaterThanOrEqual(40)
    categoriesState = {
      data: [buildCategory({ name: longName })],
      isPending: false,
      fetchStatus: 'idle',
      isError: false,
      refetch,
    }
    renderWithProviders(<VidaCategoriasPage />)

    expect(screen.getByText(longName)).toBeInTheDocument()
  })

  it('no se lee ni una palabra de culpa ni de gestión de proyectos (criterio 34)', () => {
    const { container } = renderWithProviders(<VidaCategoriasPage />)
    const text = (container.textContent ?? '').toLowerCase()

    for (const word of ['pendiente', 'prioridad', 'vencida', 'fallaste', 'cancelada', 'eliminar']) {
      expect(text).not.toContain(word)
    }
  })
})
