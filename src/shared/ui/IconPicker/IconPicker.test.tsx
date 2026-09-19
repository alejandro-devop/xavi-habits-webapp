import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconPicker } from '@/shared/ui/IconPicker'

// Lo que se importa aquí es la versión diferida —la que usa la app—: por eso
// el disparador se espera con `findBy`, no se busca con `getBy`.
describe('IconPicker', () => {
  it('normalizes selection to stored name bell', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IconPicker value={null} onChange={onChange} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))
    await user.click(screen.getByRole('option', { name: /campana/i }))

    expect(onChange).toHaveBeenCalledWith('bell')
  })

  it('finds gym-related icons when searching', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))
    await user.type(screen.getByRole('searchbox', { name: /buscar icono/i }), 'gym')

    expect(screen.getByRole('option', { name: /pesas/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /correr/i })).toBeTruthy()
  })

  it('shows category heading Trabajo when not searching', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))

    expect(screen.getByRole('heading', { name: 'Trabajo' })).toBeTruthy()
  })

  it('shows the Social category with the full catalog', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))

    expect(screen.getByRole('heading', { name: 'Social' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Familia' })).toBeTruthy()
  })

  it('keeps arrow navigation crossing category groups', async () => {
    const user = userEvent.setup()
    render(<IconPicker value={null} onChange={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(840)

    const firstProductivity = options[0] as HTMLElement
    firstProductivity.focus()
    expect(firstProductivity).toHaveAttribute('tabindex', '0')

    // Walking backwards from the first cell wraps to the last one, which lives
    // in another category group.
    await user.keyboard('{ArrowLeft}')
    const last = options[options.length - 1] as HTMLElement
    expect(document.activeElement).toBe(last)
    expect(last).toHaveAttribute('tabindex', '0')
    expect(firstProductivity).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(firstProductivity)
  })

  it('keeps focus on a result after filtering the full catalog', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IconPicker value={null} onChange={onChange} />)

    await user.click(await screen.findByRole('button', { name: /elegir icono/i }))
    await user.type(screen.getByRole('searchbox', { name: /buscar icono/i }), 'lavadora')

    const results = screen.getAllByRole('option')
    expect(results).toHaveLength(1)
    expect(results[0]).toHaveAttribute('tabindex', '0')

    results[0]?.focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('jug-detergent')
  })
})
