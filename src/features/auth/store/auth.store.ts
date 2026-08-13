import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, AuthUser } from '@/features/auth/types/auth.types'
import { storage } from '@/shared/lib/storage'

export interface AuthState {
  accessToken: string | null
  accessExpiresAt: number | null
  refreshToken: string | null
  user: AuthUser | null
  /**
   * La sesión caducó estando el usuario dentro. Distinto de "no autenticado":
   * aquí no se le expulsa de la pantalla, se le ofrece volver a entrar sin
   * perder el contexto ni lo que ya está en pantalla.
   */
  sessionExpired: boolean

  setSession: (session: AuthSession) => void
  updateAccessToken: (payload: {
    accessToken: string
    accessExpiresAt: number
    refreshToken: string
  }) => void
  updateUser: (user: AuthUser) => void
  /** Cierre de sesión deliberado: borra todo, incluido el usuario. */
  clearSession: () => void
  /**
   * Caducidad involuntaria: descarta los tokens pero conserva el usuario para
   * poder saludarlo por su correo en el modal de reingreso.
   */
  expireSession: () => void
}

const initialSession = {
  accessToken: null,
  accessExpiresAt: null,
  refreshToken: null,
  user: null,
  sessionExpired: false,
} as const

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialSession,

      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          accessExpiresAt: session.accessExpiresAt,
          refreshToken: session.refreshToken,
          user: session.user,
          sessionExpired: false,
        }),

      updateAccessToken: ({ accessToken, accessExpiresAt, refreshToken }) =>
        set({ accessToken, accessExpiresAt, refreshToken, sessionExpired: false }),

      updateUser: (user) => set({ user }),

      clearSession: () => set({ ...initialSession }),

      expireSession: () =>
        set((state) => ({
          accessToken: null,
          accessExpiresAt: null,
          refreshToken: null,
          user: state.user,
          sessionExpired: true,
        })),
    }),
    {
      name: 'xavi-auth',
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      // `sessionExpired` no se persiste, y no hace falta: al recargar, el
      // AuthBootstrapProvider vuelve a intentar revalidar el refreshToken
      // guardado y marca la expiración de nuevo si falla. Persistirlo sólo
      // añadiría una fuente de verdad que puede quedar desincronizada.
      partialize: (state) => ({
        accessToken: state.accessToken,
        accessExpiresAt: state.accessExpiresAt,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)
