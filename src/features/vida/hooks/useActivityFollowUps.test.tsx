import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import {
  useActivityDayFollowUpsQuery,
  useCreateActivityFollowUpMutation,
  useDeleteActivityFollowUpMutation,
  useStartActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/vida/hooks/useActivityFollowUps'
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

/** Sábado 2026-09-19 a mediodía local: semana 2026-09-14 … 2026-09-20. */
function freezeSaturday() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 8, 19, 12, 0, 0))
}

const closedFollowUp = {
  id: 'f1',
  activityId: '7',
  date: '2026-09-18',
  startTime: '09:30:00',
  durationMinutes: 90,
  isOpen: false,
  endTime: '11:00:00',
  endDate: '2026-09-18',
  endDateTime: '2026-09-18T11:00:00',
  notes: 'Trabajo profundo',
  sessionSubtasksCount: { total: 2, completed: 1 },
}

const openFollowUp = { ...closedFollowUp, id: 'f2', isOpen: true, durationMinutes: null }

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

/** La única invalidación del módulo: día, semana, abierto, detalle y lista. */
function expectedInvalidations(date: string, activityId?: string) {
  return [
    vidaKeys.followUps.day(date),
    vidaKeys.followUps.range('2026-09-14', '2026-09-20'),
    vidaKeys.followUps.open(),
    ...(activityId ? [vidaKeys.activities.detail(activityId)] : []),
    vidaKeys.activities.all(),
  ]
}

describe('follow-ups de actividad', () => {
  it('el día de hoy consulta; un día futuro no', async () => {
    freezeSaturday()
    vi.mocked(followUpsApi.getActivityDayFollowUps).mockResolvedValue([closedFollowUp])

    const hoy = renderHook(() => useActivityDayFollowUpsQuery('2026-09-19'), { wrapper })
    await waitFor(() => expect(hoy.result.current.isSuccess).toBe(true))
    expect(followUpsApi.getActivityDayFollowUps).toHaveBeenCalledWith('2026-09-19')

    const manana = renderHook(() => useActivityDayFollowUpsQuery('2026-09-20'), { wrapper })
    expect(manana.result.current.fetchStatus).toBe('idle')
    expect(followUpsApi.getActivityDayFollowUps).toHaveBeenCalledTimes(1)
  })

  it('registrar tiempo llama al API e invalida día, semana, abierto y actividad', async () => {
    freezeSaturday()
    vi.mocked(followUpsApi.createActivityFollowUp).mockResolvedValue(closedFollowUp)
    const { result } = renderHook(() => useCreateActivityFollowUpMutation(), { wrapper })

    const input = {
      activityId: '7',
      date: '2026-09-18',
      startTime: '09:30',
      durationMinutes: 90,
      notes: 'Trabajo profundo',
    }
    result.current.mutate(input)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(followUpsApi.createActivityFollowUp).toHaveBeenCalledWith(input)
    expect(invalidated).toEqual(expectedInvalidations('2026-09-18', '7'))
  })

  it('iniciar deja el follow-up abierto en caché', async () => {
    freezeSaturday()
    vi.mocked(followUpsApi.startActivityFollowUp).mockResolvedValue(openFollowUp)
    const { result } = renderHook(() => useStartActivityFollowUpMutation(), { wrapper })

    result.current.mutate({ activityId: '7', date: '2026-09-18', startTime: '09:30' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).toEqual(openFollowUp)
    expect(invalidated).toEqual(expectedInvalidations('2026-09-18', '7'))
  })

  it('cerrar un follow-up limpia el abierto de la caché', async () => {
    freezeSaturday()
    queryClient.setQueryData(vidaKeys.followUps.open(), openFollowUp)
    vi.mocked(followUpsApi.updateActivityFollowUp).mockResolvedValue(closedFollowUp)
    const { result } = renderHook(() => useUpdateActivityFollowUpMutation(), { wrapper })

    result.current.mutate({ id: 'f2', durationMinutes: 90 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).toBeNull()
  })

  it('borrar el follow-up abierto lo quita de la caché', async () => {
    freezeSaturday()
    queryClient.setQueryData(vidaKeys.followUps.open(), openFollowUp)
    vi.mocked(followUpsApi.deleteActivityFollowUp).mockResolvedValue(true)
    const { result } = renderHook(() => useDeleteActivityFollowUpMutation(), { wrapper })

    result.current.mutate({ id: 'f2', date: '2026-09-18', activityId: '7', wasOpen: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(followUpsApi.deleteActivityFollowUp).toHaveBeenCalledWith('f2')
    expect(queryClient.getQueryData(vidaKeys.followUps.open())).toBeNull()
    expect(invalidated).toEqual(expectedInvalidations('2026-09-18', '7'))
  })

  it('una fecha con hora se recorta al día al invalidar', async () => {
    freezeSaturday()
    vi.mocked(followUpsApi.createActivityFollowUp).mockResolvedValue(closedFollowUp)
    const { result } = renderHook(() => useCreateActivityFollowUpMutation(), { wrapper })

    result.current.mutate({
      activityId: '7',
      date: '2026-09-18T09:30:00',
      startTime: '09:30',
      durationMinutes: 90,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual(expectedInvalidations('2026-09-18', '7'))
  })
})
