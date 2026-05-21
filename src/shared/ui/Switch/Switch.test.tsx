import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from '@/shared/ui/Switch/Switch'

describe('Switch', () => {
  it('toggles aria-checked on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Switch id="sw" label="Notificaciones" onChange={onChange} />)

    const control = screen.getByRole('switch', { name: /Notificaciones/i })
    expect(control).toHaveAttribute('aria-checked', 'false')

    await user.click(control)
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(onChange).toHaveBeenCalled()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Switch id="sw2" label="Off" disabled onChange={onChange} />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
