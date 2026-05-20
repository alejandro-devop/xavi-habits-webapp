import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authApi from '@/features/auth/api/auth.api'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { setPendingEmail } from '@/features/auth/utils/pending-email'

export function useLoginMutation() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        accessExpiresAt: data.accessExpiresAt,
        refreshToken: data.refreshToken,
        user: data.user,
      })

      if (!data.user.isAccountVerified) {
        setPendingEmail(data.user.email)
        navigate(authPaths.verifyEmail, {
          replace: true,
          state: { email: data.user.email, nextResendAvailableAt: data.nextResendAvailableAt },
        })
        return
      }

      navigate(authPaths.today, { replace: true })
    },
  })
}
