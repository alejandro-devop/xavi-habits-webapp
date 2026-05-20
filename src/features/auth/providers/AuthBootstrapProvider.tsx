import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '@/features/auth/api/auth.api'
import {
  AuthBootstrapContext,
  type AuthBootstrapStatus,
} from '@/features/auth/providers/auth-bootstrap.context'
import { getValidAccessToken } from '@/features/auth/services/token.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ApiClientError } from '@/shared/api/api-error'

type AuthBootstrapProviderProps = {
  children: ReactNode
}

export function AuthBootstrapProvider({ children }: AuthBootstrapProviderProps) {
  const [status, setStatus] = useState<AuthBootstrapStatus>('loading')

  const runBootstrap = useCallback(async () => {
    const { refreshToken, clearSession, updateUser } = useAuthStore.getState()

    if (!refreshToken) {
      return
    }

    try {
      const token = await getValidAccessToken()
      if (!token) {
        clearSession()
        return
      }

      try {
        const profile = await authApi.getProfile(token)
        updateUser(profile.user)
      } catch (error) {
        if (error instanceof ApiClientError && error.isAuthError) {
          clearSession()
        }
      }
    } catch {
      clearSession()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const persist = useAuthStore.persist

    const finish = () => {
      if (!cancelled) {
        setStatus('ready')
      }
    }

    const start = () => {
      void runBootstrap().finally(finish)
    }

    if (persist.hasHydrated()) {
      start()
      return () => {
        cancelled = true
      }
    }

    const unsub = persist.onFinishHydration(start)

    return () => {
      cancelled = true
      unsub()
    }
  }, [runBootstrap])

  const value = useMemo(() => ({ status }), [status])

  return (
    <AuthBootstrapContext.Provider value={value}>{children}</AuthBootstrapContext.Provider>
  )
}
