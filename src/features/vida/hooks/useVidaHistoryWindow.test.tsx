import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaHistoryWindow } from '@/features/vida/hooks/useVidaHistoryWindow'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUpsDateGroup } from '@/features/vida/types/activity-followup.types'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * **La ventana de seis semanas** (FEAT-007, tajada 1) y, sobre todo, **lo que
 * cuesta abrirla** (criterio 103: se mide, no se promete).
 *
 * Lo que este archivo deja medido, con el reloj inyectado:
 *
 * - En frío, un domingo: **42 planes + 1 rango = 43 consultas**.
 * - Llegando desde Revisión, con los días que la tira, la semana y el puente
 *   ya trajeron en caché: **lo que falta y nada más**.
 * - Volver a abrir la sección dentro del `staleTime`: **0 consultas** en los
 *   planes.
 */

let guard = true
vi.mock('@/features/vida/hooks/useVidaQueryGuard', () => ({
  useVidaQueryGuard: () => guard,
}))

const getActivityDayPlan = vi.fn<(date: string) => Promise<ActivityDayPlanItem[]>>()
vi.mock('@/features/vida/api/activity-day-plan.api', () => ({
  getActivityDayPlan: (date: string) => getActivityDayPlan(date),
}))

const getActivityFollowUpsInDates =
  vi.fn<(from: string, to: string) => Promise<ActivityFollowUpsDateGroup[]>>()
vi.mock('@/features/vida/api/activity-followups.api', () => ({
  getActivityFollowUpsInDates: (from: string, to: string) =>
    getActivityFollowUpsInDates(from, to),
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

/** Domingo: la ventana mide sus 42 días, que es el peor caso. */
const SUNDAY = '2026-09-20'
/** Lunes: la ventana mide 36, que es el mejor. */
const MONDAY = '2026-09-21'

function block(date: string): ActivityDayPlanItem {
  return {
    id: `${date}-1`,
    userId: 1,
    activityId: 'a-1',
    date,
    startTime: '08:00',
    endTime: '08:30',
    orderIndex: 0,
    completedAt: null,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
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
  getActivityDayPlan.mockImplementation(async () => [])
  getActivityFollowUpsInDates.mockReset()
  getActivityFollowUpsInDates.mockImplementation(async () => [])
})

describe('useVidaHistoryWindow — la ventana', () => {
  it('va del lunes de hace cinco semanas a hoy: 42 días el domingo, 36 el lunes', async () => {
    const domingo = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )
    expect(domingo.result.current.dates).toHaveLength(42)
    expect(domingo.result.current.from).toBe('2026-08-10')
    expect(domingo.result.current.to).toBe(SUNDAY)
    await waitFor(() => expect(domingo.result.current.isPending).toBe(false))

    const lunes = renderHook(() => useVidaHistoryWindow({ enabled: true, today: MONDAY }), {
      wrapper: wrapper(newClient()),
    })
    expect(lunes.result.current.dates).toHaveLength(36)
    expect(lunes.result.current.from).toBe('2026-08-17')
    await waitFor(() => expect(lunes.result.current.isPending).toBe(false))
  })

  it('sin la sección abierta no pide nada: montaje diferido de verdad', () => {
    renderHook(() => useVidaHistoryWindow({ enabled: false, today: SUNDAY }), {
      wrapper: wrapper(newClient()),
    })

    expect(getActivityDayPlan).not.toHaveBeenCalled()
    expect(getActivityFollowUpsInDates).not.toHaveBeenCalled()
  })

  it('sin sesión tampoco, y la sección no se queda cargando para siempre', () => {
    guard = false
    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )

    expect(getActivityDayPlan).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
  })
})

describe('useVidaHistoryWindow — lo que cuesta (criterio 103)', () => {
  it('en frío, un domingo: 42 consultas de plan y UNA de sesiones', async () => {
    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(getActivityDayPlan).toHaveBeenCalledTimes(42)
    expect(getActivityFollowUpsInDates).toHaveBeenCalledTimes(1)
    expect(getActivityFollowUpsInDates).toHaveBeenCalledWith('2026-08-10', SUNDAY)
  })

  it('llegando desde Revisión, los días que ya estaban son aciertos de caché', async () => {
    const client = newClient()
    // Lo que la tira, la semana y el puente dejaron en caché: los 20 días
    // anteriores a hoy, en **la misma clave** que usa esta ventana.
    for (let back = 0; back < 20; back += 1) {
      const date = new Date(2026, 8, 20 - back)
      const ymd = `2026-09-${String(date.getDate()).padStart(2, '0')}`
      client.setQueryData(vidaKeys.dayPlan.byDate(ymd), [block(ymd)])
    }

    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(getActivityDayPlan).toHaveBeenCalledTimes(22)
  })

  it('volver a abrir la sección dentro del reposo no pide ni un plan más', async () => {
    const client = newClient()
    const first = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(first.result.current.isPending).toBe(false))
    expect(getActivityDayPlan).toHaveBeenCalledTimes(42)
    first.unmount()

    const second = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(second.result.current.isPending).toBe(false))
    expect(getActivityDayPlan).toHaveBeenCalledTimes(42)
  })
})

