import { useQuery } from '@tanstack/react-query'
import * as authApi from '@/features/auth/api/auth.api'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getValidAccessToken } from '@/features/auth/services/token.service'
import { authKeys } from '@/shared/api/query-keys'
import { AuthRequiredError } from '@/shared/api/api-error'

export function useProfileQuery() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: authKeys.profile(),
    enabled: isReady && isAuthenticated,
    queryFn: async () => {
      const token = await getValidAccessToken()
      if (!token) {
        throw new AuthRequiredError()
      }
      return authApi.getProfile(token)
    },
    staleTime: 1000 * 60 * 5,
  })
}
