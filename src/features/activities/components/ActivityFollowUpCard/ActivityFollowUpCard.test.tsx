import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityFollowUpCard } from '@/features/activities/components/ActivityFollowUpCard'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

const followUp: ActivityFollowUp = {
  id: '1',
  activityId: 'a1',
  date: '2026-05-20',
  startTime: '09:00:00',
  durationMinutes: 120,
  endTime: '11:00:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T11:00:00',
  notes: 'Deep work',
  activity: {
    id: 'a1',
    title: 'Coding',
    category: { id: 'c1', name: 'Work', color: '#3366ff', icon: 'laptop' },
  },
}

describe('ActivityFollowUpCard', () => {
  it('timeline variant hides time meta grid', () => {
    const onClick = vi.fn()
    render(<ActivityFollowUpCard followUp={followUp} onClick={onClick} variant="timeline" />)
    expect(screen.queryByText(/^Inicio$/i)).not.toBeInTheDocument()
    expect(screen.getByText(/2 h/i)).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<ActivityFollowUpCard followUp={followUp} onClick={onClick} />)
    screen.getByRole('button', { name: /editar registro/i }).click()
    expect(onClick).toHaveBeenCalledWith(followUp)
  })

  it('shows bitácora icon and opens it without editing the registro', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onBitacoraClick = vi.fn()
    render(
      <ActivityFollowUpCard
        followUp={followUp}
        onClick={onClick}
        onBitacoraClick={onBitacoraClick}
        variant="timeline"
      />,
    )

    await user.click(screen.getByRole('button', { name: /ver bitácora/i }))
    expect(onBitacoraClick).toHaveBeenCalledWith(followUp)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('hides bitácora icon when there are no notes', () => {
    render(
      <ActivityFollowUpCard
        followUp={{ ...followUp, notes: null }}
        onClick={vi.fn()}
        onBitacoraClick={vi.fn()}
        variant="timeline"
      />,
    )
    expect(screen.queryByRole('button', { name: /ver bitácora/i })).not.toBeInTheDocument()
  })
})
