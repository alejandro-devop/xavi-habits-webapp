import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VidaActivityCard } from '@/features/vida/components/VidaActivityCard'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Organizar la casa',
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId: 'casa',
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const vidaItem: VidaItem = {
  id: 'v1',
  userId: 1,
  activityId: 'a1',
  days: ['monday', 'wednesday', 'friday'],
  notes: null,
  isActive: true,
  orderIndex: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderCard(props: Partial<Parameters<typeof VidaActivityCard>[0]> = {}) {
  return renderWithProviders(
    <VidaActivityCard
      activity={buildActivity()}
      icon="house-chimney"
      color="#8b5cf6"
      {...props}
    />,
  )
}

describe('VidaActivityCard', () => {
  it('pinta siete casillas L M X J V S D y marca las del VidaItem activo', () => {
    const { container } = renderCard({ vidaItem })

    const boxes = [...container.querySelectorAll('[data-day]')]
    expect(boxes.map((box) => box.textContent)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
    expect(boxes.filter((box) => box.getAttribute('data-on') === 'true').map((b) => b.textContent))
      .toEqual(['L', 'X', 'V'])
    expect(
      screen.getByLabelText('En tu plantilla: lunes, miércoles y viernes'),
    ).toBeInTheDocument()
  })

  it('sin VidaItem activo lee «sin plantilla» y no pinta ninguna casilla', () => {
    const { container } = renderCard({ vidaItem: null })

    expect(screen.getByText('sin plantilla')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-day]')).toHaveLength(0)
  })

  it('lleva el color de la categoría al fondo del icono', () => {
    const { container } = renderCard()

    const card = container.querySelector('article')
    expect(card?.getAttribute('style')).toContain('--vida-category-color: #8b5cf6')
  })

  it('no rompe con un nombre de sesenta caracteres', () => {
    const longTitle = 'Organizar la casa entera de arriba abajo un sábado cualquiera'
    expect(longTitle.length).toBeGreaterThanOrEqual(60)
    renderCard({ activity: buildActivity({ title: longTitle }) })

    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })

  it('no dice ni una palabra de culpa ni de gestión de proyectos', () => {
    const { container } = renderCard({ vidaItem: null })
    const text = container.textContent ?? ''

    for (const word of ['pendiente', 'prioridad', 'vencida', 'fallaste', 'cancelada']) {
      expect(text.toLowerCase()).not.toContain(word)
    }
  })
})
