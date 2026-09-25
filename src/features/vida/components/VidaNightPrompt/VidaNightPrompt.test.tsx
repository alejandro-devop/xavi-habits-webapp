import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaNightPrompt } from './VidaNightPrompt'

/**
 * **La pregunta de la mañana** (FEAT-012, tajada 3). Criterios 288, 290 y 316.
 *
 * Lo que se prueba aquí es que **confirmar cuesta un toque** y que la pregunta
 * no juzga nada. Cuándo se pinta y cuándo deja de pintarse es de la página, y
 * se prueba en `VidaHoyPage.test.tsx` (criterio 289).
 */
const NIGHT = { bedTime: '23:00', wakeTime: '05:00', days: ['thursday'] } as const

describe('VidaNightPrompt (criterios 288 y 290)', () => {
  it('pregunta por la noche planeada, con sus dos horas y su línea', () => {
    render(<VidaNightPrompt night={{ ...NIGHT }} onConfirm={vi.fn()} onDifferent={vi.fn()} />)

    expect(screen.getByText('¿Dormiste 23:00 → 5:00?')).toBeInTheDocument()
    expect(
      screen.getByText('Es tu noche de siempre. Si fue así, un toque y listo.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sí, así fue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fue distinto' })).toBeInTheDocument()
  })

  // Criterio 290: **un toque**. Ni un diálogo de confirmación, ni un segundo
  // paso, ni una navegación: una llamada y se acabó.
  it('«Sí, así fue» es un solo toque y una sola llamada', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onDifferent = vi.fn()
    render(<VidaNightPrompt night={{ ...NIGHT }} onConfirm={onConfirm} onDifferent={onDifferent} />)

    await user.click(screen.getByRole('button', { name: 'Sí, así fue' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onDifferent) .not.toHaveBeenCalled()
  })

  it('«Fue distinto» abre la hoja y **no guarda nada** por su cuenta (291)', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onDifferent = vi.fn()
    render(<VidaNightPrompt night={{ ...NIGHT }} onConfirm={onConfirm} onDifferent={onDifferent} />)

    await user.click(screen.getByRole('button', { name: 'Fue distinto' }))

    expect(onDifferent).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // La pregunta son **dos salidas y ninguna más**: no hay «Ahora no» porque
  // ignorarla ya es gratis (criterio 295) y un tercer botón sería un clic más
  // para no hacer nada.
  it('son dos botones y ninguno más', () => {
    render(<VidaNightPrompt night={{ ...NIGHT }} onConfirm={vi.fn()} onDifferent={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  // Criterio 316: ni una palabra de reproche, y ninguna cifra de juicio.
  it('no hay ni una palabra de reproche', () => {
    const { container } = render(
      <VidaNightPrompt night={{ ...NIGHT }} onConfirm={vi.fn()} onDifferent={vi.fn()} />,
    )
    const texto = (container.textContent ?? '').toLowerCase()

    for (const palabra of ['poco', 'mal', 'deberías', 'apenas', 'desperdicio', 'tarde', 'por qué']) {
      expect(texto).not.toContain(palabra)
    }
  })
})
