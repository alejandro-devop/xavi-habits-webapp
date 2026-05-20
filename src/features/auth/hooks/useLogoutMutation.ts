import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authApi from '@/features/auth/api/auth.api'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { clearPendingEmail } from '@/features/auth/utils/pending-email'
import { queryClient } from '@/app/providers/query-client'

export function useLogoutMutation() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        try {
          await authApi.logout({ refreshToken })
        } catch {
          // Limpiar sesión local aunque falle el backend
        }
      }
    },
    onSettled: () => {
      clearSession()
      clearPendingEmail()
      queryClient.clear()
      navigate(authPaths.login, { replace: true })
    },
  })
}
