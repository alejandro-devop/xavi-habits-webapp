import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import * as activityCategoriesApi from '@/features/activities/api/activity-categories.api'
import { useCreateActivityCategoryMutation } from '@/features/activities/hooks/useActivityCategories'

vi.mock('@/features/activities/api/activity-categories.api')
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

describe('useCreateActivityCategoryMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls API with correct input', async () => {
    const created = {
      id: '0194a1b2-c3d4-7000-8000-000000000099',
      userId: 1,
      orderIndex: 1,
      name: 'Personal',
      description: null,
      icon: 'book',
      color: '#22c55e',
    }
    vi.mocked(activityCategoriesApi.createActivityCategory).mockResolvedValue(created)

    const { result } = renderHook(() => useCreateActivityCategoryMutation(), { wrapper })

    result.current.mutate({
      name: 'Personal',
      icon: 'book',
      color: '#22c55e',
      orderIndex: 1,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(activityCategoriesApi.createActivityCategory).toHaveBeenCalledWith({
      name: 'Personal',
      icon: 'book',
      color: '#22c55e',
      orderIndex: 1,
    })
    expect(toastSuccess).toHaveBeenCalledWith('Categoría creada')
  })
})
