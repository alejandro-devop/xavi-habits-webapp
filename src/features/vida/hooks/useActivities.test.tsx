import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as activitiesApi from '@/features/vida/api/activities.api'
import {
  useCompleteActivityMutation,
  useCreateActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '@/features/vida/hooks/useActivities'
import { vidaKeys } from '@/shared/api/query-keys'

vi.mock('@/features/vida/api/activities.api')
vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' }),
}))
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: 'token' }),
}))
vi.mock('@/features/auth/store/auth.selectors', () => ({
  selectIsAuthenticated: (s: { accessToken: string | null }) => Boolean(s.accessToken),
}))

const toastSuccess = vi.fn()

vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    show: vi.fn(),
  }),
}))

let queryClient: QueryClient
let invalidated: unknown[][]

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const mockActivity = {
  id: '7',
  userId: 1,
  title: 'Test',
  description: null,
  status: 'pending' as const,
  priority: 'medium' as const,
  categoryId: null,
  scheduledDate: null,
  completedAt: null,
  spentTimeMinutes: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  invalidated = []
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters) => {
    invalidated.push(filters?.queryKey as unknown[])
    return Promise.resolve()
  })
})

describe('mutaciones de actividades', () => {
  it('crear llama al API e invalida la lista de actividades', async () => {
    vi.mocked(activitiesApi.createActivity).mockResolvedValue(mockActivity)
    const { result } = renderHook(() => useCreateActivityMutation(), { wrapper })

    result.current.mutate({ title: 'Test', priority: 'high' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.createActivity).toHaveBeenCalledWith({ title: 'Test', priority: 'high' })
    expect(invalidated).toEqual([vidaKeys.activities.all()])
    expect(toastSuccess).toHaveBeenCalledWith('Actividad creada')
  })

  it('actualizar invalida además el detalle de esa actividad', async () => {
    vi.mocked(activitiesApi.updateActivity).mockResolvedValue(mockActivity)
    const { result } = renderHook(() => useUpdateActivityMutation(), { wrapper })

    result.current.mutate({ id: '7', title: 'Actualizada' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.updateActivity).toHaveBeenCalledWith({ id: '7', title: 'Actualizada' })
    expect(invalidated).toEqual([vidaKeys.activities.all(), vidaKeys.activities.detail('7')])
  })

  it('borrar llama al API con el id', async () => {
    vi.mocked(activitiesApi.removeActivity).mockResolvedValue(true)
    const { result } = renderHook(() => useDeleteActivityMutation(), { wrapper })

    result.current.mutate('7')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.removeActivity).toHaveBeenCalledWith('7')
    expect(invalidated).toEqual([vidaKeys.activities.all()])
  })

  it('completar llama al API e invalida lista y detalle', async () => {
    vi.mocked(activitiesApi.completeActivity).mockResolvedValue({
      ...mockActivity,
      status: 'completed',
    })
    const { result } = renderHook(() => useCompleteActivityMutation(), { wrapper })

    result.current.mutate('7')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.completeActivity).toHaveBeenCalledWith('7')
    expect(invalidated).toEqual([vidaKeys.activities.all(), vidaKeys.activities.detail('7')])
    expect(toastSuccess).toHaveBeenCalledWith('Actividad completada')
  })

  it('las claves de Vida no se pisan con las de hábitos', () => {
    expect(vidaKeys.all).toEqual(['vida'])
    expect(vidaKeys.activities.list({})).toEqual(['vida', 'activities', 'list', {}])
  })
})
