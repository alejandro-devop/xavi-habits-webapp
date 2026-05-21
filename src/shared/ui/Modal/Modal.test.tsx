import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '@/shared/ui/Modal/Modal'

describe('Modal', () => {
  it('renders when open and closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Modal open title="Título" description="Descripción" onClose={onClose}>
        Contenido
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'Título' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(<Modal open={false} title="Oculto" onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
