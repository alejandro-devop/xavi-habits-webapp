import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { DayRemainingWidget } from '@/features/activities/components/DayRemainingWidget'

describe('DayRemainingWidget', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders countdown before day end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 20, 0, 0))

    render(<DayRemainingWidget />)

    expect(screen.getByText('Tiempo restante del día')).toBeInTheDocument()
    expect(screen.getByText('03:00:00')).toBeInTheDocument()
    expect(screen.getByText(/Finaliza a las 11:00 PM/i)).toBeInTheDocument()
  })

  it('renders 00:00:00 after day end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 23, 30, 0))

    render(<DayRemainingWidget />)

    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })
})
