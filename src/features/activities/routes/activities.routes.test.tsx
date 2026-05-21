import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/features/theme'
import { activitiesRoutes } from '@/features/activities/routes/activities.routes'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import { ToastProvider } from '@/shared/ui/Toast'

function renderActivitiesRoute(initialEntry: string) {
  const router = createMemoryRouter([activitiesRoutes], { initialEntries: [initialEntry] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <RouterProvider router={router} />
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

vi.mock('@/features/activities/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateActivityCategoryMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateActivityCategoryMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteActivityCategoryMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
}))

describe('activitiesRoutes', () => {
  it('renders overview at module root', () => {
    renderActivitiesRoute('/activities')
    expect(screen.getByText(/lista de actividades/i)).toBeInTheDocument()
  })

  it('renders categories panel at internal categories route', () => {
    renderActivitiesRoute('/activities/categories')
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toBeInTheDocument()
  })
})
