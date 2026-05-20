import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authApi from '@/features/auth/api/auth.api'
import { authPaths } from '@/features/auth/router/auth-paths'

export function useResetPasswordMutation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      navigate(authPaths.login, {
        replace: true,
        state: { message: 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.' },
      })
    },
  })
}
