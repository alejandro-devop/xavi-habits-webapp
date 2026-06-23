import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { ActivityMonthSelector } from '@/features/activities/components/ActivityMonthSelector'

describe('ActivityMonthSelector', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all days of the month horizontally', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    render(
      <ActivityMonthSelector
        year={2026}
        month={5}
        selectedDate="2026-05-20"
        onSelect={vi.fn()}
        onMonthChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('group', { name: /mayo de 2026/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('20')
    expect(screen.getByRole('button', { name: /mes anterior/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mes siguiente/i })).toBeDisabled()
  })

  it('disables future days in the current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    const onSelect = vi.fn()
    render(
      <ActivityMonthSelector
        year={2026}
        month={5}
        selectedDate="2026-05-20"
        onSelect={onSelect}
        onMonthChange={vi.fn()}
      />,
    )

    const dayButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-pressed') !== null)

    const disabledDays = dayButtons.filter((btn) => (btn as HTMLButtonElement).disabled)
    expect(disabledDays.length).toBeGreaterThan(0)

    const enabledDay = dayButtons.find((btn) => !(btn as HTMLButtonElement).disabled)
    expect(enabledDay).toBeTruthy()
    fireEvent.click(enabledDay!)
    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onMonthChange when navigating months', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    const onMonthChange = vi.fn()
    render(
      <ActivityMonthSelector
        year={2026}
        month={5}
        selectedDate="2026-05-20"
        onSelect={vi.fn()}
        onMonthChange={onMonthChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /mes anterior/i }))
    expect(onMonthChange).toHaveBeenCalledWith(2026, 4)
  })
})
