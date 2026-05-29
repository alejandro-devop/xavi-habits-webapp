import type { RouteObject } from 'react-router'
import { WeeklyRoutinePage } from '@/features/weekly-routine/pages/WeeklyRoutinePage/WeeklyRoutinePage'
import { WeeklyRoutineDetailPage } from '@/features/weekly-routine/pages/WeeklyRoutineDetailPage/WeeklyRoutineDetailPage'

export const weeklyRoutineRoutes: RouteObject = {
  path: 'weekly-routine',
  children: [
    { index: true, element: <WeeklyRoutinePage /> },
    { path: ':id', element: <WeeklyRoutineDetailPage /> },
  ],
}
