import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaActivityNoteHistory } from '@/features/vida/hooks/useVidaActivityNoteHistory'

/**
 * «Lo de otras veces» (FEAT-018, criterios 546 y 547).
 *
 * Lo que este hook tiene que hacer bien es **no costar nada cuando el editor
 * está cerrado** y pedir lo justo cuando se abre.
 */

vi.mock('@/features/vida/api/activity-followups.api')
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

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function row(id: string, notes: string | null) {
  return { id, date: '2026-09-18', startTime: '09:00:00', notes }
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('useVidaActivityNoteHistory', () => {
  it('con el editor cerrado **no consulta nada**', () => {
    const { result } = renderHook(
      () => useVidaActivityNoteHistory({ activityId: '7', enabled: false }),
      { wrapper },
    )

    expect(followUpsApi.getActivityFollowUpsByActivity).not.toHaveBeenCalled()
    expect(result.current.suggestions).toEqual([])
    // Apagada no es «pendiente»: sin esto la hoja pintaría un hueco para
    // siempre (criterio 547).
    expect(result.current.isPending).toBe(false)
  })

  it('sin actividad tampoco consulta', () => {
    renderHook(() => useVidaActivityNoteHistory({ activityId: null, enabled: true }), { wrapper })

    expect(followUpsApi.getActivityFollowUpsByActivity).not.toHaveBeenCalled()
  })

  it('criterio 546 — abierto, pide las últimas de esa actividad y saca tres píldoras', async () => {
    vi.mocked(followUpsApi.getActivityFollowUpsByActivity).mockResolvedValue([
      row('f9', 'Lo de ahora'),
      row('f8', 'Revisando MRs'),
      row('f7', null),
      row('f6', 'revisando mrs'),
      row('f5', 'Daily + planning'),
      row('f4', 'Soporte y tickets'),
      row('f3', 'Una cuarta que ya no cabe'),
    ])

    const { result } = renderHook(
      () => useVidaActivityNoteHistory({ activityId: '7', enabled: true, excludeId: 'f9' }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    // El límite que manda es el del validador del API (`int positivo <= 500`).
    expect(followUpsApi.getActivityFollowUpsByActivity).toHaveBeenCalledWith('7', 20)
    expect(result.current.suggestions).toEqual([
      'Revisando MRs',
      'Daily + planning',
      'Soporte y tickets',
    ])
  })

  it('criterio 547 — ninguna sesión suya llevó nota: lista vacía, sin error', async () => {
    vi.mocked(followUpsApi.getActivityFollowUpsByActivity).mockResolvedValue([
      row('f2', null),
      row('f1', '  '),
    ])

    const { result } = renderHook(
      () => useVidaActivityNoteHistory({ activityId: '7', enabled: true }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.suggestions).toEqual([])
  })
})
