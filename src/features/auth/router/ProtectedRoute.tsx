import { Navigate, Outlet } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PageLoader } from '@/shared/components/feedback'

export function ProtectedRoute() {
  const { status } = useAuthBootstrap()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)

  if (status === 'loading') {
    return <PageLoader label="Comprobando sesión…" />
  }

  // Con la sesión caducada se mantiene la pantalla: SessionExpiredModal pide
  // volver a entrar por encima del contenido. Expulsar aquí haría perder el
  // contexto, que es justo lo que se quiere evitar.
  if (!isAuthenticated && !sessionExpired) {
    return <Navigate to={authPaths.login} replace />
  }

  return <Outlet />
}
