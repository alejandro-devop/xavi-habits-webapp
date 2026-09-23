import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaSessionActions } from '@/features/vida/hooks/useVidaSessionActions'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { vidaKeys } from '@/shared/api/query-keys'

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

const toastCalls: { kind: string; message: string; hasAction: boolean }[] = []
vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({
    success: (message: string) => toastCalls.push({ kind: 'success', message, hasAction: false }),
    error: (message: string) => toastCalls.push({ kind: 'error', message, hasAction: false }),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    show: (kind: string, input: { message: string; action?: unknown }) =>
      toastCalls.push({ kind, message: input.message, hasAction: Boolean(input.action) }),
  }),
}))

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function openFollowUp(overrides: Partial<ActivityFollowUp> = {}): ActivityFollowUp {
  return {
    id: 'f1',
    activityId: 'a-casa',
    date: '2026-09-18',
    startTime: '09:30',
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: 'a-casa', title: 'Organizar la casa' },
    ...overrides,
  }
}

/** Siembra la sesión abierta en la caché: es la que lee `useVidaOpenSession`. */
function seedOpen(session: ActivityFollowUp | null) {
  queryClient.setQueryData(vidaKeys.followUps.open(), session)
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Viernes 18 de septiembre de 2026 a las 10:08, la hora del criterio 15.
  vi.setSystemTime(new Date(2026, 8, 18, 10, 8, 0))
  toastCalls.length = 0
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.mocked(followUpsApi.getActivityOpenFollowUp).mockResolvedValue(null)
  vi.mocked(followUpsApi.startActivityFollowUp).mockResolvedValue(
    openFollowUp({ id: 'f2', activityId: 'a-leer', activity: { id: 'a-leer', title: 'Leer un rato' } }),
  )
  vi.mocked(followUpsApi.updateActivityFollowUp).mockResolvedValue(
    openFollowUp({ durationMinutes: 38, isOpen: false }),
  )
  vi.mocked(followUpsApi.deleteActivityFollowUp).mockResolvedValue(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useVidaSessionActions — empezar (criterios 2, 13, 15 y 17)', () => {
  it('sin nada en marcha, empieza y deja **un** mensaje', async () => {
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).toBeNull())

    await act(async () => {
      await result.current.start('a-leer')
    })

    expect(followUpsApi.updateActivityFollowUp).not.toHaveBeenCalled()
    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledWith({
      activityId: 'a-leer',
      date: '2026-09-18',
      // La hora es la del reloj, no la del bloque (criterio 17).
      startTime: '10:08',
    })
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.message).toBe('En marcha: Leer un rato')
  })

  it('criterio 15 — con otra en marcha, **cierra la anterior a esa hora y lo dice**', async () => {
    seedOpen(openFollowUp())
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.start('a-leer')
    })

    // 09:30 → 10:08 son 38 minutos, y se cierra **antes** de empezar la nueva.
    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledWith({
      id: 'f1',
      durationMinutes: 38,
    })
    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledTimes(1)
    // Un solo mensaje para un solo gesto, y nombra las dos cosas.
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.message).toBe(
      'Terminamos «Organizar la casa» a las 10:08. En marcha: Leer un rato',
    )
  })

  it('criterio 15 — si el cierre de la anterior falla, la nueva **no se empieza**', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let outcome: { ok: boolean; message?: string } | undefined
    await act(async () => {
      outcome = await result.current.start('a-leer')
    })

    expect(outcome?.ok).toBe(false)
    // Ni dos abiertas, ni la primera perdida.
    expect(followUpsApi.startActivityFollowUp).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).not.toBeNull()
    expect(toastCalls.some((call) => call.kind === 'error')).toBe(true)
  })

  it('criterios 331 y 331b — «empecé a las 8:07 y sigo»: **una** llamada y una sesión abierta', async () => {
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).toBeNull())

    await act(async () => {
      await result.current.start('a-leer', '08:07')
    })

    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledTimes(1)
    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledWith({
      activityId: 'a-leer',
      date: '2026-09-18',
      startTime: '08:07',
    })
    // Ni un `activityFollowUpAdd`: el trozo pasado **no** se registra aparte.
    expect(followUpsApi.createActivityFollowUp).not.toHaveBeenCalled()
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.message).toBe('En marcha: Leer un rato · contamos desde las 8:07')
  })

  it('criterio 339 (D1) — con otra en marcha, la anterior se cierra **a la hora de lo nuevo**', async () => {
    seedOpen(openFollowUp())
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.start('a-leer', '10:00')
    })

    // 09:30 → 10:00 son 30 minutos: las dos **no se pisan**.
    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledWith({
      id: 'f1',
      durationMinutes: 30,
    })
    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledTimes(1)
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.message).toBe(
      'Terminamos «Organizar la casa» a las 10:00. En marcha: Leer un rato · contamos desde las 10:00',
    )
  })

  it('criterio 339 — una hora anterior a lo que ya corre **no empieza nada**, y no se pierde la primera', async () => {
    seedOpen(openFollowUp())
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let outcome: { ok: boolean; message?: string } | undefined
    await act(async () => {
      outcome = await result.current.start('a-leer', '08:07')
    })

    expect(outcome?.ok).toBe(false)
    // Ni duración negativa, ni sesión nueva, ni la primera tocada.
    expect(followUpsApi.updateActivityFollowUp).not.toHaveBeenCalled()
    expect(followUpsApi.startActivityFollowUp).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).not.toBeNull()
    expect(outcome?.message).toBe(
      '«Organizar la casa» está en marcha desde las 9:30, después de las 8:07. Termina «Organizar la casa» y empieza de nuevo con la hora que quieras.',
    )
  })

  it('criterio 340 — dos toques seguidos con hora tampoco crean dos sesiones', async () => {
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).toBeNull())

    await act(async () => {
      await Promise.all([
        result.current.start('a-leer', '08:07'),
        result.current.start('a-leer', '08:07'),
      ])
    })

    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledTimes(1)
  })

  it('criterio 13 — dos toques seguidos no crean dos sesiones', async () => {
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).toBeNull())

    await act(async () => {
      await Promise.all([result.current.start('a-leer'), result.current.start('a-leer')])
    })

    expect(followUpsApi.startActivityFollowUp).toHaveBeenCalledTimes(1)
  })

  it('criterio 16 — con una sesión de otro día sin responder no se empieza nada', async () => {
    seedOpen(openFollowUp({ date: '2026-09-17', startTime: '21:00' }))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.isFromAnotherDay).toBe(true))

    let outcome: { ok: boolean } | undefined
    await act(async () => {
      outcome = await result.current.start('a-leer')
    })

    expect(outcome?.ok).toBe(false)
    expect(followUpsApi.startActivityFollowUp).not.toHaveBeenCalled()
    expect(followUpsApi.updateActivityFollowUp).not.toHaveBeenCalled()
  })

  it('el mensaje del API en inglés **no llega a pantalla**', async () => {
    vi.mocked(followUpsApi.startActivityFollowUp).mockRejectedValue(
      new Error(
        'You already have an activity in progress. Finish or cancel it before starting another.',
      ),
    )
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).toBeNull())

    await act(async () => {
      await result.current.start('a-leer')
    })

    const error = toastCalls.find((call) => call.kind === 'error')
    expect(error?.message).toBe('Ya tenías algo en marcha. Termínalo y vuelve a empezar.')
    expect(error?.message).not.toMatch(/cancel/i)
  })
})

