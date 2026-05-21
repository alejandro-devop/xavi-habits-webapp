import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider, useConfirmDialog } from '@/shared/ui/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('calls onConfirm when confirmed', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    function Trigger() {
      const { confirm } = useConfirmDialog()
      return (
        <button type="button" onClick={() => void confirm({ title: 'Test', onConfirm })}>
          Abrir
        </button>
      )
    }

    render(
      <ConfirmDialogProvider>
        <Trigger />
      </ConfirmDialogProvider>,
    )

    await user.click(screen.getByRole('button', { name: /abrir/i }))
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(onConfirm).toHaveBeenCalled()
  })
})
