import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '@/features/auth/router/ProtectedRoute'
import { VerifyAccountGuard } from '@/features/auth/router/VerifyAccountGuard'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { TestingHallPage } from '@/pages/app/TestingHallPage/TestingHallPage'
import { ThemeProvider } from '@/features/theme'

vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' as const }),
}))

describe('/app/testinghall route', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={[authPaths.testingHall]}>
        <Routes>
          <Route path={authPaths.login} element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<VerifyAccountGuard />}>
              <Route path="/app/testinghall" element={<TestingHallPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders Testing Hall for verified authenticated users', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: Date.now() + 60_000,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[authPaths.testingHall]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<VerifyAccountGuard />}>
                <Route path="/app/testinghall" element={<TestingHallPage />} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Testing Hall' })).toBeInTheDocument()
  })
})
