import type { RouteObject } from 'react-router'
import { AppIdeasModuleLayout } from '@/features/app-ideas/components/AppIdeasModuleLayout'
import { AppIdeasPage } from '@/pages/app/AppIdeasPage/AppIdeasPage'
import { AppIdeaEditorPage } from '@/pages/app/AppIdeaEditorPage/AppIdeaEditorPage'

export const appIdeasRoutes: RouteObject = {
  path: 'ideas',
  element: <AppIdeasModuleLayout />,
  children: [
    {
      index: true,
      element: <AppIdeasPage />,
    },
    {
      path: 'new',
      element: <AppIdeaEditorPage mode="create" />,
    },
    {
      path: ':ideaId',
      element: <AppIdeaEditorPage mode="edit" />,
    },
  ],
}
