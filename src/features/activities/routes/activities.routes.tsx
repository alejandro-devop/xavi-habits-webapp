import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { ActivitiesModuleLayout } from '@/features/activities/components/ActivitiesModuleLayout'
import { ActivityCategoriesPage } from '@/features/activities/pages/ActivityCategoriesPage'
import { ActivityCreatePage } from '@/features/activities/pages/ActivityCreatePage'
import { ActivityDetailPage } from '@/features/activities/pages/ActivityDetailPage'
import { ActivityEditPage } from '@/features/activities/pages/ActivityEditPage'
import { ActivitiesListPage } from '@/features/activities/pages/ActivitiesListPage'
import { ActivityTrackingPage } from '@/features/activities/pages/ActivityTrackingPage'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'

export const activitiesRoutes: RouteObject = {
  path: 'activities',
  element: <ActivitiesModuleLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="tracking" replace />,
    },
    {
      path: 'list',
      element: <ActivitiesListPage />,
    },
    {
      path: 'categories',
      element: <ActivityCategoriesPage />,
    },
    {
      path: 'tracking',
      element: <ActivityTrackingPage />,
    },
    {
      path: 'new',
      element: <ActivityCreatePage />,
    },
    {
      path: ':id/edit',
      element: <ActivityEditPage />,
    },
    {
      path: ':id',
      element: <ActivityDetailPage />,
    },
  ],
}

export { activitiesPaths }
