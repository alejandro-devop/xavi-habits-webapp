import { render, screen } from '@testing-library/react'
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
})
