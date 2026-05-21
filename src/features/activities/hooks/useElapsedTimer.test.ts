import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'

describe('useElapsedTimer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates elapsed time from Date.now() - startedAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T10:00:05.000Z'))

    const startedAt = '2026-05-20T10:00:00.000Z'
    const { result } = renderHook(() => useElapsedTimer(startedAt))

    expect(result.current).toBe('00:00:05')

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current).toBe('00:00:07')
  })

  it('returns zeros when startedAt is null', () => {
    const { result } = renderHook(() => useElapsedTimer(null))
    expect(result.current).toBe('00:00:00')
  })
})
