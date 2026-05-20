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
  const { refreshToken, clearSession, updateAccessToken, updateUser } = useAuthStore.getState()

  if (!refreshToken) {
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
    clearSession()
    return null
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, accessExpiresAt, refreshToken, clearSession } =
    useAuthStore.getState()

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

  clearSession()
  return null
}
