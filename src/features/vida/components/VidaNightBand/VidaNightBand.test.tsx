import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VidaNightBand } from './VidaNightBand'

const TUESDAY = 'tuesday'
const WEDNESDAY = 'wednesday'

const CROSSING = { bedTime: '23:00', wakeTime: '05:00', days: ['tuesday'] } as const
const INSIDE = { bedTime: '01:00', wakeTime: '06:40', days: ['tuesday'] } as const

describe('VidaNightBand (criterio 271)', () => {
  it('la franja de arriba dice hasta qué hora duermes y que vienes de anoche', () => {
    render(<VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} />)

    expect(screen.getByText('Duermes hasta las 5:00')).toBeInTheDocument()
    expect(screen.getByText('Vienes de anoche · 6 h')).toBeInTheDocument()
  })

  it('la franja de abajo dice la hora de acostarse y el día en que te levantas', () => {
    render(<VidaNightBand variant="dusk" night={{ ...CROSSING }} day={TUESDAY} />)

    expect(screen.getByText('23:00 · te acuestas')).toBeInTheDocument()
    expect(
      screen.getByText('Duermes 6 h y te levantas el miércoles a las 5:00'),
    ).toBeInTheDocument()
  })

  // Criterio 276: nada asume que la noche parte el día en dos.
  it('una noche que no cruza no dice «vienes de anoche»', () => {
    render(<VidaNightBand variant="dawn" night={{ ...INSIDE }} day={TUESDAY} />)

    expect(screen.getByText('Duermes hasta las 6:40')).toBeInTheDocument()
    expect(screen.queryByText(/Vienes de anoche/)).not.toBeInTheDocument()
    expect(screen.getByText(/Empezó esta madrugada, a la 1:00 · 5 h 40/)).toBeInTheDocument()
  })

  // Criterio 272: no es una fila de la lista.
  it('no lleva hora en la canaleta ni es un <li> ni ofrece nada que pulsar', () => {
    const { container } = render(
      <VidaNightBand variant="dusk" night={{ ...CROSSING }} day={TUESDAY} />,
    )

    expect(container.querySelector('li')).toBeNull()
    expect(container.querySelector('time')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('a')).toBeNull()
  })

  // Criterio 274: el color es de la hoja de estilos y de sus tokens — aquí se
  // afirma lo que el DOM puede afirmar: **ningún color escrito en el elemento**.
  // Que los tokens `--aura-night-*` existan en los dos temas se comprueba sobre
  // el CSS compilado, porque vitest no compila CSS.
  it('no pinta ningún color en línea: todo viene de la hoja de estilos', () => {
    const { container } = render(
      <VidaNightBand variant="dusk" night={{ ...CROSSING }} day={TUESDAY} />,
    )
    const band = container.firstElementChild as HTMLElement

    expect(band.getAttribute('style')).toBeNull()
    expect(band).toHaveAttribute('data-variant', 'dusk')
  })

  // Criterio 316: ni una palabra de reproche.
  it('no hay ni una palabra de reproche en lo que pinta', () => {
    const { container } = render(
      <>
        <VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} />
        <VidaNightBand variant="dusk" night={{ ...CROSSING }} day={TUESDAY} />
        <VidaNightBand variant="dawn" night={{ ...INSIDE }} day={TUESDAY} />
      </>,
    )
    const text = container.textContent ?? ''

    for (const word of ['poco', 'mal', 'deberías', 'apenas', 'desperdicio', 'tarde', 'por qué']) {
      expect(text.toLowerCase()).not.toContain(word)
    }
  })

  // Criterio 313: una noche de 12 h y una de 3 h se dicen enteras.
  it('una noche de 12 h y una de 3 h se dicen con su cifra', () => {
    const { rerender } = render(
      <VidaNightBand
        variant="dawn"
        night={{ bedTime: '20:00', wakeTime: '08:00', days: ['tuesday'] }}
        day={WEDNESDAY}
      />,
    )
    expect(screen.getByText('Vienes de anoche · 12 h')).toBeInTheDocument()

    rerender(
      <VidaNightBand
        variant="dawn"
        night={{ bedTime: '02:00', wakeTime: '05:00', days: ['tuesday'] }}
        day={TUESDAY}
      />,
    )
    expect(screen.getByText(/3 h/)).toBeInTheDocument()
  })
})
