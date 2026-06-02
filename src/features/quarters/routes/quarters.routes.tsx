import type { RouteObject } from 'react-router'
import { QuartersPage } from '@/pages/app/QuartersPage/QuartersPage'
import { ProjectsPage } from '@/pages/app/ProjectsPage/ProjectsPage'

export const quartersRoutes: RouteObject = {
  path: 'quarters',
  children: [
    {
      index: true,
      element: <QuartersPage />,
    },
  ],
}

export const projectsRoutes: RouteObject = {
  path: 'projects',
  element: <ProjectsPage />,
}