describe('useVidaSessionActions — terminar (criterios 5, 6 y 12)', () => {
  it('criterio 5 — «Terminar» cierra con los minutos del cronómetro, sin preguntar', async () => {
    seedOpen(openFollowUp())
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.finishNow()
    })

    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledWith({
      id: 'f1',
      durationMinutes: 38,
    })
  })

  it('criterio 5 — el toast que confirma trae «añadir una nota»', async () => {
    seedOpen(openFollowUp())
    const onAddNote = vi.fn()
    const { result } = renderHook(() => useVidaSessionActions({ onAddNote }), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.finishNow()
    })

    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.hasAction).toBe(true)
  })

  it('criterio 12 — si el cierre falla, la sesión **sigue abierta** y se dice', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let outcome: { ok: boolean; message?: string } | undefined
    await act(async () => {
      outcome = await result.current.finishNow()
    })

    expect(outcome?.ok).toBe(false)
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).not.toBeNull()
  })

  it('criterio 12 — `finishWith` **resuelve** el fallo en vez de lanzarlo: la hoja decide', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let outcome: { ok: boolean; message?: string } | undefined
    await act(async () => {
      outcome = await result.current.finishWith({ id: 'f1', durationMinutes: 45, notes: 'hola' })
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.message).toBeTruthy()
  })

  it('criterio 6 — `finishWith` manda duración y notas, con el mínimo de un minuto', async () => {
    seedOpen(openFollowUp())
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.finishWith({ id: 'f1', durationMinutes: 0, notes: '  ' })
    })

    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledWith({
      id: 'f1',
      durationMinutes: 1,
      notes: '  ',
    })
  })
})

