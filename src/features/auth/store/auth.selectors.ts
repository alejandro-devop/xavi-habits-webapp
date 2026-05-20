import type { AuthState } from '@/features/auth/store/auth.store'

export const selectIsAuthenticated = (state: AuthState): boolean =>
  Boolean(state.refreshToken && state.accessToken)

export const selectIsAccountVerified = (state: AuthState): boolean =>
  Boolean(state.user?.isAccountVerified)

export const selectAuthUser = (state: AuthState) => state.user
