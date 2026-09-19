import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as dayPlanApi from '@/features/vida/api/activity-day-plan.api'
import {
  useActivityDayPlanQuery,
  useAddDayPlanItemMutation,
  useEditDayPlanItemMutation,
  useRemoveDayPlanItemMutation,
  useSetActivityDayPlanMutation,
} from '@/features/vida/hooks/useActivityDayPlan'
import { vidaKeys } from '@/shared/api/query-keys'

vi.mock('@/features/vida/api/activity-day-plan.api')
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

/**
 * Sin `shouldAdvanceTime` el reloj congelado deja a `waitFor` colgado 5 s por
 * test: la trampa que dejó anotada la tajada 2.
 */
function freezeSaturday() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 8, 19, 12, 0, 0))
}

const planItem = {
  id: 'p1',
  userId: 1,
  activityId: '7',
  date: '2026-09-19',
  startTime: '09:00',
  endTime: '10:30',
  orderIndex: 0,
  completedAt: null,
  createdAt: '2026-09-19T08:00:00.000Z',
  updatedAt: '2026-09-19T08:00:00.000Z',
  activity: { id: '7', title: 'Escribir', description: null, category: null },
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

afterEach(() => {
  vi.useRealTimers()
})

describe('plan del día', () => {
  it('consulta el plan de una fecha, y también el de una fecha futura', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.getActivityDayPlan).mockResolvedValue([planItem])

    const hoy = renderHook(() => useActivityDayPlanQuery('2026-09-19'), { wrapper })
    await waitFor(() => expect(hoy.result.current.isSuccess).toBe(true))
    expect(dayPlanApi.getActivityDayPlan).toHaveBeenCalledWith('2026-09-19')
    expect(hoy.result.current.data).toEqual([planItem])

    // Planear mañana es el caso de uso: a diferencia de los follow-ups, no se bloquea.
    const manana = renderHook(() => useActivityDayPlanQuery('2026-09-20'), { wrapper })
    await waitFor(() => expect(manana.result.current.isSuccess).toBe(true))
    expect(dayPlanApi.getActivityDayPlan).toHaveBeenCalledWith('2026-09-20')
  })

  it('sin fecha no consulta', () => {
    freezeSaturday()
    const { result } = renderHook(() => useActivityDayPlanQuery(''), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(dayPlanApi.getActivityDayPlan).not.toHaveBeenCalled()
  })

  it('guardar el plan invalida solo el plan de esa fecha', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.setActivityDayPlan).mockResolvedValue([planItem])
    const { result } = renderHook(() => useSetActivityDayPlanMutation(), { wrapper })

    const input = {
      date: '2026-09-19',
      items: [{ activityId: '7', startTime: '09:00', endTime: '10:30' }],
    }
    result.current.mutate(input)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dayPlanApi.setActivityDayPlan).toHaveBeenCalledWith(input)
    expect(invalidated).toEqual([vidaKeys.dayPlan.byDate('2026-09-19')])
  })

  it('añadir un bloque invalida el plan de su fecha', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.addActivityDayPlanItem).mockResolvedValue(planItem)
    const { result } = renderHook(() => useAddDayPlanItemMutation(), { wrapper })

    result.current.mutate({
      date: '2026-09-19',
      activityId: '7',
      startTime: '09:00',
      endTime: '10:30',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual([vidaKeys.dayPlan.byDate('2026-09-19')])
  })

  it('editar un bloque usa la fecha de la respuesta, que es la única que la trae', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.editActivityDayPlanItem).mockResolvedValue({
      ...planItem,
      date: '2026-09-21',
    })
    const { result } = renderHook(() => useEditDayPlanItemMutation(), { wrapper })

    result.current.mutate({ itemId: 'p1', startTime: '11:00' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dayPlanApi.editActivityDayPlanItem).toHaveBeenCalledWith({
      itemId: 'p1',
      startTime: '11:00',
    })
    expect(invalidated).toEqual([vidaKeys.dayPlan.byDate('2026-09-21')])
  })

  it('quitar un bloque manda solo el itemId y invalida la fecha que le pasan', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.removeActivityDayPlanItem).mockResolvedValue(true)
    const { result } = renderHook(() => useRemoveDayPlanItemMutation(), { wrapper })

    result.current.mutate({ itemId: 'p1', date: '2026-09-19' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dayPlanApi.removeActivityDayPlanItem).toHaveBeenCalledWith({ itemId: 'p1' })
    expect(invalidated).toEqual([vidaKeys.dayPlan.byDate('2026-09-19')])
  })

  it('una fecha con hora se recorta al día al invalidar', async () => {
    freezeSaturday()
    vi.mocked(dayPlanApi.setActivityDayPlan).mockResolvedValue([planItem])
    const { result } = renderHook(() => useSetActivityDayPlanMutation(), { wrapper })

    result.current.mutate({ date: '2026-09-19T09:00:00', items: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual([vidaKeys.dayPlan.byDate('2026-09-19')])
  })
})
