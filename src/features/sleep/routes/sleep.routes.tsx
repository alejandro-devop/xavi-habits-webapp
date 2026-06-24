import type { RouteObject } from 'react-router'
import { SleepPage } from '@/features/sleep/pages/SleepPage'

export const sleepRoutes: RouteObject = {
  path: 'sleep',
  element: <SleepPage />,
}
