import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as followUpsApi from '@/features/activities/api/activity-followups.api'
import {
  useCreateActivityFollowUpMutation,
  useDeleteActivityFollowUpMutation,
} from '@/features/activities/hooks/useActivityFollowUps'

vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' }),
}))

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (s: { accessToken: string }) => unknown) =>
    selector({ accessToken: 'token' }),
}))

vi.mock('@/features/auth/store/auth.selectors', () => ({
  selectIsAuthenticated: (s: { accessToken: string }) => Boolean(s.accessToken),
}))

vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useActivityFollowUps mutations', () => {
  it('create mutation calls API with correct input', async () => {
    const spy = vi.spyOn(followUpsApi, 'createActivityFollowUp').mockResolvedValue({
      id: 'f1',
      activityId: '7',
      date: '2026-05-20',
      startTime: '09:30:00',
      durationMinutes: 90,
      endTime: '11:00:00',
      endDate: '2026-05-20',
      endDateTime: '2026-05-20T11:00:00',
      notes: 'Deep work',
    })

    const { result } = renderHook(() => useCreateActivityFollowUpMutation(), { wrapper })

    result.current.mutate({
      activityId: '7',
      date: '2026-05-20',
      startTime: '09:30',
      durationMinutes: 90,
      notes: 'Deep work',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({
      activityId: '7',
      date: '2026-05-20',
      startTime: '09:30',
      durationMinutes: 90,
      notes: 'Deep work',
    })
  })

  it('delete mutation calls API', async () => {
    const spy = vi.spyOn(followUpsApi, 'deleteActivityFollowUp').mockResolvedValue(true)

    const { result } = renderHook(() => useDeleteActivityFollowUpMutation(), { wrapper })

    result.current.mutate({ id: 'f1', date: '2026-05-20', activityId: '7' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('f1')
  })
})
