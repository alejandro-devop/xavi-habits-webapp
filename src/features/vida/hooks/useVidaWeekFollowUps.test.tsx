import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaWeekFollowUps } from '@/features/vida/hooks/useVidaWeekFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * **Las sesiones de la semana** (FEAT-006, tajada 4, criterios 52 y 53).
 *
 * Lo que importa aquí no es la forma del objeto: es **la clave**. Si estas
 * siete consultas no fueran `vidaKeys.followUps.day(date)`, abrir la semana
 * volvería a pedir el día que se está revisando y escribir en él no refrescaría
 * su fila — las dos razones por las que el plan descartó el rango.
 */

let guard = true
vi.mock('@/features/vida/hooks/useVidaQueryGuard', () => ({
  useVidaQueryGuard: () => guard,
}))

const getActivityDayFollowUps = vi.fn<(date: string) => Promise<ActivityFollowUp[]>>()
vi.mock('@/features/vida/api/activity-followups.api', () => ({
  getActivityDayFollowUps: (date: string) => getActivityDayFollowUps(date),
}))

/** Un día pasado de sobra y uno que no llega nunca: el reloj real vale. */
const PAST = '2020-01-06'
const OTHER_PAST = '2020-01-07'
const FUTURE = '2999-01-01'

function session(id: string, date: string): ActivityFollowUp {
  return {
    id,
    activityId: `a-${id}`,
    date,
    startTime: '08:00',
    durationMinutes: 30,
    isOpen: false,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
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
  getActivityDayFollowUps.mockReset()
  getActivityDayFollowUps.mockImplementation(async (date: string) =>
    date === PAST ? [session('s1', date), session('s2', date)] : [],
  )
})

describe('useVidaWeekFollowUps', () => {
  it('trae las sesiones de cada día, por fecha', async () => {
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekFollowUps([PAST, OTHER_PAST]), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.byDate[PAST]!.followUps).toHaveLength(2)
    expect(result.current.byDate[OTHER_PAST]!.followUps).toHaveLength(0)
    expect(result.current.hasError).toBe(false)
  })

  it('escribe en la **misma** clave que el día: `vidaKeys.followUps.day`', async () => {
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekFollowUps([PAST]), { wrapper: wrapper(client) })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(client.getQueryData(vidaKeys.followUps.day(PAST))).toHaveLength(2)
  })

  it('el día que la revisión ya pidió es **un acierto de caché** (criterio 53)', async () => {
    const client = newClient()
    client.setQueryData(vidaKeys.followUps.day(PAST), [session('ya', PAST)])

    const { result } = renderHook(() => useVidaWeekFollowUps([PAST]), { wrapper: wrapper(client) })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.byDate[PAST]!.followUps).toHaveLength(1)
    expect(getActivityDayFollowUps).not.toHaveBeenCalled()
  })

  it('un día **futuro no pide nada** y no se queda girando', async () => {
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekFollowUps([FUTURE]), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.byDate[FUTURE]).toBeDefined())
    expect(getActivityDayFollowUps).not.toHaveBeenCalled()
    expect(result.current.byDate[FUTURE]!.isPending).toBe(false)
    expect(result.current.isPending).toBe(false)
  })

  it('sin sesión de usuario no se pide nada y las filas no giran', async () => {
    guard = false
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekFollowUps([PAST]), { wrapper: wrapper(client) })

    await waitFor(() => expect(result.current.byDate[PAST]).toBeDefined())
    expect(getActivityDayFollowUps).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
  })

  it('**el fallo es por día**: el que cae lo dice y el otro sigue entero (52)', async () => {
    getActivityDayFollowUps.mockImplementation(async (date: string) => {
      if (date === OTHER_PAST) throw new Error('sin red')
      return [session('s1', date)]
    })
    const client = newClient()
    const { result } = renderHook(() => useVidaWeekFollowUps([PAST, OTHER_PAST]), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.hasError).toBe(true))
    expect(result.current.byDate[OTHER_PAST]!.isError).toBe(true)
    expect(result.current.byDate[OTHER_PAST]!.followUps).toEqual([])
    expect(result.current.byDate[PAST]!.isError).toBe(false)
    expect(result.current.byDate[PAST]!.followUps).toHaveLength(1)
  })
})
