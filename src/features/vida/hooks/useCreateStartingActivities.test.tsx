import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as activitiesApi from '@/features/vida/api/activities.api'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import type { VidaStartingPoint } from '@/features/vida/data/vida-starting-points'
import { useCreateStartingActivities } from '@/features/vida/hooks/useCreateStartingActivities'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'

/**
 * Criterios 7, 8, 10 y 11: crea exactamente lo marcado, reutiliza la categoría
 * que ya existía (ignorando mayúsculas y tildes), un doble toque no duplica y
 * un fallo a mitad deja creado lo que sí salió, nombrando lo que no.
 */

vi.mock('@/features/vida/api/activities.api')
vi.mock('@/features/vida/api/activity-categories.api')

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    show: vi.fn(),
  }),
}))

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function point(overrides: Partial<VidaStartingPoint> = {}): VidaStartingPoint {
  return {
    id: 'banarme',
    title: 'Bañarme',
    icon: 'shower',
    categoryName: 'Yo',
    ...overrides,
  }
}

function category(overrides: Partial<ActivityCategory> = {}): ActivityCategory {
  return {
    id: 'c-yo',
    userId: 1,
    orderIndex: 0,
    name: 'Yo',
    description: null,
    icon: 'spa',
    color: '#0284c7',
    ...overrides,
  }
}

function activity(title: string, categoryId: string | null): Activity {
  return {
    id: `a-${title}`,
    userId: 1,
    title,
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId,
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

const createCategory = vi.mocked(activityCategoriesApi.createActivityCategory)
const getCategories = vi.mocked(activityCategoriesApi.getActivityCategories)
const createActivity = vi.mocked(activitiesApi.createActivity)

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  getCategories.mockResolvedValue([])
  createCategory.mockImplementation(async (input) =>
    category({ id: `c-${input.name}`, name: input.name }),
  )
  createActivity.mockImplementation(async (input) =>
    activity(input.title, input.categoryId ?? null),
  )
})

describe('useCreateStartingActivities', () => {
  it('crea exactamente lo marcado, cada una con su categoría (criterio 7)', async () => {
    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    const points = [
      point(),
      point({ id: 'cocinar', title: 'Cocinar', categoryName: 'Comida' }),
      point({ id: 'descansar', title: 'Descansar', categoryName: 'Yo' }),
    ]
    act(() => result.current.mutate(points))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.created).toHaveLength(3)
    expect(result.current.data?.failed).toEqual([])
    expect(createActivity).toHaveBeenCalledTimes(3)
    for (const call of createActivity.mock.calls) {
      expect(call[0].categoryId).toBeTruthy()
    }
    // Dos actividades de «Yo» no crean dos categorías «Yo».
    expect(createCategory).toHaveBeenCalledTimes(2)
    expect(createCategory.mock.calls.map((call) => call[0].name)).toEqual(['Yo', 'Comida'])
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })

  it('reutiliza la categoría que ya existía aunque cambien mayúsculas y tildes (criterio 8)', async () => {
    getCategories.mockResolvedValue([
      category({ id: 'c-existente', name: 'compañía' }),
      category({ id: 'c-yo', name: 'YO' }),
    ])
    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() =>
      result.current.mutate([
        point(),
        point({ id: 'llamar', title: 'Llamar a alguien', categoryName: 'Compania' }),
      ]),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createCategory).not.toHaveBeenCalled()
    expect(createActivity.mock.calls.map((call) => call[0].categoryId)).toEqual([
      'c-yo',
      'c-existente',
    ])
  })

  it('crea con nombre, icono y color la categoría que no existía (criterio 8)', async () => {
    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() => result.current.mutate([point({ categoryName: 'Casa' })]))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createCategory).toHaveBeenCalledWith({
      name: 'Casa',
      icon: 'house-chimney',
      color: '#8b5cf6',
    })
  })

  it('un segundo toque mientras crea no vuelve a crear (criterio 10)', async () => {
    let release: (value: Activity) => void = () => {}
    createActivity.mockImplementationOnce(
      () =>
        new Promise<Activity>((resolve) => {
          release = resolve
        }),
    )

    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() => result.current.mutate([point()]))
    await waitFor(() => expect(result.current.isPending).toBe(true))

    // Con `isPending` el botón está deshabilitado; si algo colara un segundo
    // toque, tampoco habría una segunda tanda de llamadas al API.
    expect(createActivity).toHaveBeenCalledTimes(1)

    act(() => release(activity('Bañarme', 'c-Yo')))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createActivity).toHaveBeenCalledTimes(1)
    expect(result.current.data?.created).toHaveLength(1)
  })

  it('un fallo a mitad no tira lo creado y nombra lo que falló (criterio 11)', async () => {
    createActivity.mockImplementation(async (input) => {
      if (input.title === 'Cocinar') throw new Error('El servidor no respondió')
      return activity(input.title, input.categoryId ?? null)
    })

    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() =>
      result.current.mutate([
        point(),
        point({ id: 'cocinar', title: 'Cocinar', categoryName: 'Comida' }),
        point({ id: 'descansar', title: 'Descansar', categoryName: 'Yo' }),
      ]),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Resuelve, no lanza: lo creado sigue creado.
    expect(result.current.isError).toBe(false)
    expect(result.current.data?.created.map((item) => item.title)).toEqual([
      'Bañarme',
      'Descansar',
    ])
    expect(result.current.data?.failed).toEqual([
      { name: 'Cocinar', reason: 'El servidor no respondió' },
    ])
    // Nunca se anuncia «3 creadas» cuando fueron 2.
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('2 de 3'))
  })

  it('si la categoría falla, su actividad no se crea a ciegas y queda nombrada (criterio 11)', async () => {
    createCategory.mockRejectedValue(new Error('No se pudo crear la categoría'))

    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() => result.current.mutate([point()]))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createActivity).not.toHaveBeenCalled()
    expect(result.current.data?.created).toEqual([])
    expect(result.current.data?.failed).toEqual([
      { name: 'Yo', reason: 'No se pudo crear la categoría' },
    ])
    expect(toastError).toHaveBeenCalledWith('No pudimos crear ninguna. Inténtalo otra vez.')
  })

  it('invalida el catálogo una sola vez al final, no una por actividad', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateStartingActivities(), { wrapper })

    act(() =>
      result.current.mutate([
        point(),
        point({ id: 'cocinar', title: 'Cocinar', categoryName: 'Comida' }),
      ]),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey))
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.length).toBeLessThanOrEqual(2)
  })
})
