import { useState } from 'react'
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

describe('VidaDurationPills · freeInput="hoursAndMinutes" (FEAT-008, tajada 1)', () => {
  // Un padre de verdad: el control es controlado y la regla de sincronización
  // solo se puede probar con alguien que aplique lo que emite.
  function Host({ initial = null as number | null }) {
    const [value, setValue] = useState<number | null>(initial)
    return (
      <>
        <VidaDurationPills value={value} onChange={setValue} freeInput="hoursAndMinutes" />
        <output data-testid="valor">{value === null ? 'null' : String(value)}</output>
        <button type="button" onClick={() => setValue(95)}>
          precargar 95
        </button>
      </>
    )
  }

  it('«libre» abre dos campos con su nombre propio, no uno compartido (criterios 107 y 114)', () => {
    render(<VidaDurationPills value={null} onChange={vi.fn()} freeInput="hoursAndMinutes" />)

    fireEvent.click(screen.getByRole('button', { name: 'libre' }))

    const hours = screen.getByLabelText('horas')
    const minutes = screen.getByLabelText('minutos')
    expect(hours).toBeInTheDocument()
    expect(minutes).toBeInTheDocument()
    // Teclado numérico y sin rueda del ratón: `text` + `inputMode` (criterio 114).
    expect(hours).toHaveAttribute('inputmode', 'numeric')
    expect(minutes).toHaveAttribute('inputmode', 'numeric')
    expect(hours).toHaveAttribute('type', 'text')
    expect(minutes).toHaveAttribute('type', 'text')
    // El grupo se sigue llamando igual.
    expect(screen.getByRole('group', { name: 'Cuánto' })).toBeInTheDocument()
    // Y las unidades se ven.
    expect(screen.getByText('h')).toBeInTheDocument()
    expect(screen.getByText('min')).toBeInTheDocument()
  })

  it('lo guardado se abre repartido, nunca vacío (criterio 109)', () => {
    render(<VidaDurationPills value={95} onChange={vi.fn()} freeInput="hoursAndMinutes" />)

    expect(screen.getByRole('button', { name: 'libre' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('horas')).toHaveValue('1')
    expect(screen.getByLabelText('minutos')).toHaveValue('35')
  })

  it('45 abre con su píldora encendida y sin campos; 60 igual (criterio 109)', () => {
    const { unmount } = render(
      <VidaDurationPills value={45} onChange={vi.fn()} freeInput="hoursAndMinutes" />,
    )
    expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByLabelText('horas')).not.toBeInTheDocument()
    unmount()

    render(<VidaDurationPills value={60} onChange={vi.fn()} freeInput="hoursAndMinutes" />)
    expect(screen.getByRole('button', { name: '1h' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'libre' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('sin duración, los dos campos vacíos y ninguna píldora encendida (criterio 109)', () => {
    render(<VidaDurationPills value={null} onChange={vi.fn()} freeInput="hoursAndMinutes" />)

    for (const name of ['15', '30', '45', '1h', 'libre']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
    }
    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    expect(screen.getByLabelText('horas')).toHaveValue('')
    expect(screen.getByLabelText('minutos')).toHaveValue('')
  })

  it('lo que sale sigue siendo minutos: horas × 60 + minutos (criterio 110)', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    fireEvent.change(screen.getByLabelText('horas'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '35' } })

    expect(screen.getByTestId('valor')).toHaveTextContent('95')
  })

  it('mientras se escribe no se pelea, y al salir se ordena solo (criterio 112)', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    const minutes = screen.getByLabelText('minutos')
    fireEvent.change(minutes, { target: { value: '9' } })
    // Teclear `9` no salta a «0 h 9»: el campo conserva lo tecleado.
    expect(screen.getByLabelText('horas')).toHaveValue('')
    expect(minutes).toHaveValue('9')

    fireEvent.change(minutes, { target: { value: '90' } })
    // Guardar sin salir del campo guarda 90: la normalización es de presentación.
    expect(screen.getByTestId('valor')).toHaveTextContent('90')
    expect(minutes).toHaveValue('90')

    fireEvent.blur(minutes)
    expect(screen.getByLabelText('horas')).toHaveValue('1')
    expect(minutes).toHaveValue('30')
    expect(screen.getByTestId('valor')).toHaveTextContent('90')
  })

  it('vacío es vacío y «0 h 0 min» es sin duración, nunca cero (criterio 111)', () => {
    render(<Host initial={95} />)

    fireEvent.change(screen.getByLabelText('horas'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '' } })
    expect(screen.getByTestId('valor')).toHaveTextContent('null')

    fireEvent.change(screen.getByLabelText('horas'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '0' } })
    expect(screen.getByTestId('valor')).toHaveTextContent('null')
  })

  it('el tope se dice en una línea llana y no se pelea mientras se escribe (criterio 113)', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    const hours = screen.getByLabelText('horas')
    fireEvent.change(hours, { target: { value: '99' } })

    expect(hours).toHaveValue('99')
    expect(screen.getByText('Como mucho 23 h 59 min.')).toBeInTheDocument()
    expect(screen.getByTestId('valor')).toHaveTextContent('1439')
    // Ni rojo, ni «error», ni alarma (criterio 132).
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.blur(hours)
    expect(hours).toHaveValue('23')
    expect(screen.getByLabelText('minutos')).toHaveValue('59')
  })

  it('las letras y los signos se ignoran, sin dejar el campo raro (criterio 113)', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    const minutes = screen.getByLabelText('minutos')
    fireEvent.change(minutes, { target: { value: '4a-5' } })

    expect(minutes).toHaveValue('45')
    expect(screen.getByTestId('valor')).toHaveTextContent('45')
  })

  it('las píldoras se quedan y reparten lo que eligen (criterio 108)', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: '1h' }))
    expect(screen.getByTestId('valor')).toHaveTextContent('60')

    // «1h» deja los campos en 1 h y 0 min (criterio 108).
    fireEvent.click(screen.getByRole('button', { name: 'libre' }))
    expect(screen.getByLabelText('horas')).toHaveValue('1')
    expect(screen.getByLabelText('minutos')).toHaveValue('0')

    // Y lo escrito a mano lo reemplaza una píldora, como hoy.
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '35' } })
    expect(screen.getByTestId('valor')).toHaveTextContent('95')
    fireEvent.click(screen.getByRole('button', { name: '30' }))
    expect(screen.getByTestId('valor')).toHaveTextContent('30')

    // Volver a tocar la elegida la vacía: la duración sigue siendo opcional.
    fireEvent.click(screen.getByRole('button', { name: '30' }))
    expect(screen.getByTestId('valor')).toHaveTextContent('null')
  })

  it('un valor que llega de fuera vuelve a repartirse (la puerta de FEAT-009)', () => {
    render(<Host initial={40} />)

    expect(screen.getByLabelText('horas')).toHaveValue('0')
    expect(screen.getByLabelText('minutos')).toHaveValue('40')

    fireEvent.click(screen.getByRole('button', { name: 'precargar 95' }))

    expect(screen.getByLabelText('horas')).toHaveValue('1')
    expect(screen.getByLabelText('minutos')).toHaveValue('35')
  })

  it('el tope del hueco se sigue diciendo igual y los campos no lo imponen', () => {
    render(
      <VidaDurationPills
        value={null}
        onChange={vi.fn()}
        freeInput="hoursAndMinutes"
        maxMinutes={40}
      />,
    )

    expect(screen.getByText('Aquí caben 40 min.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '45' })).toBeDisabled()
  })

  it('deshabilitado no deja escribir en ninguno de los dos', () => {
    render(<VidaDurationPills value={95} onChange={vi.fn()} freeInput="hoursAndMinutes" disabled />)

    expect(screen.getByLabelText('horas')).toBeDisabled()
    expect(screen.getByLabelText('minutos')).toBeDisabled()
  })
})
