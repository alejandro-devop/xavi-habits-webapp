import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VidaDurationPills } from './VidaDurationPills'

describe('VidaDurationPills', () => {
  it('ofrece 15 · 30 · 45 · 1h · libre, las palabras del usuario (criterio 3)', () => {
    render(<VidaDurationPills value={null} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '45' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'libre' })).toBeInTheDocument()
  })

  it('elegir una píldora devuelve sus minutos', () => {
    const onChange = vi.fn()
    render(<VidaDurationPills value={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '45' }))
    expect(onChange).toHaveBeenCalledWith(45)
  })

  it('volver a tocar la elegida la quita: la duración es opcional (criterio 5)', () => {
    const onChange = vi.fn()
    render(<VidaDurationPills value={30} onChange={onChange} />)

    expect(screen.getByRole('button', { name: '30' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '30' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('«libre» abre un campo en minutos y lo que se teclea sale como número', () => {
    const onChange = vi.fn()
    render(<VidaDurationPills value={null} onChange={onChange} />)

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'libre' }))

    const field = screen.getByRole('spinbutton')
    fireEvent.change(field, { target: { value: '50' } })
    expect(onChange).toHaveBeenCalledWith(50)
  })

  it('un valor que no es ninguna píldora abre «libre» solo, sin efectos', () => {
    render(<VidaDurationPills value={50} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'libre' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('spinbutton')).toHaveValue(50)
    // Y ninguna píldora fija miente diciendo que está elegida.
    expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('vaciar el campo libre deja la duración en nada, no en cero', () => {
    const onChange = vi.fn()
    render(<VidaDurationPills value={50} onChange={onChange} />)

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('con tope, lo que no cabe se apaga pero se sigue viendo (molde del criterio 26)', () => {
    render(<VidaDurationPills value={null} onChange={vi.fn()} maxMinutes={30} />)

    expect(screen.getByRole('button', { name: '15' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '45' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1h' })).toBeDisabled()
    expect(screen.getByText('Aquí caben 30 min.')).toBeInTheDocument()
  })

  it('deshabilitado no deja tocar nada', () => {
    render(<VidaDurationPills value={null} onChange={vi.fn()} disabled />)

    expect(screen.getByRole('button', { name: '15' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'libre' })).toBeDisabled()
  })
})
