import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaElapsed } from '@/features/vida/hooks/useVidaElapsed'
import { sessionStartInstant } from '@/features/vida/utils/vida-session.utils'

function Timer({ start }: { start: Date | null }) {
  const { label, minutes } = useVidaElapsed(start)
  return (
    <p>
      <span data-testid="label">{label}</span>
      <span data-testid="minutes">{minutes}</span>
    </p>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useVidaElapsed — el cronómetro de la sesión (criterios 3, 4 y 63)', () => {
  it('criterio 3 — montarse 40 min después del inicio marca 40:00, no 00:00', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 9, 40, 0))
    render(<Timer start={new Date(2026, 8, 18, 9, 0, 0)} />)

    // Cuenta desde el `startTime` de la sesión, no desde que se montó: es lo que
    // hace que **recargar la página no lo reinicie**.
    expect(screen.getByTestId('label')).toHaveTextContent('00:40:00')
    expect(screen.getByTestId('minutes')).toHaveTextContent('40')
  })

  it('criterio 4 — avanza al menos una vez por segundo', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 9, 0, 0))
    render(<Timer start={new Date(2026, 8, 18, 9, 0, 0)} />)

    expect(screen.getByTestId('label')).toHaveTextContent('00:00:00')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('label')).toHaveTextContent('00:00:01')
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByTestId('label')).toHaveTextContent('00:00:03')
  })

  it('criterio 3 — **no acumula tics**: volver de otra pestaña enseña el tiempo real', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 9, 0, 0))
    render(<Timer start={new Date(2026, 8, 18, 9, 0, 0)} />)

    // El navegador congela los intervalos de una pestaña en segundo plano: solo
    // se mueve el reloj. Un cronómetro que sumara tics marcaría un segundo.
    act(() => {
      vi.setSystemTime(new Date(2026, 8, 18, 9, 30, 0))
      vi.advanceTimersByTime(1000)
    })
    // Un cronómetro que sumara tics marcaría 00:00:01; este marca la media hora
    // real que pasó (más el segundo que avanzó el reloj falso).
    expect(screen.getByTestId('label')).toHaveTextContent('00:30:01')
  })

  it('criterio 4 — al desmontarse no deja ningún intervalo vivo', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 9, 0, 0))
    const antes = vi.getTimerCount()
    const { unmount } = render(<Timer start={new Date(2026, 8, 18, 9, 0, 0)} />)
    expect(vi.getTimerCount()).toBeGreaterThan(antes)

    unmount()
    expect(vi.getTimerCount()).toBe(antes)
  })

  it('sin sesión no tictaquea nada', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 9, 0, 0))
    const antes = vi.getTimerCount()
    render(<Timer start={null} />)

    expect(vi.getTimerCount()).toBe(antes)
    expect(screen.getByTestId('label')).toHaveTextContent('00:00:00')
  })

  it('criterio 63 — de 23:50 a las 00:10 marca 20 minutos, en positivo', () => {
    vi.setSystemTime(new Date(2026, 8, 19, 0, 10, 0))
    render(<Timer start={sessionStartInstant('2026-09-18', '23:50')} />)

    expect(screen.getByTestId('label')).toHaveTextContent('00:20:00')
    expect(screen.getByTestId('minutes')).toHaveTextContent('20')
  })
})
