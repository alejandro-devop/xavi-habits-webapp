import type { RouteObject } from 'react-router'
import { ActivitiesModuleLayout } from '@/features/activities/components/ActivitiesModuleLayout'
import { ActivityCategoriesPage } from '@/features/activities/pages/ActivityCategoriesPage'
import { ActivitiesModulePage } from '@/features/activities/pages/ActivitiesModulePage'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'

export const activitiesRoutes: RouteObject = {
  path: 'activities',
  element: <ActivitiesModuleLayout />,
  children: [
    {
      index: true,
      element: <ActivitiesModulePage />,
    },
    {
      path: 'categories',
      element: <ActivityCategoriesPage />,
    },
  ],
}

export { activitiesPaths }
