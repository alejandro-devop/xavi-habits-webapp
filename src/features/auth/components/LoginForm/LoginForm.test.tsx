import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm'

const mutate = vi.fn()

vi.mock('@/features/auth/hooks/useLoginMutation', () => ({
  useLoginMutation: () => ({
    mutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}))

function renderLoginForm() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginForm', () => {
  it('shows validation message when submitting empty form', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('calls login mutation with email and password', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Secret123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(mutate).toHaveBeenCalledWith(
      { email: 'user@example.com', password: 'Secret123' },
      expect.objectContaining({ onError: expect.any(Function) }),
    )
  })
})