describe('useVidaSessionActions — la de otro día (criterio 16)', () => {
  it('«No sé» cierra con los minutos que se le den y **lo dice**', async () => {
    seedOpen(openFollowUp({ date: '2026-09-17', startTime: '21:00' }))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.isFromAnotherDay).toBe(true))

    await act(async () => {
      await result.current.resolveStale({ minutes: 45, reason: 'planned' })
    })

    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledWith({
      id: 'f1',
      durationMinutes: 45,
    })
    expect(toastCalls[0]?.message).toContain('45 min')
    expect(toastCalls[0]?.message).toContain('lo que tenías planeado')
    expect(toastCalls[0]?.message).not.toMatch(/cancel/i)
  })
})

describe('useVidaSessionActions — corregir la hora de lo que está en marcha (FEAT-013, tajada 2)', () => {
  it('criterio 343 — manda **solo `{ id, startTime }`**: sin duración, la sesión sigue abierta', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockResolvedValue(
      openFollowUp({ startTime: '08:07' }),
    )
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.correctStart('08:07')
    })

    expect(followUpsApi.updateActivityFollowUp).toHaveBeenCalledTimes(1)
    const input = vi.mocked(followUpsApi.updateActivityFollowUp).mock.calls[0]![0]
    expect(input).toEqual({ id: 'f1', startTime: '08:07' })
    expect(Object.keys(input)).not.toContain('durationMinutes')
    expect(Object.keys(input)).not.toContain('notes')
    // Ni se empieza nada nuevo ni se registra un rato aparte.
    expect(followUpsApi.startActivityFollowUp).not.toHaveBeenCalled()
    expect(followUpsApi.createActivityFollowUp).not.toHaveBeenCalled()
  })

  it('criterio 344 — la sesión abierta de la caché **recuenta desde la hora nueva** y no pierde su actividad', async () => {
    seedOpen(openFollowUp())
    // El API **no devuelve `activity`** en `activityFollowUpEdit`: si la caché
    // se sustituyera por la respuesta, la barra se quedaría sin nombre.
    vi.mocked(followUpsApi.updateActivityFollowUp).mockResolvedValue(
      openFollowUp({ startTime: '08:07', activity: undefined }),
    )
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())
    // La consulta que vuelve **se queda en vuelo** a propósito: así lo que se
    // mide es el parche de la caché —lo que hace que el cronómetro recuente en
    // el acto— y no lo que traiga después el servidor.
    vi.mocked(followUpsApi.getActivityOpenFollowUp).mockReturnValue(new Promise(() => {}))

    await act(async () => {
      await result.current.correctStart('08:07')
    })

    const cached = queryClient.getQueryData<ActivityFollowUp>(vidaKeys.followUps.open())
    expect(cached?.startTime).toBe('08:07')
    expect(cached?.durationMinutes).toBeNull()
    expect(cached?.activity?.title).toBe('Organizar la casa')
  })

  it('criterio 347 — **dice lo que pasó**, y un solo mensaje', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockResolvedValue(
      openFollowUp({ startTime: '08:07' }),
    )
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    await act(async () => {
      await result.current.correctStart('08:07')
    })

    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]?.message).toBe('Contamos desde las 8:07')
    expect(toastCalls[0]?.message).not.toMatch(/olvid|tarde|deberías|error|mal\b/i)
  })

  it('criterio 348 — si falla, **no se afirma nada** y se puede reintentar', async () => {
    seedOpen(openFollowUp())
    vi.mocked(followUpsApi.updateActivityFollowUp).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useVidaSessionActions(), { wrapper })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let outcome: { ok: boolean; message?: string } | undefined
    await act(async () => {
      outcome = await result.current.correctStart('08:07')
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.message).toContain('Sigue en marcha')
    // La sesión de la caché conserva su hora de antes.
    expect(queryClient.getQueryData<ActivityFollowUp>(vidaKeys.followUps.open())?.startTime).toBe(
      '09:30',
    )
  })
})
