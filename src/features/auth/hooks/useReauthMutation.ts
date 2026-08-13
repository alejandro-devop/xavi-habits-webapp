import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'

/**
 * Login para reingresar tras una caducidad, sin navegar. A diferencia de
 * useLoginMutation, la gracia aquí es que el usuario se queda exactamente
 * donde estaba: la pantalla sigue montada detrás del modal.
 *
 * No se trata el caso de cuenta sin verificar: al fijar la sesión, el
 * VerifyAccountGuard del router reacciona por su cuenta.
 */
export function useReauthMutation() {
  const queryClient = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const previousUserId = useAuthStore.getState().user?.id

      setSession({
        accessToken: data.accessToken,
        accessExpiresAt: data.accessExpiresAt,
        refreshToken: data.refreshToken,
        user: data.user,
      })

      if (previousUserId !== undefined && previousUserId !== data.user.id) {
        // Entró otra persona: lo que hay en caché (y persistido) es de la
        // sesión anterior y no debe quedar visible bajo la cuenta nueva.
        queryClient.clear()
        return
      }

      // Mismo usuario: lo cacheado sigue siendo suyo, sólo hay que refrescar
      // lo que quedó viejo mientras la sesión estuvo caída.
      void queryClient.invalidateQueries()
    },
  })
}
