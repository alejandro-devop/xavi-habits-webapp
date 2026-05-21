import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { ActivityWeekSelector } from '@/features/activities/components/ActivityWeekSelector'
import { getWeekDaysForDate } from '@/features/activities/utils/activity-time.utils'

describe('ActivityWeekSelector', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables future days in the current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00')) // Wednesday

    const days = getWeekDaysForDate(new Date(), '2026-05-20')
    const onSelect = vi.fn()

    render(<ActivityWeekSelector days={days} onSelect={onSelect} />)

    const disabledButtons = screen.getAllByRole('button', { hidden: false }).filter(
      (btn) => (btn as HTMLButtonElement).disabled,
    )
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  it('calls onSelect when clicking a selectable day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    const days = getWeekDaysForDate(new Date(), '2026-05-20')
    const onSelect = vi.fn()

    render(<ActivityWeekSelector days={days} onSelect={onSelect} />)

    const monday = days[0]!
    const enabledButton = screen
      .getAllByRole('button')
      .find((btn) => !(btn as HTMLButtonElement).disabled && btn.textContent?.includes(String(monday.dayNumber)))

    expect(enabledButton).toBeTruthy()
    fireEvent.click(enabledButton!)
    expect(onSelect).toHaveBeenCalledWith(monday.date)
  })
})
