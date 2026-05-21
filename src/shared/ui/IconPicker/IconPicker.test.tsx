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

  it('finds gym-related icons when searching', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /elegir icono/i }))
    await user.type(screen.getByRole('searchbox', { name: /buscar icono/i }), 'gym')

    expect(screen.getByRole('option', { name: /pesas/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /correr/i })).toBeTruthy()
  })

  it('shows category heading Trabajo when not searching', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /elegir icono/i }))

    expect(screen.getByRole('heading', { name: 'Trabajo' })).toBeTruthy()
  })
})
