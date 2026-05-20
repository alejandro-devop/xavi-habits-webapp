import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GuestRoute } from '@/features/auth/router/GuestRoute'
import { ProtectedRoute } from '@/features/auth/router/ProtectedRoute'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' as const }),
}))

function ProtectedTarget() {
  return <div>Protected content</div>
}

function GuestTarget() {
  return <div>Guest content</div>
}

describe('auth guards', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('ProtectedRoute redirects to login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/app/today']}>
        <Routes>
          <Route path="/auth/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app/today" element={<ProtectedTarget />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('ProtectedRoute renders outlet when authenticated', () => {
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
      <MemoryRouter initialEntries={['/app/today']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app/today" element={<ProtectedTarget />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('GuestRoute redirects verified users to today', () => {
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
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path={authPaths.today} element={<div>Today page</div>} />
          <Route element={<GuestRoute />}>
            <Route path="/auth/login" element={<GuestTarget />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Today page')).toBeInTheDocument()
  })

  it('GuestRoute redirects unverified authenticated users to verify-email', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: Date.now() + 60_000,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: false,
      },
    })

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path={authPaths.verifyEmail} element={<div>Verify page</div>} />
          <Route element={<GuestRoute />}>
            <Route path="/auth/login" element={<GuestTarget />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Verify page')).toBeInTheDocument()
  })
})
