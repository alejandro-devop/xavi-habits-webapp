import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityDayTimeline } from '@/features/activities/components/ActivityDayTimeline'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

const base: ActivityFollowUp = {
  id: '1',
  activityId: 'a1',
  date: '2026-05-20',
  startTime: '11:30:00',
  durationMinutes: 30,
  endTime: '12:00:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T12:00:00',
  notes: null,
  activity: {
    id: 'a1',
    title: 'Coding',
    category: { id: 'c1', name: 'Work', color: '#3366ff', icon: 'book' },
  },
}

describe('ActivityDayTimeline', () => {
  it('renders events with most recent first', () => {
    const early: ActivityFollowUp = {
      ...base,
      id: 'early',
      startTime: '09:00:00',
      endTime: '10:00:00',
      durationMinutes: 60,
    }
    const late: ActivityFollowUp = {
      ...base,
      id: 'late',
      startTime: '10:03:00',
      endTime: '10:33:00',
      durationMinutes: 30,
    }

    render(
      <ActivityDayTimeline
        date="2026-05-20"
        followUps={[late, early]}
        onFollowUpClick={vi.fn()}
        onFreeSlotClick={vi.fn()}
      />,
    )

    const entries = screen.getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent('10:03')
    expect(entries[1]).toHaveTextContent('09:00')
  })

  it('renders free slot between contiguous gaps', () => {
    const a: ActivityFollowUp = {
      ...base,
      id: 'a',
      startTime: '10:00:00',
      endTime: '10:30:00',
      durationMinutes: 30,
    }
    const b: ActivityFollowUp = {
      ...base,
      id: 'b',
      startTime: '11:00:00',
      endTime: '12:00:00',
      durationMinutes: 60,
    }

    render(
      <ActivityDayTimeline
        date="2026-05-20"
        followUps={[a, b]}
        onFollowUpClick={vi.fn()}
        onFreeSlotClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /espacio libre de 10:30 a 11:00/i })).toBeInTheDocument()
  })

  it('calls onFreeSlotClick when free slot is clicked', async () => {
    const user = userEvent.setup()
    const onFreeSlotClick = vi.fn()
    const a: ActivityFollowUp = {
      ...base,
      id: 'a',
      startTime: '10:00:00',
      endTime: '10:30:00',
      durationMinutes: 30,
    }
    const b: ActivityFollowUp = {
      ...base,
      id: 'b',
      startTime: '11:00:00',
      endTime: '12:00:00',
      durationMinutes: 60,
    }

    render(
      <ActivityDayTimeline
        date="2026-05-20"
        followUps={[a, b]}
        onFollowUpClick={vi.fn()}
        onFreeSlotClick={onFreeSlotClick}
      />,
    )

    await user.click(screen.getByRole('button', { name: /espacio libre/i }))
    expect(onFreeSlotClick).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-05-20',
        startTime: '10:30:00',
        endTime: '11:00:00',
        durationMinutes: 30,
      }),
    )
  })

  it('shows quick actions only on most recent follow-up', async () => {
    const user = userEvent.setup()
    const onContinueAfterFollowUp = vi.fn()
    const onStartFromFollowUp = vi.fn()
    const early: ActivityFollowUp = {
      ...base,
      id: 'early',
      startTime: '09:00:00',
      endTime: '10:00:00',
      durationMinutes: 60,
    }
    const late: ActivityFollowUp = {
      ...base,
      id: 'late',
      startTime: '11:00:00',
      endTime: '11:30:00',
      durationMinutes: 30,
    }

    render(
      <ActivityDayTimeline
        date="2026-05-20"
        followUps={[late, early]}
        onFollowUpClick={vi.fn()}
        onFreeSlotClick={vi.fn()}
        onContinueAfterFollowUp={onContinueAfterFollowUp}
        onStartFromFollowUp={onStartFromFollowUp}
      />,
    )

    expect(screen.getAllByRole('button', { name: /iniciar actividad desde las/i })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /registrar actividad desde las/i })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /iniciar actividad desde las 11:30/i }))
    expect(onStartFromFollowUp).toHaveBeenCalledWith(expect.objectContaining({ id: 'late' }))

    await user.click(screen.getByRole('button', { name: /registrar actividad desde las 11:30/i }))
    expect(onContinueAfterFollowUp).toHaveBeenCalledWith(expect.objectContaining({ id: 'late' }))
  })
})
