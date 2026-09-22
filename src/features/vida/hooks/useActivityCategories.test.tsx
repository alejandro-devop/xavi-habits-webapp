import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import {
  useActivityCategoriesQuery,
  useCreateActivityCategoryMutation,
  useDeleteActivityCategoryMutation,
  useUpdateActivityCategoryMutation,
} from '@/features/vida/hooks/useActivityCategories'
import { vidaKeys } from '@/shared/api/query-keys'

vi.mock('@/features/vida/api/activity-categories.api')
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
vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
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

const mockCategory = {
  id: 'c1',
  userId: 1,
  orderIndex: 0,
  name: 'Trabajo',
  description: null,
  icon: null,
  color: '#10B981',
  goalId: null,
  goal: null,
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

describe('categorías de actividad', () => {
  it('la consulta pide la lista con la clave de Vida', async () => {
    vi.mocked(activityCategoriesApi.getActivityCategories).mockResolvedValue([mockCategory])
    const { result } = renderHook(() => useActivityCategoriesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockCategory])
    expect(queryClient.getQueryData(vidaKeys.categories.list())).toEqual([mockCategory])
  })

  it('crear invalida la lista', async () => {
    vi.mocked(activityCategoriesApi.createActivityCategory).mockResolvedValue(mockCategory)
    const { result } = renderHook(() => useCreateActivityCategoryMutation(), { wrapper })

    result.current.mutate({ name: 'Trabajo' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activityCategoriesApi.createActivityCategory).toHaveBeenCalledWith({ name: 'Trabajo' })
    expect(invalidated).toEqual([vidaKeys.categories.list()])
  })

  it('actualizar invalida lista y detalle', async () => {
    vi.mocked(activityCategoriesApi.updateActivityCategory).mockResolvedValue(mockCategory)
    const { result } = renderHook(() => useUpdateActivityCategoryMutation(), { wrapper })

    result.current.mutate({ id: 'c1', name: 'Personal' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual([vidaKeys.categories.list(), vidaKeys.categories.detail('c1')])
  })

  it('borrar llama al API e invalida la lista', async () => {
    vi.mocked(activityCategoriesApi.deleteActivityCategory).mockResolvedValue(true)
    const { result } = renderHook(() => useDeleteActivityCategoryMutation(), { wrapper })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activityCategoriesApi.deleteActivityCategory).toHaveBeenCalledWith('c1')
    expect(invalidated).toEqual([vidaKeys.categories.list()])
  })
})
