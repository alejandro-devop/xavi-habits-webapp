import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/features/theme'
import { activitiesRoutes } from '@/features/activities/routes/activities.routes'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import { ToastProvider } from '@/shared/ui/Toast'

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

vi.mock('@/features/activities/hooks/useActivityFollowUps', () => ({
  useActivityDayFollowUpsQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useActivityFollowUpsInDatesQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useCreateActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/activities/store/activity-tracking.store', () => ({
  useActivityTrackingStore: (selector: (s: { session: null }) => unknown) =>
    selector({ session: null }),
  selectRunningSession: () => null,
}))

vi.mock('@/features/activities/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities: [], page: 1, limit: 50, total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useActivityQuery: () => ({ data: null, isLoading: false, isError: true }),
  useCreateActivityMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateActivityMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteActivityMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
  useCompleteActivityMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
}))

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

describe('activitiesRoutes', () => {
  it('renders activities list at module root', () => {
    renderActivitiesRoute('/activities')
    expect(screen.getByText(/tus actividades/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /nueva actividad/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders categories panel at categories route', () => {
    renderActivitiesRoute('/activities/categories')
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toBeInTheDocument()
  })

  it('renders tracking page at tracking route', () => {
    renderActivitiesRoute('/activities/tracking')
    expect(screen.getByRole('heading', { name: /seguimiento de tiempo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /iniciar nueva actividad/i }).length).toBeGreaterThanOrEqual(1)
  })
})
