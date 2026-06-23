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
  useActivityOpenFollowUpQuery: () => ({ data: null, isLoading: false }),
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
  useStartActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteActivityFollowUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
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

vi.mock('@/features/weekly-routine/hooks/useCurrentRoutineEventSuggestion', () => ({
  useCurrentRoutineEventSuggestion: () => null,
}))

vi.mock('@/features/weekly-routine/hooks/useUpcomingRoutineEventSuggestion', () => ({
  useUpcomingRoutineEventSuggestion: () => null,
}))

vi.mock('@/features/todos/hooks/useTodos', () => ({
  useCompleteTodoMutation: () => ({ mutate: vi.fn(), isPending: false }),
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
  it('redirects module root to tracking', () => {
    renderActivitiesRoute('/activities')
    expect(screen.getAllByRole('button', { name: /iniciar nueva actividad/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders activities list at list route', () => {
    renderActivitiesRoute('/activities/list')
    expect(screen.getByText(/tus actividades/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /nueva actividad/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders categories panel at categories route', () => {
    renderActivitiesRoute('/activities/categories')
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toBeInTheDocument()
  })

  it('renders tracking page at tracking route', () => {
    renderActivitiesRoute('/activities/tracking')
    expect(screen.getByRole('navigation', { name: /secciones de actividades/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /iniciar nueva actividad/i }).length).toBeGreaterThanOrEqual(1)
  })
})
