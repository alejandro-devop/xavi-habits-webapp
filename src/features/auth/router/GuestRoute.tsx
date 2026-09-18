import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import { habitsPaths } from '@/features/habits'
import {
  selectAuthUser,
  selectIsAccountVerified,
  selectIsAuthenticated,
} from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PageLoader } from '@/shared/components/feedback'

export function GuestRoute() {
  const { status } = useAuthBootstrap()
  const location = useLocation()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAccountVerified = useAuthStore(selectIsAccountVerified)
  const user = useAuthStore(selectAuthUser)

  const isVerifyRoute = location.pathname === authPaths.verifyEmail

  if (status === 'loading') {
    return <PageLoader label="Cargando…" />
  }

  if (isAuthenticated && isAccountVerified) {
    return <Navigate to={habitsPaths.myDay} replace />
  }

  if (isAuthenticated && !isAccountVerified && !isVerifyRoute) {
    return (
      <Navigate
        to={authPaths.verifyEmail}
        replace
        state={{ email: user?.email }}
      />
    )
  }

  return <Outlet />
}
