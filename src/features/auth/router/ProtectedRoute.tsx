import { Navigate, Outlet } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PageLoader } from '@/shared/components/feedback'

export function ProtectedRoute() {
  const { status } = useAuthBootstrap()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  if (status === 'loading') {
    return <PageLoader label="Comprobando sesión…" />
  }

  if (!isAuthenticated) {
    return <Navigate to={authPaths.login} replace />
  }

  return <Outlet />
}
