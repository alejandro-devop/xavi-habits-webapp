import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppIdeaCard } from '@/features/app-ideas/components/AppIdeaCard'
import type { AppIdea } from '@/features/app-ideas/types/app-idea.types'

const idea: AppIdea = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 1,
  title: 'Habit companion',
  contentMarkdown: '# Idea\n\nUna app para **hábitos** diarios.',
  status: 'exploring',
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T11:00:00.000Z',
}

describe('AppIdeaCard', () => {
  it('renders title, status and plain snippet', () => {
    render(
      <MemoryRouter>
        <AppIdeaCard idea={idea} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Habit companion')).toBeInTheDocument()
    expect(screen.getByText('Explorando')).toBeInTheDocument()
    expect(screen.getByText(/app para hábitos diarios/i)).toBeInTheDocument()
    expect(screen.queryByText('# Idea')).not.toBeInTheDocument()
  })
})
