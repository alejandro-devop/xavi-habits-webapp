import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommandPaletteProvider } from '@/shared/ui/CommandPalette'

const ACTIONS = [
  { id: 'test', label: 'Acción de prueba', onSelect: vi.fn() },
]

describe('CommandPalette', () => {
  it('opens with meta+k', async () => {
    const user = userEvent.setup()
    render(
      <CommandPaletteProvider actions={ACTIONS}>
        <span>App</span>
      </CommandPaletteProvider>,
    )

    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog', { name: /paleta de comandos/i })).toBeInTheDocument()
  })
})
