import type { RouteObject } from 'react-router'
import { LearningModuleLayout } from '@/features/learning/components/LearningModuleLayout'
import { LearningPage } from '@/pages/app/LearningPage/LearningPage'
import { LearningNoteEditorPage } from '@/pages/app/LearningNoteEditorPage/LearningNoteEditorPage'

export const learningRoutes: RouteObject = {
  path: 'learning',
  element: <LearningModuleLayout />,
  children: [
    {
      index: true,
      element: <LearningPage />,
    },
    {
      path: 'new',
      element: <LearningNoteEditorPage mode="create" />,
    },
    {
      path: ':noteId',
      element: <LearningNoteEditorPage mode="edit" />,
    },
  ],
}
