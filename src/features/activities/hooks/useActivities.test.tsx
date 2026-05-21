import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import * as activitiesApi from '@/features/activities/api/activities.api'
import {
  useCompleteActivityMutation,
  useCreateActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '@/features/activities/hooks/useActivities'

vi.mock('@/features/activities/api/activities.api')
vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' }),
}))
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (s: { accessToken: string | null; refreshToken: string | null }) => unknown) =>
    selector({ accessToken: 'token', refreshToken: 'refresh' }),
}))

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

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
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

describe('activity mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create calls API with input', async () => {
    vi.mocked(activitiesApi.createActivity).mockResolvedValue(mockActivity)
    const { result } = renderHook(() => useCreateActivityMutation(), { wrapper })
    result.current.mutate({ title: 'Test', priority: 'high' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.createActivity).toHaveBeenCalledWith({ title: 'Test', priority: 'high' })
    expect(toastSuccess).toHaveBeenCalledWith('Actividad creada')
  })

  it('update calls API with id and fields', async () => {
    vi.mocked(activitiesApi.updateActivity).mockResolvedValue(mockActivity)
    const { result } = renderHook(() => useUpdateActivityMutation(), { wrapper })
    result.current.mutate({ id: '7', title: 'Updated' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.updateActivity).toHaveBeenCalledWith({ id: '7', title: 'Updated' })
  })

  it('delete calls API with id', async () => {
    vi.mocked(activitiesApi.removeActivity).mockResolvedValue(true)
    const { result } = renderHook(() => useDeleteActivityMutation(), { wrapper })
    result.current.mutate('7')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.removeActivity).toHaveBeenCalledWith('7')
  })

  it('complete calls API with id', async () => {
    vi.mocked(activitiesApi.completeActivity).mockResolvedValue({
      ...mockActivity,
      status: 'completed',
    })
    const { result } = renderHook(() => useCompleteActivityMutation(), { wrapper })
    result.current.mutate('7')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activitiesApi.completeActivity).toHaveBeenCalledWith('7')
    expect(toastSuccess).toHaveBeenCalledWith('Actividad completada')
  })
})
