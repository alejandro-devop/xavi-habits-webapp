import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
import {
  useCreateVidaItemMutation,
  useDeleteVidaItemMutation,
  useMarkTakenTodayMutation,
  useUnmarkTakenTodayMutation,
  useUpdateVidaItemMutation,
  useVidaItemsQuery,
  useVidaSuggestionsForDateQuery,
  useVidaTakenTodayQuery,
} from '@/features/vida/hooks/useVidaItems'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { vidaKeys } from '@/shared/api/query-keys'

vi.mock('@/features/vida/api/vida-items.api')
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

const vidaItem = {
  id: 'v1',
  userId: 1,
  activityId: '7',
  days: ['monday', 'wednesday'] as VidaDayOfWeek[],
  notes: null,
  isActive: true,
  orderIndex: 0,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-01T08:00:00.000Z',
  activity: { id: '7', title: 'Leer', description: null, category: null },
}

const takenToday = {
  id: 't1',
  userId: 1,
  vidaItemId: 'v1',
  date: '2026-09-19',
  createdAt: '2026-09-19T12:00:00.000Z',
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

describe('plantilla Vida', () => {
  it('la lista pide solo los activos salvo que se pidan todos', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.getVidaItems).mockResolvedValue([{ ...vidaItem, days: ['monday'] }])

    const activos = renderHook(() => useVidaItemsQuery(), { wrapper })
    await waitFor(() => expect(activos.result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.getVidaItems).toHaveBeenCalledWith(false)

    const todos = renderHook(() => useVidaItemsQuery(true), { wrapper })
    await waitFor(() => expect(todos.result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.getVidaItems).toHaveBeenCalledWith(true)
  })

  it('sugerencias y tomados consultan por fecha, y sin fecha no consultan', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.getVidaSuggestionsForDate).mockResolvedValue([
      { item: { ...vidaItem, days: ['saturday'] }, takenToday: false },
    ])
    vi.mocked(vidaItemsApi.getVidaTakenToday).mockResolvedValue([takenToday])

    const sugerencias = renderHook(() => useVidaSuggestionsForDateQuery('2026-09-19'), { wrapper })
    await waitFor(() => expect(sugerencias.result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.getVidaSuggestionsForDate).toHaveBeenCalledWith('2026-09-19')

    const tomados = renderHook(() => useVidaTakenTodayQuery('2026-09-19'), { wrapper })
    await waitFor(() => expect(tomados.result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.getVidaTakenToday).toHaveBeenCalledWith('2026-09-19')

    const sinFecha = renderHook(() => useVidaSuggestionsForDateQuery(''), { wrapper })
    expect(sinFecha.result.current.fetchStatus).toBe('idle')
    expect(vidaItemsApi.getVidaSuggestionsForDate).toHaveBeenCalledTimes(1)
  })

  it('crear un ítem invalida la plantilla entera', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.createVidaItem).mockResolvedValue(vidaItem)
    const { result } = renderHook(() => useCreateVidaItemMutation(), { wrapper })

    const input = { activityId: '7', days: ['monday', 'wednesday'] as VidaDayOfWeek[] }
    result.current.mutate(input)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.createVidaItem).toHaveBeenCalledWith(input)
    expect(invalidated).toEqual([vidaKeys.items.all()])
  })

  it('editar y borrar invalidan lo mismo que crear', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.updateVidaItem).mockResolvedValue(vidaItem)
    vi.mocked(vidaItemsApi.deleteVidaItem).mockResolvedValue(true)

    const editar = renderHook(() => useUpdateVidaItemMutation(), { wrapper })
    editar.result.current.mutate({ id: 'v1', notes: 'sin prisa' })
    await waitFor(() => expect(editar.result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual([vidaKeys.items.all()])

    invalidated = []
    const borrar = renderHook(() => useDeleteVidaItemMutation(), { wrapper })
    borrar.result.current.mutate({ id: 'v1' })
    await waitFor(() => expect(borrar.result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.deleteVidaItem).toHaveBeenCalledWith({ id: 'v1' })
    expect(invalidated).toEqual([vidaKeys.items.all()])
  })

  it('invalidar la plantilla arrastra las sugerencias de cualquier fecha (prefijo)', () => {
    // La regla del criterio 8 no depende de que el hook enumere fechas: las
    // claves de sugerencias y de tomados cuelgan de `items.all()`.
    const raiz = vidaKeys.items.all()
    for (const key of [
      vidaKeys.items.list(),
      vidaKeys.items.list(true),
      vidaKeys.items.suggestions('2026-09-19'),
      vidaKeys.items.suggestions('2027-01-01'),
      vidaKeys.items.takenToday('2026-09-19'),
    ]) {
      expect(key.slice(0, raiz.length)).toEqual([...raiz])
    }
  })

  it('marcar tomado hoy invalida lo tomado y las sugerencias de esa fecha', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.markVidaItemTakenToday).mockResolvedValue(takenToday)
    const { result } = renderHook(() => useMarkTakenTodayMutation(), { wrapper })

    result.current.mutate({ vidaItemId: 'v1', date: '2026-09-19' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(vidaItemsApi.markVidaItemTakenToday).toHaveBeenCalledWith({
      vidaItemId: 'v1',
      date: '2026-09-19',
    })
    expect(invalidated).toEqual([
      vidaKeys.items.takenToday('2026-09-19'),
      vidaKeys.items.suggestions('2026-09-19'),
    ])
  })

  it('desmarcar invalida exactamente lo mismo que marcar', async () => {
    freezeSaturday()
    vi.mocked(vidaItemsApi.unmarkVidaItemTakenToday).mockResolvedValue(true)
    const { result } = renderHook(() => useUnmarkTakenTodayMutation(), { wrapper })

    result.current.mutate({ vidaItemId: 'v1', date: '2026-09-19T12:00:00' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidated).toEqual([
      vidaKeys.items.takenToday('2026-09-19'),
      vidaKeys.items.suggestions('2026-09-19'),
    ])
  })
})
