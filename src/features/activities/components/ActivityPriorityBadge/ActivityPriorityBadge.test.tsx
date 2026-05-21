import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityPriorityBadge } from '@/features/activities/components/ActivityPriorityBadge/ActivityPriorityBadge'

describe('ActivityPriorityBadge', () => {
  it('renders urgent label', () => {
    render(<ActivityPriorityBadge priority="urgent" />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('renders low label', () => {
    render(<ActivityPriorityBadge priority="low" />)
    expect(screen.getByText('Baja')).toBeInTheDocument()
  })
})
