import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityForm } from '@/features/activities/components/ActivityForm/ActivityForm'
import { emptyActivityFormValues } from '@/features/activities/utils/activity-form'

const categories = [
  {
    id: 'cat-1',
    userId: 1,
    orderIndex: 0,
    name: 'Trabajo',
    description: null,
    icon: 'bell',
    color: '#6366f1',
  },
]

describe('ActivityForm', () => {
  it('shows validation error when title is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <ActivityForm
        values={emptyActivityFormValues()}
        categories={categories}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear"
      />,
    )

    await user.click(screen.getByRole('button', { name: /crear/i }))
    expect(screen.getByText(/título es obligatorio/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
