import type { RouteObject } from 'react-router'
import { TodosPage } from '@/pages/app/TodosPage/TodosPage'

export const todosRoutes: RouteObject = {
  path: 'todos',
  element: <TodosPage />,
}
