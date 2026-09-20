import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * Los puntos de la tira (criterio 32) y, sobre todo, que usan **la misma clave
 * de caché** que la agenda: es lo que hace que invalidar una fecha refresque
 * las dos cosas.
 */

let guard = true
vi.mock('@/features/vida/hooks/useVidaQueryGuard', () => ({
  useVidaQueryGuard: () => guard,
}))

const getActivityDayPlan = vi.fn<(date: string) => Promise<ActivityDayPlanItem[]>>()
vi.mock('@/features/vida/api/activity-day-plan.api', () => ({
  getActivityDayPlan: (date: string) => getActivityDayPlan(date),
}))

function block(id: string, date: string): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    date,
    startTime: '08:00',
    endTime: '08:30',
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
  }
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

beforeEach(() => {
  guard = true
  getActivityDayPlan.mockReset()
  getActivityDayPlan.mockImplementation(async (date: string) =>
    date === '2026-09-19' ? [block('1', date), block('2', date)] : [],
  )
})

describe('useVidaWeekPlans', () => {
  it('marca con plan solo los días que traen bloques, y cuenta cuántos', async () => {
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekPlans(['2026-09-18', '2026-09-19']), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.byDate['2026-09-18']).toMatchObject({ hasPlan: false, blockCount: 0 })
    expect(result.current.byDate['2026-09-19']).toMatchObject({ hasPlan: true, blockCount: 2 })
  })

  it('escribe en la **misma** clave que la agenda: `vidaKeys.dayPlan.byDate`', async () => {
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekPlans(['2026-09-19']), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(client.getQueryData(vidaKeys.dayPlan.byDate('2026-09-19'))).toHaveLength(2)
  })

  it('un día ya pedido por la agenda no se vuelve a pedir: es un acierto de caché', async () => {
    const client = newClient()
    client.setQueryData(vidaKeys.dayPlan.byDate('2026-09-19'), [block('1', '2026-09-19')])

    const { result } = renderHook(() => useVidaWeekPlans(['2026-09-19']), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.byDate['2026-09-19']?.hasPlan).toBe(true))
    expect(getActivityDayPlan).not.toHaveBeenCalled()
  })

  it('sin sesión no consulta nada y los puntos no se quedan cargando (criterio 51)', () => {
    guard = false
    const { result } = renderHook(() => useVidaWeekPlans(['2026-09-18', '2026-09-19']), {
      wrapper: wrapper(newClient()),
    })

    expect(getActivityDayPlan).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
    expect(result.current.byDate['2026-09-18']).toMatchObject({
      hasPlan: false,
      isPending: false,
    })
  })

  it('mientras una fecha está en vuelo, su punto no afirma que no hay plan', () => {
    const { result } = renderHook(() => useVidaWeekPlans(['2026-09-19']), {
      wrapper: wrapper(newClient()),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.byDate['2026-09-19']?.isPending).toBe(true)
  })
})
