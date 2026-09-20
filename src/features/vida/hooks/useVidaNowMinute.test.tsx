import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'

/** Criterio 12: el número se actualiza solo **al menos una vez por minuto**. */
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useVidaNowMinute', () => {
  it('parte de la hora actual en minutos y con su etiqueta', () => {
    const { result } = renderHook(() => useVidaNowMinute(true))

    expect(result.current.minutes).toBe(9 * 60 + 24)
    expect(result.current.label).toBe('9:24')
  })

  it('avanza solo al pasar un minuto, sin recargar', () => {
    const { result } = renderHook(() => useVidaNowMinute(true))

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.label).toBe('9:25')
  })

  it('no tictaquea ni da hora cuando el día mostrado no es hoy (criterio 33)', () => {
    const { result } = renderHook(() => useVidaNowMinute(false))

    expect(result.current.minutes).toBeNull()
    expect(result.current.label).toBeNull()
    // Y no deja ningún temporizador vivo.
    expect(vi.getTimerCount()).toBe(0)
  })
})
