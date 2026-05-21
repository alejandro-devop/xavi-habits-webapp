import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityDayTimeline } from '@/features/activities/components/ActivityDayTimeline'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

const followUp: ActivityFollowUp = {
  id: '1',
  activityId: 'a1',
  date: '2026-05-20',
  startTime: '11:30:00',
  durationMinutes: 30,
  endTime: '12:00:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T12:00:00',
  notes: 'Deep work',
  activity: {
    id: 'a1',
    title: 'Coding',
    category: { id: 'c1', name: 'Work', color: '#3366ff', icon: 'book' },
  },
}

describe('ActivityDayTimeline', () => {
  it('renders events in chronological order with times on the left', () => {
    const early: ActivityFollowUp = { ...followUp, id: 'early', startTime: '09:00:00', endTime: '10:00:00' }
    const late: ActivityFollowUp = { ...followUp, id: 'late', startTime: '14:00:00', endTime: '15:00:00' }

    render(
      <ActivityDayTimeline
        followUps={[late, early]}
        onFollowUpClick={vi.fn()}
      />,
    )

    const entries = screen.getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent('09:00')
    expect(entries[1]).toHaveTextContent('14:00')
    expect(screen.getAllByText('Coding')).toHaveLength(2)
  })
})
