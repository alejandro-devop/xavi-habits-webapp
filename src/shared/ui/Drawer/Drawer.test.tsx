import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from '@/shared/ui/Drawer'

describe('Drawer', () => {
  it('closes with Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Drawer open onClose={onClose} title="Panel">
        <p>Contenido</p>
      </Drawer>,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('propaga el ámbito del design system al portal', () => {
    render(
      <Drawer open onClose={vi.fn()} title="Panel" ds="aura">
        <p>Contenido</p>
      </Drawer>,
    )

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.closest('[data-ds="aura"]')).not.toBeNull()
  })

  it('sin ámbito no añade el atributo', () => {
    render(
      <Drawer open onClose={vi.fn()} title="Panel">
        <p>Contenido</p>
      </Drawer>,
    )

    expect(document.querySelector('[data-ds]')).toBeNull()
  })
})
