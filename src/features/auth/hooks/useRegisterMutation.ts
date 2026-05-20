import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authApi from '@/features/auth/api/auth.api'
import { authPaths } from '@/features/auth/router/auth-paths'
import { setPendingEmail } from '@/features/auth/utils/pending-email'

export function useRegisterMutation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setPendingEmail(data.user.email)
      navigate(authPaths.verifyEmail, {
        replace: true,
        state: { email: data.user.email },
      })
    },
  })
}
