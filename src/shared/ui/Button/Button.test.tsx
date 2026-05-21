import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/shared/ui/Button/Button'

describe('Button', () => {
  it('renders primary variant', () => {
    render(<Button variant="primary">Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows loading state and prevents interaction', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button isLoading onClick={onClick}>
        Enviar
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Enviar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
