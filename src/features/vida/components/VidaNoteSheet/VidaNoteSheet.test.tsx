import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaNoteSheet } from '@/features/vida/components/VidaNoteSheet'
import { renderWithProviders } from '@/test/render'

/**
 * El editor de la nota. Criterios 532, 533, 538, 539 y 540 de FEAT-018.
 *
 * No monta ninguna mutación: la hoja **no escribe**, recibe `onSave`. Por eso
 * aquí no hay `vi.mock` de hooks de datos, al revés que en `VidaLogSessionSheet`.
 */

function renderSheet(
  overrides: Partial<Parameters<typeof VidaNoteSheet>[0]> = {},
  onSave = vi.fn(async () => ({ ok: true })),
  onClose = vi.fn(),
) {
  renderWithProviders(
    <VidaNoteSheet
      open
      onClose={onClose}
      title="¿Qué hiciste?"
      subtitle="Trabajo en lululemon · 14:00"
      initialValue=""
      onSave={onSave}
      {...overrides}
    />,
  )
  return { onSave, onClose }
}

describe('VidaNoteSheet', () => {
  it('criterio 532 — la cabecera es la pregunta, no «nota» ni «descripción»', () => {
    renderSheet()

    expect(screen.getByRole('heading', { name: '¿Qué hiciste?' })).toBeInTheDocument()
    expect(screen.queryByText(/nota|descripci/i)).not.toBeInTheDocument()
  })

  it('criterio 538 — guardar manda el texto escrito y cierra', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = renderSheet()

    await user.type(screen.getByLabelText('¿Qué hiciste?'), '  Revisando MRs  ')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith('Revisando MRs')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('criterio 539 — «Volver» no guarda nada', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = renderSheet({ initialValue: 'Revisando MRs' })

    await user.type(screen.getByLabelText('¿Qué hiciste?'), ' y daily')
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('criterio 540 — guardar en blanco borra la nota: `onSave(null)`, sin error', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = renderSheet({ initialValue: 'Revisando MRs' })

    await user.clear(screen.getByLabelText('¿Qué hiciste?'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(null)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.queryByText('No pudimos guardarlo')).not.toBeInTheDocument()
  })

  it('criterio 533 — el contador dice cuánto cabe', async () => {
    const user = userEvent.setup()
    renderSheet()

    expect(screen.getByText('0 / 140')).toBeInTheDocument()
    await user.type(screen.getByLabelText('¿Qué hiciste?'), 'Revisando MRs')
    expect(screen.getByText('13 / 140')).toBeInTheDocument()
  })

  it('el fallo se lee dentro y **no** se pierde lo escrito', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(async () => ({ ok: false, message: 'No encontramos esa sesión.' }))
    const { onClose } = renderSheet({}, onSave)

    await user.type(screen.getByLabelText('¿Qué hiciste?'), 'Revisando MRs')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('No encontramos esa sesión.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('¿Qué hiciste?')).toHaveValue('Revisando MRs')
  })

  /**
   * El choque con las dos cajas de 2000 que ya existen. Unificarlas es decisión
   * del usuario y está fuera de alcance; lo que **no** puede pasar es que una
   * nota larga se trunque sola o se pierda al guardar sin querer.
   */
  it('una nota más larga que el tope se pinta entera, se dice, y se guarda entera', async () => {
    const user = userEvent.setup()
    const long = 'x'.repeat(420)
    const { onSave } = renderSheet({ initialValue: long })

    const field = screen.getByLabelText('¿Qué hiciste?')
    expect(field).toHaveValue(long)
    expect(screen.getByText('420 / 140')).toBeInTheDocument()
    expect(screen.getByText(/Cabe entera/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith(long)
  })

  it('sin píldoras no se pinta la sección de «lo de otras veces» (criterio 547)', () => {
    renderSheet()

    expect(screen.queryByRole('region', { name: 'Lo de otras veces' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Lo de otras veces')).not.toBeInTheDocument()
  })
})
