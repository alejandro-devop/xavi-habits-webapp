import { QueryClient, QueryClientProvider, onlineManager, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { useConnectionStatus } from '@/shared/hooks/useConnectionStatus'

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => {
  onlineManager.setOnline(true)
})

describe('useConnectionStatus', () => {
  it('reporta ok cuando no hay queries', () => {
    const client = makeClient()
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: wrapper(client) })
    expect(result.current).toBe('ok')
  })

  it('reporta offline cuando el navegador pierde la red', async () => {
    const client = makeClient()
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: wrapper(client) })

    onlineManager.setOnline(false)
    await waitFor(() => expect(result.current).toBe('offline'))
  })

  it('reporta ok mientras las queries responden bien', async () => {
    const client = makeClient()
    const Wrapper = wrapper(client)

    renderHook(() => useQuery({ queryKey: ['k'], queryFn: () => 'dato' }), { wrapper: Wrapper })
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper })

    await waitFor(() => expect(client.getQueryData(['k'])).toBe('dato'))
    expect(result.current).toBe('ok')
  })

  it('reporta stale cuando un refetch falla pero quedan datos en caché', async () => {
    const client = makeClient()
    const Wrapper = wrapper(client)

    let shouldFail = false
    const query = renderHook(
      () =>
        useQuery({
          queryKey: ['k'],
          queryFn: () => {
            if (shouldFail) throw new Error('backend dormido')
            return 'dato'
          },
        }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(query.result.current.data).toBe('dato'))

    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper })
    expect(result.current).toBe('ok')

    shouldFail = true
    await client.refetchQueries({ queryKey: ['k'] })

    // El supuesto que sostiene el hook: tras un refetch fallido react-query
    // conserva `data` y setea `error`. Si esto cambiara, el indicador dejaría
    // de distinguir "caché vieja" de "error sin datos".
    const state = client.getQueryCache().find({ queryKey: ['k'] })?.state
    expect(state?.data).toBe('dato')
    expect(state?.error).toBeInstanceOf(Error)

    await waitFor(() => expect(result.current).toBe('stale'))
  })

  it('no reporta stale si la query falló sin datos que mostrar', async () => {
    const client = makeClient()
    const Wrapper = wrapper(client)

    const query = renderHook(
      () =>
        useQuery({
          queryKey: ['vacia'],
          queryFn: () => {
            throw new Error('falla desde el principio')
          },
        }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(query.result.current.isError).toBe(true))

    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper })
    expect(result.current).toBe('ok')
  })
})
