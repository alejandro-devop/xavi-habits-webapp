import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryTimeWidget } from '@/features/activities/components/CategoryTimeWidget'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

const followUp: ActivityFollowUp = {
  id: '1',
  activityId: 'a',
  date: '2026-05-20',
  startTime: '09:00:00',
  durationMinutes: 90,
  endTime: '10:30:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T10:30:00',
  notes: null,
  activity: {
    id: 'a',
    title: 'Deep work',
    category: { id: 'work', name: 'Trabajo', color: '#3366ff', icon: 'laptop' },
  },
}

describe('CategoryTimeWidget', () => {
  it('renders hours per category and total', () => {
    render(
      <CategoryTimeWidget
        date="2026-05-20"
        followUps={[followUp]}
      />,
    )

    expect(screen.getByText('Tiempo por categoría')).toBeInTheDocument()
    expect(screen.getByText('Total registrado')).toBeInTheDocument()
    expect(screen.getAllByText('1.5 h')).toHaveLength(2)
    expect(screen.getByText('Trabajo')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows empty state when there are no follow-ups', () => {
    render(<CategoryTimeWidget date="2026-05-20" followUps={[]} />)

    expect(screen.getByText('Sin registros este día')).toBeInTheDocument()
    expect(screen.getByText('0 h')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading', () => {
    render(
      <CategoryTimeWidget
        date="2026-05-20"
        followUps={[]}
        isLoading
      />,
    )

    expect(screen.getByLabelText(/Cargando tiempo por categoría/i)).toBeInTheDocument()
  })
})
