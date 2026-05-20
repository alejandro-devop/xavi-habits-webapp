import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiNetworkError, ApiTimeoutError } from '@/shared/api/api-error'
import { restRequest } from '@/shared/api/rest-client'

const baseUrl = 'https://api.example.com'

describe('restRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns data on ApiSuccess', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          data: { id: 1 },
          meta: { env: 'test' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(
      restRequest<{ id: number }>({ baseUrl, path: '/items' }),
    ).resolves.toEqual({ id: 1 })
  })

  it('throws ApiClientError on ApiErrorResponse', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: false,
          errors: ['Invalid credentials'],
          env: 'test',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(
      restRequest({ baseUrl, path: '/login', method: 'POST', body: {} }),
    ).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Invalid credentials',
      isAuthError: true,
    })
  })

  it('throws ApiTimeoutError when request aborts', async () => {
    vi.useFakeTimers()

    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )

    const promise = restRequest({
      baseUrl,
      path: '/slow',
      timeoutMs: 50,
    })

    const assertion = expect(promise).rejects.toBeInstanceOf(ApiTimeoutError)
    await vi.advanceTimersByTimeAsync(60)
    await assertion

    vi.useRealTimers()
  })

  it('throws ApiNetworkError on fetch TypeError', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(restRequest({ baseUrl, path: '/offline' })).rejects.toBeInstanceOf(
      ApiNetworkError,
    )
  })
})
