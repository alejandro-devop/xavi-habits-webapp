import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VidaEndTimeLine } from './VidaEndTimeLine'

/**
 * La línea **como se lee**, no como la concatena `textContent`: cada trozo de
 * texto va en su elemento —la flecha, la frase, la hora en negrita, el matiz de
 * la medianoche— y visualmente están separados por el `gap` o por un salto de
 * línea, así que aquí se juntan con un espacio.
 */
function lineText(): string {
  const root = document.getElementById('end')
  if (!root) return ''
  const parts: string[] = []
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) parts.push(text)
      return
    }
    node.childNodes.forEach(walk)
  }
  walk(root)
  return parts.join(' ')
}

describe('VidaEndTimeLine (FEAT-008, tajada 2)', () => {
  it('con hora y duración dice a qué hora acaba (criterio 119)', () => {
    render(<VidaEndTimeLine id="end" startTime="19:00" durationMinutes={80} />)

    expect(lineText()).toBe('→ Acaba a las 20:20')
    // La hora va resaltada, que es lo que dibuja el render aprobado.
    expect(screen.getByText('20:20').tagName).toBe('B')
  })

  it('se recalcula sobre el total de verdad, sin normalizar (criterio 121)', () => {
    // 90 minutos escritos a mano son 1 h 30, no 90 h ni 30 min.
    const { rerender } = render(<VidaEndTimeLine id="end" startTime="19:00" durationMinutes={90} />)
    expect(lineText()).toBe('→ Acaba a las 20:30')

    rerender(<VidaEndTimeLine id="end" startTime="19:00" durationMinutes={30} />)
    expect(lineText()).toBe('→ Acaba a las 19:30')
  })

  it('sin duración no pinta nada, y el contenedor no ocupa (criterio 122)', () => {
    render(<VidaEndTimeLine id="end" startTime="19:00" durationMinutes={null} />)

    expect(lineText()).toBe('')
    expect(document.getElementById('end')?.children).toHaveLength(0)
    expect(screen.queryByText(/Acaba a las/)).not.toBeInTheDocument()
  })

  it('sin hora de inicio dice qué falta y no cuenta desde medianoche (criterio 122)', () => {
    render(<VidaEndTimeLine id="end" startTime={null} durationMinutes={80} />)

    expect(lineText()).toBe('→ Ponle hora y te digo a qué hora acaba')
    expect(screen.queryByText(/1:20/)).not.toBeInTheDocument()
  })

  it('cruzando medianoche lo dice entero, con lo que Hoy hará (criterio 123)', () => {
    render(<VidaEndTimeLine id="end" startTime="23:30" durationMinutes={80} />)

    expect(lineText()).toBe(
      '→ Acaba a las 0:50 ya del día siguiente Hoy lo cortará a las 23:59 al armar el día.',
    )
    // Y `23:59` nunca aparece como el fin elegido: el fin es 0:50.
    expect(screen.getByText('0:50').tagName).toBe('B')
  })

  it('se anuncia como estado, sin reproche y sin alarma (criterios 128 y 132)', () => {
    render(<VidaEndTimeLine id="end" startTime="23:30" durationMinutes={80} />)

    const root = document.getElementById('end')
    expect(root).toHaveAttribute('aria-live', 'polite')
    // El `id` es el que enlazan los campos por `aria-describedby`.
    expect(root).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(lineText()).not.toMatch(/error|inválid|no puedes|fall/i)
  })

  it('el contenedor está en el DOM aunque no haya nada que decir (criterio 128)', () => {
    // La región viva no se inserta de golpe: existe desde el principio para que
    // el `aria-describedby` de los campos apunte siempre a algo.
    render(<VidaEndTimeLine id="end" startTime={null} durationMinutes={null} />)

    expect(document.getElementById('end')).toHaveAttribute('aria-live', 'polite')
  })
})
