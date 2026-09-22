import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaArchivadasPage } from '@/features/vida/pages/VidaArchivadasPage'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * Molde de `VidaActividadesPage.test.tsx`: los hooks de datos se mockean y la
 * pantalla se monta con `renderWithProviders`. Criterios 24, 25, 26 y los
 * estados (28, 29, 30) sobre lo que esta pantalla pinta.
 *
 * `useDeleteActivityMutation` **no está en el mock a propósito**: si alguien
 * llamara a `activityRemove` desde aquí, el test reventaría (criterio 21).
 */
type QueryState = {
  data?: unknown
  isPending: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  isError: boolean
  refetch: () => void
}

const refetch = vi.fn()
const updateActivity = { mutate: vi.fn(), isPending: false, isError: false }
const updateVidaItem = { mutate: vi.fn(), isPending: false, isError: false }

let activitiesState: QueryState
let activitiesFilters: unknown[]
let categoriesState: { data: ActivityCategory[] }
let vidaItemsState: { data: VidaItem[] }
let vidaItemsQueryArgs: unknown[][]

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: (filters: unknown) => {
    activitiesFilters.push(filters)
    return activitiesState
  },
  useUpdateActivityMutation: () => updateActivity,
}))
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => categoriesState,
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaItemsQuery: (...args: unknown[]) => {
    vidaItemsQueryArgs.push(args)
    return vidaItemsState
  },
  useUpdateVidaItemMutation: () => updateVidaItem,
}))

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Fregar los platos',
    description: null,
    status: 'cancelled',
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

const categories: ActivityCategory[] = [
  {
    id: 'casa',
    userId: 1,
    orderIndex: 0,
    name: 'Casa',
    description: null,
    icon: 'house-chimney',
    color: '#8b5cf6',
  },
]

const archivedItem: VidaItem = {
  id: 'v1',
  userId: 1,
  activityId: 'a1',
  days: ['monday', 'friday'],
  startTime: null,
  durationMinutes: null,
  notes: 'después de comer',
  isActive: false,
  orderIndex: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function loaded(list: Activity[]): QueryState {
  return {
    data: { activities: list, page: 1, limit: 100, total: list.length },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
    refetch,
  }
}

beforeEach(() => {
  refetch.mockReset()
  updateActivity.mutate.mockReset()
  updateVidaItem.mutate.mockReset()
  updateActivity.mutate.mockImplementation((_input, options) => options?.onSuccess?.())
  activitiesState = loaded([buildActivity()])
  activitiesFilters = []
  categoriesState = { data: categories }
  vidaItemsState = { data: [archivedItem] }
  vidaItemsQueryArgs = []
})

describe('VidaArchivadasPage', () => {
  it('pide el listado con status cancelled y con los VidaItem desactivados (criterio 24)', () => {
    renderWithProviders(<VidaArchivadasPage />)

    expect(activitiesFilters[0]).toMatchObject({ status: 'cancelled', page: 1, limit: 100 })
    expect(vidaItemsQueryArgs[0]).toEqual([true])
  })

  it('lista lo archivado con su categoría y una vuelta al catálogo', () => {
    renderWithProviders(<VidaArchivadasPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Archivadas' })).toBeInTheDocument()
    expect(screen.getByText('Fregar los platos')).toBeInTheDocument()
    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Al catálogo' })).toHaveAttribute(
      'href',
      '/app/vida/actividades',
    )
  })

  it('«Restaurar» vuelve a pending y reactiva el mismo VidaItem sin tocar sus días (criterio 24)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaArchivadasPage />)

    await user.click(screen.getByRole('button', { name: 'Restaurar' }))

    expect(updateActivity.mutate).toHaveBeenCalledTimes(1)
    expect(updateActivity.mutate.mock.calls[0][0]).toEqual({ id: 'a1', status: 'pending' })
    expect(updateVidaItem.mutate).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mutate.mock.calls[0][0]).toEqual({ id: 'v1', isActive: true })
  })

  it('sin VidaItem no toca la plantilla al restaurar', async () => {
    const user = userEvent.setup()
    vidaItemsState = { data: [] }
    renderWithProviders(<VidaArchivadasPage />)

    await user.click(screen.getByRole('button', { name: 'Restaurar' }))

    expect(updateActivity.mutate).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()
  })

  it('sin nada archivado lo dice y deja volver (criterio 26)', () => {
    activitiesState = loaded([])
    renderWithProviders(<VidaArchivadasPage />)

    expect(screen.getByText('No has archivado nada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toBeInTheDocument()
  })

  it('sin sesión no gira un esqueleto eterno: ofrece entrar (criterio 29)', () => {
    activitiesState = {
      data: undefined,
      isPending: true,
      fetchStatus: 'idle',
      isError: false,
      refetch,
    }
    renderWithProviders(<VidaArchivadasPage />)

    expect(screen.getByText('Entra para ver lo que archivaste')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('mientras carga enseña esqueleto y no afirma que no hay nada (criterio 28)', () => {
    activitiesState = {
      data: undefined,
      isPending: true,
      fetchStatus: 'fetching',
      isError: false,
      refetch,
    }
    const { container } = renderWithProviders(<VidaArchivadasPage />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByText('No has archivado nada')).not.toBeInTheDocument()
  })

  it('con error avisa en cristiano y reintenta (criterio 30)', async () => {
    const user = userEvent.setup()
    activitiesState = {
      data: undefined,
      isPending: false,
      fetchStatus: 'idle',
      isError: true,
      refetch,
    }
    renderWithProviders(<VidaArchivadasPage />)

    expect(screen.getByText('No pudimos cargar lo que archivaste')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('no se lee «cancelada», «cancelar» ni «eliminar» en ningún sitio (criterio 25)', () => {
    const { container } = renderWithProviders(<VidaArchivadasPage />)
    const text = (container.textContent ?? '').toLowerCase()

    for (const word of ['cancel', 'eliminar', 'borrar', 'pendiente', 'prioridad', 'fallaste']) {
      expect(text).not.toContain(word)
    }
    expect(container.textContent).toContain('Restaurar')
  })

  it('un nombre de sesenta caracteres no rompe la fila (criterio 32)', () => {
    const longTitle = 'Fregar los platos de toda la semana antes de que se acumulen más'
    expect(longTitle.length).toBeGreaterThanOrEqual(60)
    activitiesState = loaded([buildActivity({ title: longTitle })])
    renderWithProviders(<VidaArchivadasPage />)

    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })
})
