import type { RouteObject } from 'react-router'
import { NotesPage } from '@/pages/app/NotesPage/NotesPage'

export const notesRoutes: RouteObject = {
  path: 'notes',
  element: <NotesPage />,
}
