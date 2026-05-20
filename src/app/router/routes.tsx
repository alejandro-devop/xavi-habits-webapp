import type { RouteObject } from 'react-router'
import { HomePage } from '@/pages/HomePage/HomePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
]
