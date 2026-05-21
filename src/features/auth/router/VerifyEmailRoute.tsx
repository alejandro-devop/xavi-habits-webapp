import { Navigate, useLocation, useSearchParams } from 'react-router'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getPendingEmail } from '@/features/auth/utils/pending-email'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage/VerifyEmailPage'
import { PageLoader } from '@/shared/components/feedback'

type VerifyLocationState = {
  email?: string
}

export function VerifyEmailRoute() {
  const { status } = useAuthBootstrap()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const locationState = (location.state as VerifyLocationState | null) ?? {}

  if (status === 'loading') {
    return <PageLoader label="Cargando…" />
  }

  if (!isAuthenticated) {
    const hasGuestContext =
      Boolean(locationState.email?.trim()) ||
      Boolean(searchParams.get('email')?.trim()) ||
      Boolean(getPendingEmail())

    if (!hasGuestContext) {
      return <Navigate to={authPaths.login} replace />
    }
  }

  return <VerifyEmailPage />
}
