import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityCategoryForm } from '@/features/activities/components/ActivityCategoryForm/ActivityCategoryForm'
import { emptyCategoryFormValues } from '@/features/activities/utils/activity-category-form'

describe('ActivityCategoryForm', () => {
  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <ActivityCategoryForm
        values={emptyCategoryFormValues()}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear"
      />,
    )

    await user.click(screen.getByRole('button', { name: /crear/i }))
    expect(screen.getByText(/nombre es obligatorio/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits when name is provided', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const values = { ...emptyCategoryFormValues(), name: 'Personal' }

    render(
      <ActivityCategoryForm
        values={values}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear"
      />,
    )

    await user.click(screen.getByRole('button', { name: /crear/i }))
    expect(onSubmit).toHaveBeenCalledWith(values)
  })
})
