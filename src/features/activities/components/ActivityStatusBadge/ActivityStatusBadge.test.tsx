import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityStatusBadge } from '@/features/activities/components/ActivityStatusBadge/ActivityStatusBadge'

describe('ActivityStatusBadge', () => {
  it('renders pending label', () => {
    render(<ActivityStatusBadge status="pending" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders completed label', () => {
    render(<ActivityStatusBadge status="completed" />)
    expect(screen.getByText('Completada')).toBeInTheDocument()
  })
})
