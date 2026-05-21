import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/shared/ui/Toast/toast.context'
import { useToast } from '@/shared/ui/Toast/useToast'

function ToastTrigger() {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast.success('Guardado ok')}>
      Mostrar toast
    </button>
  )
}

describe('Toast', () => {
  it('shows success message', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: /mostrar toast/i }))
    expect(screen.getByText('Guardado ok')).toBeInTheDocument()
  })
})
