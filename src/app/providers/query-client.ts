import { QueryClient } from '@tanstack/react-query'
import { isRetryableQueryError } from '@/shared/api/api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount, error) => {
        if (!isRetryableQueryError(error)) {
          return false
        }
        return failureCount < 2
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
