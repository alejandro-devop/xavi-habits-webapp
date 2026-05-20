import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, AuthUser } from '@/features/auth/types/auth.types'
import { storage } from '@/shared/lib/storage'

export interface AuthState {
  accessToken: string | null
  accessExpiresAt: number | null
  refreshToken: string | null
  user: AuthUser | null

  setSession: (session: AuthSession) => void
  updateAccessToken: (payload: {
    accessToken: string
    accessExpiresAt: number
    refreshToken: string
  }) => void
  updateUser: (user: AuthUser) => void
  clearSession: () => void
}

const initialSession = {
  accessToken: null,
  accessExpiresAt: null,
  refreshToken: null,
  user: null,
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
        }),

      updateAccessToken: ({ accessToken, accessExpiresAt, refreshToken }) =>
        set({ accessToken, accessExpiresAt, refreshToken }),

      updateUser: (user) => set({ user }),

      clearSession: () => set({ ...initialSession }),
    }),
    {
      name: 'xavi-auth',
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      partialize: (state) => ({
        accessToken: state.accessToken,
        accessExpiresAt: state.accessExpiresAt,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)
