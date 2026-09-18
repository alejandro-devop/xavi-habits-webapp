import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HABIT_COLORS } from '@/features/habits/data/habit-colors'
import { HabitColorPicker } from './HabitColorPicker'

describe('HabitColorPicker', () => {
  it('muestra las seis muestras con su nombre en español', () => {
    render(<HabitColorPicker value={null} onChange={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(6)
    expect(screen.getByRole('radio', { name: 'Menta' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Azul' })).toBeTruthy()
  })

  it('marca el color que ya tiene el hábito, aunque llegue en mayúsculas', () => {
    render(<HabitColorPicker value="#10B981" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Menta' }).getAttribute('aria-checked')).toBe('true')
  })

  it('sin color no marca ninguna muestra', () => {
    render(<HabitColorPicker value={null} onChange={vi.fn()} />)

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('aria-checked')).toBe('false')
    }
  })

  it('avisa del hex al elegir una muestra', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HabitColorPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'Violeta' }))

    expect(onChange).toHaveBeenCalledWith('#8b5cf6')
  })

  it('se recorre con las flechas del teclado', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HabitColorPicker value={HABIT_COLORS[0].hex} onChange={onChange} />)

    screen.getByRole('radio', { name: 'Menta' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith(HABIT_COLORS[1].hex)
  })

  it('enseña el color de fuera de la paleta que ya tenía el hábito', () => {
    render(<HabitColorPicker value="#123456" onChange={vi.fn()} />)

    const current = screen.getByRole('radio', { name: 'Color actual' })
    expect(current.getAttribute('aria-checked')).toBe('true')
    expect(screen.getAllByRole('radio')).toHaveLength(HABIT_COLORS.length + 1)
  })
})
