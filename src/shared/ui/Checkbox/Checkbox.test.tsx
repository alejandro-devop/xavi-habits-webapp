import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from '@/shared/ui/Checkbox/Checkbox'

describe('Checkbox', () => {
  it('associates label and toggles checked state', async () => {
    const user = userEvent.setup()
    render(<Checkbox id="terms" label="Acepto términos" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Acepto términos' })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })
})
