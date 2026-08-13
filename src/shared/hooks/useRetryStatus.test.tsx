import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getRetryDelay } from '@/app/providers/query-client'
import { useRetryStatus } from '@/shared/hooks/useRetryStatus'

function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('getRetryDelay', () => {
  it('crece exponencialmente con techo de 30 s', () => {
    expect(getRetryDelay(0)).toBe(1000)
    expect(getRetryDelay(1)).toBe(2000)
    expect(getRetryDelay(2)).toBe(4000)
    expect(getRetryDelay(20)).toBe(30_000)
  })
})

describe('useRetryStatus', () => {
  it('está idle mientras nada falla', () => {
    const client = new QueryClient()
    const { result } = renderHook(() => useRetryStatus(), { wrapper: wrapper(client) })
    expect(result.current.status.kind).toBe('idle')
  })

  it('anuncia el reintento en curso con el número de intento', async () => {
    // Ventana ancha y explícita: con el backoff real de 1 s el estado
    // `retrying` dura demasiado poco y el test se vuelve sensible a la carga.
    const RETRY_DELAY_MS = 10_000
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 2, retryDelay: () => RETRY_DELAY_MS } },
    })
    const Wrapper = wrapper(client)

    renderHook(
      () =>
        useQuery({
          queryKey: ['falla'],
          queryFn: () => {
            throw new Error('servidor dormido')
          },
        }),
      { wrapper: Wrapper },
    )

    const { result } = renderHook(() => useRetryStatus(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.status.kind).toBe('retrying'))

    const status = result.current.status
    if (status.kind !== 'retrying') throw new Error('se esperaba retrying')
    expect(status.attempt).toBeGreaterThanOrEqual(1)
    // La cuenta atrás debe salir del retryDelay de la query, no del default.
    expect(status.secondsLeft).toBeGreaterThan(1)
    expect(status.secondsLeft).toBeLessThanOrEqual(RETRY_DELAY_MS / 1000)
  })

  it('respeta el retryDelay propio de la query, no el global', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: () => 8_000 } },
    })
    const Wrapper = wrapper(client)

    renderHook(
      () =>
        useQuery({
          queryKey: ['lenta'],
          queryFn: () => {
            throw new Error('caído')
          },
        }),
      { wrapper: Wrapper },
    )

    const { result } = renderHook(() => useRetryStatus(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.status.kind).toBe('retrying'))

    const status = result.current.status
    if (status.kind !== 'retrying') throw new Error('se esperaba retrying')
    // Con el default global (1 s) esto habría dado 1; con el de la query, ~8.
    expect(status.secondsLeft).toBeGreaterThan(5)
  })

  it('pasa a failed cuando se agotan los reintentos', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: () => 0 } },
    })
    const Wrapper = wrapper(client)

    renderHook(
      () =>
        useQuery({
          queryKey: ['agotada'],
          queryFn: () => {
            throw new Error('servidor caído')
          },
        }),
      { wrapper: Wrapper },
    )

    const { result } = renderHook(() => useRetryStatus(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.status.kind).toBe('failed'))

    const status = result.current.status
    if (status.kind !== 'failed') throw new Error('se esperaba failed')
    expect(status.failedCount).toBe(1)
  })

  it('retryNow vuelve a lanzar sólo las queries en error', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = wrapper(client)

    const queryFn = vi.fn(() => {
      throw new Error('sigue caído')
    })

    renderHook(() => useQuery({ queryKey: ['agotada'], queryFn }), { wrapper: Wrapper })
    renderHook(() => useQuery({ queryKey: ['sana'], queryFn: () => 'ok' }), { wrapper: Wrapper })

    const { result } = renderHook(() => useRetryStatus(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.status.kind).toBe('failed'))

    const callsBefore = queryFn.mock.calls.length
    result.current.retryNow()

    await waitFor(() => expect(queryFn.mock.calls.length).toBeGreaterThan(callsBefore))
    // La query sana no debe reintentarse: sigue con sus datos intactos.
    expect(client.getQueryData(['sana'])).toBe('ok')
  })
})
