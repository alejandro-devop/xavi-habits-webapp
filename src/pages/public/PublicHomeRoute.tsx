import { Navigate } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import {
  selectAuthUser,
  selectIsAccountVerified,
  selectIsAuthenticated,
} from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { HomePage } from '@/pages/public/HomePage/HomePage'
import { PageLoader } from '@/shared/components/feedback'

export function PublicHomeRoute() {
  const { status } = useAuthBootstrap()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAccountVerified = useAuthStore(selectIsAccountVerified)
  const user = useAuthStore(selectAuthUser)

  if (status === 'loading') {
    return <PageLoader label="Cargando…" />
  }

  if (isAuthenticated && isAccountVerified) {
    return <Navigate to={authPaths.today} replace />
  }

  if (isAuthenticated && !isAccountVerified) {
    return (
      <Navigate
        to={authPaths.verifyEmail}
        replace
        state={{ email: user?.email }}
      />
    )
  }

  return <HomePage />
}
