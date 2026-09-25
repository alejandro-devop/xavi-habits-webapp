import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaNightSheet } from '@/features/vida/components/VidaNightSheet'
import { VIDA_NIGHT_SAME_TIME_ERROR } from '@/features/vida/utils/vida-night.utils'
import { renderWithProviders } from '@/test/render'

/**
 * **«¿Cómo dormiste?»** (FEAT-012, tajada 3). Criterios 291, 292, 293, 298,
 * 299 y 316.
 *
 * La hoja **no escribe**: recibe `onSave`, igual que `VidaStartTimeSheet`. Lo
 * que se prueba aquí es lo que dice y lo que manda, no dónde acaba guardado.
 */
const NIGHT = { bedTime: '23:00', wakeTime: '05:00', days: ['tuesday'] } as const
/** 2026-09-23 es miércoles: te levantas el miércoles, te acostaste el martes. */
const MIERCOLES = '2026-09-23'

function abrir(props: Partial<React.ComponentProps<typeof VidaNightSheet>> = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  renderWithProviders(
    <VidaNightSheet
      open
      onClose={onClose}
      date={MIERCOLES}
      night={{ ...NIGHT }}
      onSave={onSave}
      {...props}
    />,
  )
  return { onSave, onClose }
}

describe('VidaNightSheet (criterios 291 a 293)', () => {
  it('abre con lo planeado dentro y con el titular de la noche (291)', () => {
    abrir()

    expect(screen.getByText('¿Cómo dormiste?')).toBeInTheDocument()
    expect(
      screen.getByText('Noche del martes al miércoles · tu noche dice 23:00 → 5:00'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Te acostaste')).toHaveValue('23:00')
    expect(screen.getByLabelText('Te levantaste')).toHaveValue('05:00')
  })

  // Criterio 292, con las palabras del render y **sin ningún juicio**.
  it('dice la duración y la diferencia con tu noche, en palabras neutras', async () => {
    const user = userEvent.setup()
    abrir()

    await user.clear(screen.getByLabelText('Te acostaste'))
    await user.type(screen.getByLabelText('Te acostaste'), '01:00')
    await user.clear(screen.getByLabelText('Te levantaste'))
    await user.type(screen.getByLabelText('Te levantaste'), '06:40')

    expect(screen.getByText('Dormiste 5 h 40 · 20 min menos que tu noche')).toBeInTheDocument()
  })

  // Criterio 293: el usuario no hace ninguna cuenta.
  it('una noche que no cruzó la medianoche lo dice, con sus días', async () => {
    const user = userEvent.setup()
    abrir()

    await user.clear(screen.getByLabelText('Te acostaste'))
    await user.type(screen.getByLabelText('Te acostaste'), '01:00')
    await user.clear(screen.getByLabelText('Te levantaste'))
    await user.type(screen.getByLabelText('Te levantaste'), '06:40')

    expect(
      screen.getByText('Esta noche no cruzó la medianoche: empezó y acabó el miércoles.'),
    ).toBeInTheDocument()
  })

  it('una noche que sí cruzó también lo dice, y con los dos días', () => {
    abrir()

    expect(
      screen.getByText('Esta noche cruzó la medianoche: empezó el martes y acabó el miércoles.'),
    ).toBeInTheDocument()
  })

  it('guardar manda las dos horas tal y como se escribieron', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = abrir()

    await user.clear(screen.getByLabelText('Te acostaste'))
    await user.type(screen.getByLabelText('Te acostaste'), '23:20')
    await user.clear(screen.getByLabelText('Te levantaste'))
    await user.type(screen.getByLabelText('Te levantaste'), '05:40')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith({ bedTime: '23:20', wakeTime: '05:40' })
    expect(onClose).toHaveBeenCalled()
  })

  // Criterio 303: no se inventa una hora para cuadrar.
  it('«No sé a qué hora» deja ese lado sin dato y guarda lo que sí se sabe', async () => {
    const user = userEvent.setup()
    const { onSave } = abrir()

    await user.click(screen.getByRole('button', { name: 'No sé a qué hora me acosté' }))
    expect(screen.getByLabelText('Te acostaste')).toBeDisabled()
    // Sin las dos horas no hay duración que decir: no se pinta ninguna cifra.
    expect(screen.queryByText(/^Dormiste /)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith({ bedTime: null, wakeTime: '05:00' })
  })

  it('con las dos sin dato no se guarda nada y se dice dentro', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = abrir()

    await user.click(screen.getByRole('button', { name: 'No sé a qué hora me acosté' }))
    await user.click(screen.getByRole('button', { name: 'No sé a qué hora me levanté' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('no hay nada que guardar')
  })

  // Criterio 263, la misma vara que Ajustes: una noche de cero minutos no es
  // una noche, y guardarla dejaría un «confirmado» con duración «—».
  it('con las dos horas iguales no guarda y lo dice, igual que Ajustes', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = abrir()

    await user.clear(screen.getByLabelText('Te levantaste'))
    await user.type(screen.getByLabelText('Te levantaste'), '23:00')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(VIDA_NIGHT_SAME_TIME_ERROR)
    // Y no se pinta ninguna cifra de una noche que no dura nada.
    expect(screen.queryByText(/^Dormiste /)).not.toBeInTheDocument()
  })

  // Criterio 298: corregir algo ya confirmado abre la hoja **con lo guardado**,
  // no con lo planeado.
  it('al corregir, lo que se prellena es lo guardado', () => {
    abrir({ log: { bedTime: '01:00', wakeTime: '06:40', confirmedAt: 'x' } })

    expect(screen.getByLabelText('Te acostaste')).toHaveValue('01:00')
    expect(screen.getByLabelText('Te levantaste')).toHaveValue('06:40')
  })

  it('una noche guardada con un lado sin dato vuelve a abrirse así', () => {
    abrir({ log: { bedTime: null, wakeTime: '06:40', confirmedAt: 'x' } })

    expect(screen.getByLabelText('Te acostaste')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'No sé a qué hora me acosté' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  // Criterio 299: se dice en pantalla que esto no viaja, igual que en FEAT-004.
  it('dice que se queda en este dispositivo', () => {
    abrir()

    expect(
      screen.getByText('Esto se queda en este dispositivo: no viaja a otro.'),
    ).toBeInTheDocument()
  })

  // Criterio 316, y el 292 en su mitad de fondo: no se pregunta ningún porqué.
  it('ni una palabra de reproche y ningún porqué', () => {
    abrir()
    const texto = (document.body.textContent ?? '').toLowerCase()

    for (const palabra of ['poco', 'mal', 'deberías', 'apenas', 'desperdicio', 'por qué']) {
      expect(texto).not.toContain(palabra)
    }
  })
})
