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
})
