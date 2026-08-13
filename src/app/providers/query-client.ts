import { QueryClient } from '@tanstack/react-query'
import { isRetryableQueryError } from '@/shared/api/api-error'

/** Reintentos automáticos por query antes de pedir intervención manual. */
export const MAX_QUERY_RETRIES = 2

/**
 * Backoff exponencial: 1 s, 2 s, 4 s… con techo de 30 s. Es la misma fórmula
 * que trae react-query por defecto, pero explícita y exportada para que la UI
 * pueda anunciar el momento exacto del próximo intento en vez de adivinarlo.
 */
export function getRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      retryDelay: getRetryDelay,
      retry: (failureCount, error) => {
        if (!isRetryableQueryError(error)) {
          return false
        }
        return failureCount < MAX_QUERY_RETRIES
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (!isRetryableQueryError(error)) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})
