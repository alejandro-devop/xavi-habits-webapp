import { Navigate, Outlet } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import {
  selectIsAccountVerified,
  selectIsAuthenticated,
} from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PageLoader } from '@/shared/components/feedback'

export function GuestRoute() {
  const { status } = useAuthBootstrap()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAccountVerified = useAuthStore(selectIsAccountVerified)

  if (status === 'loading') {
    return <PageLoader label="Cargando…" />
  }

  if (isAuthenticated && isAccountVerified) {
    return <Navigate to={authPaths.today} replace />
  }

  if (isAuthenticated && !isAccountVerified) {
    return <Navigate to={authPaths.verifyEmail} replace />
  }

  return <Outlet />
}
