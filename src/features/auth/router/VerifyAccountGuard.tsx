import { Navigate, Outlet } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectIsAccountVerified } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PageLoader } from '@/shared/components/feedback'

export function VerifyAccountGuard() {
  const { status } = useAuthBootstrap()
  const isAccountVerified = useAuthStore(selectIsAccountVerified)

  if (status === 'loading') {
    return <PageLoader />
  }

  if (!isAccountVerified) {
    return <Navigate to={authPaths.verifyEmail} replace />
  }

  return <Outlet />
}
