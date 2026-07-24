import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LearningNoteCard } from '@/features/learning/components/LearningNoteCard'
import type { LearningNote } from '@/features/learning/types/learning-note.types'

const note: LearningNote = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 1,
  title: 'PHP traits',
  contentMarkdown: '# Intro\n\nLos **traits** permiten reutilizar comportamiento en PHP.',
  tags: [{ id: '1', name: 'php', slug: 'php' }],
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T11:00:00.000Z',
}

describe('LearningNoteCard', () => {
  it('renders title, tag and plain snippet', () => {
    render(
      <MemoryRouter>
        <LearningNoteCard note={note} />
      </MemoryRouter>,
    )

    expect(screen.getByText('PHP traits')).toBeInTheDocument()
    expect(screen.getByText('php')).toBeInTheDocument()
    expect(screen.getByText(/traits permiten reutilizar/i)).toBeInTheDocument()
    expect(screen.queryByText('# Intro')).not.toBeInTheDocument()
  })
})
