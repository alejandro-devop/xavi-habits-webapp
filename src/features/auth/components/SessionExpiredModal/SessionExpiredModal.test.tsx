import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal'
import { useAuthStore } from '@/features/auth/store/auth.store'

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SessionExpiredModal />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function loginAndExpire() {
  useAuthStore.getState().setSession({
    accessToken: 'access',
    accessExpiresAt: Date.now() + 60_000,
    refreshToken: 'refresh',
    user: { id: 1, email: 'user@example.com', name: 'Jane', isAccountVerified: true },
  })
  useAuthStore.getState().expireSession()
}

describe('SessionExpiredModal', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('no se muestra mientras la sesión es válida', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: Date.now() + 60_000,
      refreshToken: 'refresh',
      user: { id: 1, email: 'user@example.com', name: 'Jane', isAccountVerified: true },
    })

    renderModal()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('aparece al expirar y precarga el correo del usuario', () => {
    loginAndExpire()
    renderModal()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Tu sesión expiró')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('user@example.com')
  })

  it('no se puede descartar: sin sesión, cerrarlo dejaría la app inservible', async () => {
    const user = userEvent.setup()
    loginAndExpire()
    renderModal()

    expect(screen.queryByRole('button', { name: /cerrar$/i })).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('exige contraseña antes de intentar reingresar', async () => {
    const user = userEvent.setup()
    loginAndExpire()
    renderModal()

    await user.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
  })
})
