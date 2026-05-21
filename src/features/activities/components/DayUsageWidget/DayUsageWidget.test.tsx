import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { DayUsageWidget } from '@/features/activities/components/DayUsageWidget'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'

const followUp: ActivityFollowUp = {
  id: '1',
  activityId: 'a',
  date: '2026-05-20',
  startTime: '09:00:00',
  durationMinutes: 150,
  endTime: '11:30:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T11:30:00',
  notes: null,
}

const freeSlot: TimelineFreeSlot = {
  id: 'free-1',
  date: '2026-05-20',
  startTime: '11:30:00',
  endTime: '12:15:00',
  durationMinutes: 45,
}

describe('DayUsageWidget', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders used, free detected and waste', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 23, 0, 0))

    render(
      <DayUsageWidget
        date="2026-05-20"
        followUps={[followUp]}
        freeSlots={[freeSlot]}
      />,
    )

    expect(screen.getByText('Aprovechado')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
    expect(screen.getByText('Libre detectado')).toBeInTheDocument()
    expect(screen.getByText('45m')).toBeInTheDocument()
    expect(screen.getByText('Desperdicio')).toBeInTheDocument()
    expect(screen.getByText(/tiempo sin registrar desde el cierre del día anterior/i)).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading', () => {
    render(
      <DayUsageWidget
        date="2026-05-20"
        followUps={[]}
        freeSlots={[]}
        isLoading
      />,
    )

    expect(screen.getByLabelText(/Cargando aprovechamiento del día/i)).toBeInTheDocument()
  })
})
