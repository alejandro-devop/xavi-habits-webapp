import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ActivityCategoriesPanel } from '@/features/activities/components/ActivityCategoriesPanel/ActivityCategoriesPanel'
import { renderWithProviders } from '@/test/render'

const mockCategories = [
  {
    id: '0194a1b2-c3d4-7000-8000-000000000001',
    userId: 1,
    orderIndex: 0,
    name: 'Trabajo',
    description: 'Tareas laborales',
    icon: 'bell',
    color: '#6366f1',
  },
]

const useActivityCategoriesQuery = vi.fn()
const useCreateActivityCategoryMutation = vi.fn()
const useUpdateActivityCategoryMutation = vi.fn()
const useDeleteActivityCategoryMutation = vi.fn()
const confirmMock = vi.fn()

vi.mock('@/features/activities/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => useActivityCategoriesQuery(),
  useCreateActivityCategoryMutation: () => useCreateActivityCategoryMutation(),
  useUpdateActivityCategoryMutation: () => useUpdateActivityCategoryMutation(),
  useDeleteActivityCategoryMutation: () => useDeleteActivityCategoryMutation(),
}))

vi.mock('@/shared/ui/ConfirmDialog', async () => {
  const actual = await vi.importActual('@/shared/ui/ConfirmDialog')
  return {
    ...actual,
    useConfirmDialog: () => ({ confirm: confirmMock }),
  }
})

describe('ActivityCategoriesPanel', () => {
  const mutateDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    confirmMock.mockResolvedValue(true)
    useActivityCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    useCreateActivityCategoryMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    useUpdateActivityCategoryMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    useDeleteActivityCategoryMutation.mockReturnValue({
      mutate: mutateDelete,
      isPending: false,
      variables: undefined,
    })
  })

  it('renders category list', () => {
    renderWithProviders(<ActivityCategoriesPanel />)
    expect(screen.getByText('Trabajo')).toBeInTheDocument()
    expect(screen.getByText(/tareas laborales/i)).toBeInTheDocument()
  })

  it('calls delete mutation after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActivityCategoriesPanel />)

    await user.click(screen.getByRole('button', { name: /eliminar/i }))
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Eliminar categoría',
        variant: 'danger',
      }),
    )
    await waitFor(() => {
      expect(mutateDelete).toHaveBeenCalledWith(mockCategories[0].id)
    })
  })
})
