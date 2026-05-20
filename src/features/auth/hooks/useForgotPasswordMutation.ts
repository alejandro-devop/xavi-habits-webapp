import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/features/auth/api/auth.api'

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}
