import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

/**
 * **Lo real encima de lo planeado** (tajada 3): los tres estados del criterio
 * 296 en la franja, y la puerta a la hoja (criterio 298).
 *
 * `realDay` es lo que separa la plantilla —una semana tipo, donde no hay nada
 * que confirmar— de un día con fecha.
 */
describe('VidaNightBand — lo que dormiste de verdad (criterios 295 a 298)', () => {
  it('en la plantilla no dice ni «confirmado» ni «sin confirmar»', () => {
    const { container } = render(
      <VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} />,
    )

    expect(container.textContent).not.toContain('confirm')
    expect(container.textContent).toContain('Duermes hasta las 5:00')
  })

  // Criterio 295: ignorar la pregunta es válido y la franja lo dice con esa
  // palabra, **sin afirmar nada nuevo**: lo planeado sigue siendo lo planeado.
  it('un día real sin contestar dice lo planeado y «sin confirmar»', () => {
    render(<VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} realDay />)

    expect(screen.getByText('Duermes hasta las 5:00')).toBeInTheDocument()
    expect(screen.getByText('Vienes de anoche · 6 h · sin confirmar')).toBeInTheDocument()
    expect(screen.queryByText(/Dormiste/)).not.toBeInTheDocument()
  })

  // Criterio 297, literal.
  it('confirmada, dice lo real: horas, duración, diferencia y «confirmado»', () => {
    render(
      <VidaNightBand
        variant="dawn"
        night={{ ...CROSSING }}
        day={WEDNESDAY}
        realDay
        log={{ bedTime: '01:00', wakeTime: '06:40', confirmedAt: 'x' }}
      />,
    )

    expect(screen.getByText('Dormiste 1:00 → 6:40')).toBeInTheDocument()
    expect(
      screen.getByText('5 h 40 · 20 min menos que tu noche · confirmado'),
    ).toBeInTheDocument()
  })

  // Criterio 296: los tres estados se distinguen en pantalla, y también en el
  // DOM (`data-state`), que es lo que permite mirarlos sin leer prosa.
  it('«sin confirmar», «confirmado» y «sin dato» son tres cosas distintas', () => {
    const { container } = render(
      <>
        <VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} realDay />
        <VidaNightBand
          variant="dawn"
          night={{ ...CROSSING }}
          day={WEDNESDAY}
          realDay
          log={{ bedTime: '23:00', wakeTime: '05:00', confirmedAt: 'x' }}
        />
        <VidaNightBand
          variant="dawn"
          night={{ ...CROSSING }}
          day={WEDNESDAY}
          realDay
          log={{ bedTime: null, wakeTime: '06:40', confirmedAt: 'x' }}
        />
      </>,
    )

    const estados = [...container.querySelectorAll<HTMLElement>('[data-state]')].map(
      (node) => node.dataset.state,
    )
    expect(estados).toEqual(['unconfirmed', 'confirmed', 'no-data'])
    expect(container.textContent).toContain('sin confirmar')
    expect(container.textContent).toContain('confirmado')
    expect(container.textContent).toContain('A qué hora te acostaste, sin dato')
  })

  // La franja de **abajo** habla de la noche que aún no ha pasado: de eso no
  // hay nada que confirmar, y por eso no cambia ni una palabra.
  it('la de abajo no habla de confirmar aunque el día sea real', () => {
    const { container } = render(
      <VidaNightBand
        variant="dusk"
        night={{ ...CROSSING }}
        day={TUESDAY}
        realDay
        log={{ bedTime: '23:00', wakeTime: '05:00', confirmedAt: 'x' }}
      />,
    )

    expect(screen.getByText('23:00 · te acuestas')).toBeInTheDocument()
    expect(container.textContent).not.toContain('confirmado')
  })

  // El suelo de la pregunta, por su otro lado: mientras la noche pasa la franja
  // no se queda muda **y no dice «sin confirmar»**.
  it('mientras la noche está pasando dice que aún no ha terminado', () => {
    render(
      <VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} realDay stillRunning />,
    )

    expect(screen.getByText('Duermes hasta las 5:00')).toBeInTheDocument()
    expect(screen.getByText('Vienes de anoche · 6 h · aún no ha terminado')).toBeInTheDocument()
    expect(screen.queryByText(/sin confirmar/)).not.toBeInTheDocument()
  })

  // Criterio 298: se toca la franja y abre la hoja. **La franja es el botón**,
  // así que sigue sin contener ningún control dentro (criterio 272).
  it('con `onEdit` la franja entera se puede tocar, y no mete un botón dentro', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <VidaNightBand
        variant="dawn"
        night={{ ...CROSSING }}
        day={WEDNESDAY}
        realDay
        log={{ bedTime: '23:00', wakeTime: '05:00', confirmedAt: 'x' }}
        onEdit={onEdit}
      />,
    )

    const franja = document.querySelector<HTMLElement>('[data-variant="dawn"]')!
    expect(franja.tagName).toBe('BUTTON')
    expect(franja.querySelector('button')).toBeNull()

    await user.click(franja)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('sin `onEdit` la franja no se puede tocar', () => {
    render(<VidaNightBand variant="dawn" night={{ ...CROSSING }} day={WEDNESDAY} realDay />)

    expect(document.querySelector('[data-variant="dawn"]')!.tagName).toBe('DIV')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
