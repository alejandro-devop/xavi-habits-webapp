import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
import { useCopyTemplateDay } from '@/features/vida/hooks/useCopyTemplateDay'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'

/**
 * Criterios 50, 52 y 53: copiar **añade días al ítem que ya existe**, no pisa
 * nada, no borra nada, y un fallo a mitad deja copiado lo que sí salió y lo
 * dice por su nombre.
 */

vi.mock('@/features/vida/api/vida-items.api')

const toastSuccess = vi.fn()
const toastError = vi.fn()
const toastInfo = vi.fn()

vi.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
    warning: vi.fn(),
    dismiss: vi.fn(),
    show: vi.fn(),
  }),
}))

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function item(
  id: string,
  {
    days = ['monday'] as VidaDayOfWeek[],
    startTime = '07:00' as string | null,
    title = 'Bañarme',
    isActive = true,
    activityId = `a-${id}`,
  } = {},
): VidaItem {
  return {
    id,
    userId: 1,
    activityId,
    days,
    startTime,
    durationMinutes: 15,
    notes: null,
    isActive,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: activityId, title, status: 'pending', category: null },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe('useCopyTemplateDay', () => {
  it('manda **un `vidaItemUpdate` por ítem** con los días sumados, y ni un create', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem).mockImplementation(async (input) =>
      item(input.id, { days: input.days }),
    )
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        items: [item('1', { days: ['monday'] }), item('2', { days: ['monday'] })],
        fromDay: 'monday',
        toDays: ['tuesday', 'wednesday'],
      })
    })

    expect(vidaItemsApi.updateVidaItem).toHaveBeenCalledTimes(2)
    expect(vidaItemsApi.updateVidaItem).toHaveBeenNthCalledWith(1, {
      id: '1',
      days: ['monday', 'tuesday', 'wednesday'],
    })
    expect(vidaItemsApi.createVidaItem).not.toHaveBeenCalled()
    expect(vidaItemsApi.deleteVidaItem).not.toHaveBeenCalled()
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    expect(toastSuccess.mock.calls[0]![0]).toBe('Copiamos 2 cosas de tu lunes a 2 días')
  })

  it('**invalida la plantilla una sola vez** y solo si algo cambió (criterio 53)', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem).mockResolvedValue(item('1'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        items: [item('1', { days: ['monday'] })],
        fromDay: 'monday',
        toDays: ['tuesday'],
      })
    })

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
    expect(invalidate.mock.calls[0]![0]).toEqual({ queryKey: ['vida', 'items'] })
  })

  it('**no pisa** lo que ya hay: ni llama al API por ese ítem, y el resumen lo trae', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem).mockResolvedValue(item('1'))
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | null = null
    await act(async () => {
      outcome = await result.current.mutateAsync({
        items: [
          item('1', { days: ['monday'], activityId: 'pasear', title: 'Pasear a las mascotas' }),
          item('2', {
            days: ['saturday'],
            startTime: '19:00',
            activityId: 'pasear',
            title: 'Pasear a las mascotas',
          }),
        ],
        fromDay: 'monday',
        toDays: ['saturday'],
      })
    })

    expect(vidaItemsApi.updateVidaItem).not.toHaveBeenCalled()
    expect(outcome!.skipped).toEqual([
      { title: 'Pasear a las mascotas', day: 'saturday', reason: 'other-item' },
    ])
    await waitFor(() => expect(toastInfo).toHaveBeenCalled())
    expect(toastError).not.toHaveBeenCalled()
  })

  it('un fallo a mitad **deja copiado lo que sí salió** y nombra lo que no (criterio 52)', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem)
      .mockResolvedValueOnce(item('1'))
      .mockRejectedValueOnce(new Error('El servidor dijo que no'))
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | null = null
    await act(async () => {
      outcome = await result.current.mutateAsync({
        items: [
          item('1', { days: ['monday'], title: 'Bañarme' }),
          item('2', { days: ['monday'], title: 'Leer' }),
        ],
        fromDay: 'monday',
        toDays: ['tuesday'],
      })
    })

    expect(outcome!.done).toEqual([{ title: 'Bañarme', addedDays: ['tuesday'] }])
    expect(outcome!.failed).toEqual([{ title: 'Leer', reason: 'El servidor dijo que no' }])
    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(toastError.mock.calls[0]![0]).toBe('Copiamos 1 cosa a 1 día; Leer se quedó sin copiar.')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('si **todo** falla no se dice que se copió nada', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem).mockRejectedValue(new Error('nada'))
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        items: [item('1', { days: ['monday'], title: 'Bañarme' })],
        fromDay: 'monday',
        toDays: ['tuesday'],
      })
    })

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(toastError.mock.calls[0]![0]).toBe(
      'No pudimos copiar tu lunes (Bañarme). Tu plantilla se quedó como estaba.',
    )
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('**los desactivados no se copian** (criterio 52)', async () => {
    vi.mocked(vidaItemsApi.updateVidaItem).mockResolvedValue(item('2'))
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        items: [
          item('1', { days: ['monday'], isActive: false, title: 'Salir a correr' }),
          item('2', { days: ['monday'], title: 'Bañarme' }),
        ],
        fromDay: 'monday',
        toDays: ['tuesday'],
      })
    })

    expect(vidaItemsApi.updateVidaItem).toHaveBeenCalledTimes(1)
    expect(vidaItemsApi.updateVidaItem).toHaveBeenCalledWith({
      id: '2',
      days: ['monday', 'tuesday'],
    })
  })

  it('un día de partida vacío **no llama a nadie** y lo dice sin reproche', async () => {
    const { result } = renderHook(() => useCopyTemplateDay(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        items: [item('1', { days: ['sunday'] })],
        fromDay: 'monday',
        toDays: ['tuesday'],
      })
    })

    expect(vidaItemsApi.updateVidaItem).not.toHaveBeenCalled()
    await waitFor(() => expect(toastInfo).toHaveBeenCalled())
    expect(toastInfo.mock.calls[0]![0]).toBe('Tu lunes no tiene nada que copiar todavía.')
  })
})
