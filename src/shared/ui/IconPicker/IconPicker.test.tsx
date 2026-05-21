import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconPicker } from '@/shared/ui/IconPicker'

describe('IconPicker', () => {
  it('normalizes selection to stored name bell', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IconPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /elegir icono/i }))
    await user.click(screen.getByRole('option', { name: /campana/i }))

    expect(onChange).toHaveBeenCalledWith('bell')
  })
})
