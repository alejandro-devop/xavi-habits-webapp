import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HabitPurposeBanner } from '@/features/habits/components/HabitPurposeBanner'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import { renderWithProviders } from '@/test/render'

const purpose: HabitPurpose = {
  id: 'p1',
  userId: 1,
  name: 'Alguien sereno',
  description: 'Ganado el 2026-08-12 · racha7 · 7 días seguidos',
  icon: 'spa',
  placement: 'want',
  orderIndex: 0,
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
}

describe('HabitPurposeBanner — la regla innegociable', () => {
  it('enseña la identidad al lograr', () => {
    renderWithProviders(
      <HabitPurposeBanner purpose={purpose} status="accomplished" days={34} lifelinesRemaining={1} />,
    )
    expect(screen.getByText('Un día más siendo alguien sereno.')).toBeInTheDocument()
  })

  it('la enseña en tono neutro al empezar el día', () => {
    renderWithProviders(
      <HabitPurposeBanner purpose={purpose} status="empty" days={34} lifelinesRemaining={1} />,
    )
    expect(screen.getByText('Hoy, alguien sereno.')).toBeInTheDocument()
  })

  it('no deja escapar nada de identidad en un día fallado', () => {
    renderWithProviders(
      <HabitPurposeBanner purpose={purpose} status="failed" days={34} lifelinesRemaining={1} />,
    )
    expect(screen.queryByText(/sereno/i)).not.toBeInTheDocument()
    expect(
      screen.getByText('Un mal día no borra 34. Te queda 1 salvavidas esta semana.'),
    ).toBeInTheDocument()
  })

  it('tampoco con el salvavidas gastado', () => {
    renderWithProviders(
      <HabitPurposeBanner purpose={purpose} status="lifeline" days={34} lifelinesRemaining={0} />,
    )
    expect(screen.queryByText(/sereno/i)).not.toBeInTheDocument()
    expect(
      screen.getByText('Un mal día no borra 34. No te quedan salvavidas esta semana.'),
    ).toBeInTheDocument()
  })

  it('sin propósito no dice nada mientras el día siga abierto', () => {
    const { container } = renderWithProviders(
      <HabitPurposeBanner purpose={null} status="accomplished" days={3} lifelinesRemaining={2} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
