import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authApi from '@/features/auth/api/auth.api'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getValidAccessToken } from '@/features/auth/services/token.service'
import { clearPendingEmail } from '@/features/auth/utils/pending-email'
import type { VerifyAccountRequest, VerifyEmailRequest } from '@/features/auth/types/auth.types'

export type VerifyEmailInput =
  | { mode: 'guest'; data: VerifyEmailRequest }
  | { mode: 'authenticated'; data: VerifyAccountRequest }

export function useVerifyEmailMutation() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)

  return useMutation({
    mutationFn: async (input: VerifyEmailInput) => {
      if (input.mode === 'guest') {
        return authApi.verifyEmail(input.data)
      }
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error('Sesión no válida')
      }
      return authApi.verifyAccount(input.data, token)
    },
    onSuccess: (_data, variables) => {
      if (variables.mode === 'authenticated') {
        const user = useAuthStore.getState().user
        if (user) {
          updateUser({ ...user, isAccountVerified: true })
        }
        clearPendingEmail()
        navigate(authPaths.today, { replace: true })
        return
      }
      clearPendingEmail()
      navigate(authPaths.login, { replace: true })
    },
  })
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: async () => {
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error('Sesión no válida')
      }
      return authApi.resendOtp(token)
    },
  })
}