describe('useVidaHistoryWindow — lo que no se sabe', () => {
  it('un día caído se marca, y no se lee como un día sin plan', async () => {
    getActivityDayPlan.mockImplementation(async (date: string) => {
      if (date === '2026-09-15') throw new Error('sin red')
      return []
    })

    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )

    await waitFor(() => expect(result.current.hasError).toBe(true))
    expect(result.current.byDate['2026-09-15']).toMatchObject({ isError: true, planItems: [] })
    expect(result.current.byDate['2026-09-14']).toMatchObject({ isError: false })
  })

  it('«Reintentar» repite solo lo que falló', async () => {
    getActivityDayPlan.mockImplementation(async (date: string) => {
      if (date === '2026-09-15') throw new Error('sin red')
      return []
    })

    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )
    await waitFor(() => expect(result.current.hasError).toBe(true))

    getActivityDayPlan.mockClear()
    result.current.refetch()
    await waitFor(() => expect(getActivityDayPlan).toHaveBeenCalledTimes(1))
    expect(getActivityDayPlan).toHaveBeenCalledWith('2026-09-15')
  })

  it('las sesiones del rango llegan repartidas por día', async () => {
    getActivityFollowUpsInDates.mockImplementation(async () => [
      {
        date: '2026-09-16',
        followUps: [
          {
            id: 's1',
            activityId: 'a-1',
            date: '2026-09-16',
            startTime: '08:00',
            durationMinutes: 30,
            isOpen: false,
            endTime: null,
            endDate: null,
            endDateTime: null,
            notes: null,
          },
        ],
      },
    ])

    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(newClient()) },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.byDate['2026-09-16']?.followUps).toHaveLength(1)
    expect(result.current.byDate['2026-09-17']?.followUps).toEqual([])
  })
})

/**
 * **Lo que cuesta traer esto a Hoy** (FEAT-007, tajada 3, criterio 103).
 *
 * Hoy es la pantalla que más se abre del módulo, así que aquí se mide lo que la
 * ventana le añade: lo que la propia pantalla ya trajo (su día y los siete de
 * la tira) son aciertos de caché, y **volver a Hoy dentro de la sesión no pide
 * ni un plan más**, porque un día cerrado ya no caduca solo.
 */
describe('useVidaHistoryWindow — el coste de traerla a Hoy (criterio 103)', () => {
  it('el día visto y la tira ya están: la ventana solo pide lo que falta', async () => {
    const client = newClient()
    // Lo que Hoy trae por su cuenta antes de que la ventana se monte: el día
    // visto (`useActivityDayPlanQuery`) y la tira (`useVidaWeekPlans`, siete
    // días desde dos antes). De la tira, solo tres caen dentro de la ventana:
    // los cuatro de delante son futuro.
    for (const ymd of ['2026-09-18', '2026-09-19', SUNDAY]) {
      client.setQueryData(vidaKeys.dayPlan.byDate(ymd), [block(ymd)])
    }

    const { result } = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    // 42 − 3 = 39 planes nuevos, más **una** de sesiones.
    expect(getActivityDayPlan).toHaveBeenCalledTimes(39)
    expect(getActivityFollowUpsInDates).toHaveBeenCalledTimes(1)
  })

  it('volver a Hoy media hora después de irse: cero planes nuevos', async () => {
    const client = newClient()
    const first = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(first.result.current.isPending).toBe(false))
    expect(getActivityDayPlan).toHaveBeenCalledTimes(42)
    first.unmount()

    // Un día cerrado no caduca solo: lo único que lo caduca es una escritura,
    // y todas pasan por `invalidateDayPlanQueries`. Aquí se comprueba que ni
    // siquiera el paso del tiempo lo hace.
    const realNow = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(realNow + 1000 * 60 * 10)
    const second = renderHook(
      () => useVidaHistoryWindow({ enabled: true, today: SUNDAY }),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(second.result.current.isPending).toBe(false))
    // **Los 41 días cerrados salen gratis**: la única que se vuelve a pedir es
    // la de hoy, que sí cambia y sigue con sus treinta segundos de reposo.
    expect(getActivityDayPlan).toHaveBeenCalledTimes(43)
    expect(getActivityDayPlan).toHaveBeenLastCalledWith(SUNDAY)
    clock.mockRestore()
  })
})
