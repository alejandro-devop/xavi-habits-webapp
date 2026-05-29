import type { RouteObject } from 'react-router'
import { Outlet } from 'react-router'
import { TodosPage } from '@/pages/app/TodosPage/TodosPage'
import { TodosSettingsPage } from '@/pages/app/TodosSettingsPage/TodosSettingsPage'

export const todosRoutes: RouteObject = {
  path: 'todos',
  element: <Outlet />,
  children: [
    { index: true, element: <TodosPage /> },
    { path: 'settings', element: <TodosSettingsPage /> },
  ],
}
