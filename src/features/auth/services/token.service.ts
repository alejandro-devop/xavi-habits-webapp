import * as authApi from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'

export const REFRESH_MARGIN_MS = 60_000

let refreshInFlight: Promise<string | null> | null = null

export function shouldRefreshToken(accessExpiresAt: number | null): boolean {
  if (accessExpiresAt === null) {
    return false
  }
  return Date.now() >= accessExpiresAt - REFRESH_MARGIN_MS
}

export async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = performRefresh()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

async function performRefresh(): Promise<string | null> {
  const { refreshToken, clearSession, expireSession, updateAccessToken, updateUser } =
    useAuthStore.getState()

  if (!refreshToken) {
    // Nunca hubo sesión que caducar: se limpia sin marcar expiración.
    clearSession()
    return null
  }

  try {
    const data = await authApi.refresh({ refreshToken })
    updateAccessToken({
      accessToken: data.accessToken,
      accessExpiresAt: data.accessExpiresAt,
      refreshToken: data.refreshToken,
    })
    updateUser(data.user)
    return data.accessToken
  } catch {
    // Había sesión y el refresh falló: es una caducidad, no un logout. Se
    // marca como tal para poder ofrecer el reingreso sin expulsar al usuario.
    expireSession()
    return null
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, accessExpiresAt, refreshToken, expireSession } = useAuthStore.getState()

  if (!refreshToken) {
    return null
  }

  if (accessToken && !shouldRefreshToken(accessExpiresAt)) {
    return accessToken
  }

  const refreshed = await refreshSession()
  if (refreshed) {
    return refreshed
  }

  // performRefresh ya marcó la expiración; se repite por si el refresh se
  // resolvió por otra vía. Es idempotente y no debe degradar a clearSession:
  // eso borraría la marca y volvería a expulsar al usuario.
  expireSession()
  return null
}
