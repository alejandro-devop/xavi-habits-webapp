import type { RouteObject } from 'react-router'
import { HabitsModuleLayout } from '@/features/habits/pages/HabitsModuleLayout'
import { HabitMyDayPage } from '@/features/habits/pages/HabitMyDayPage'
import { HabitsListPage } from '@/features/habits/pages/HabitsListPage'
import { HabitDetailPage } from '@/features/habits/pages/HabitDetailPage'
import { HabitFormPage } from '@/features/habits/pages/HabitFormPage'
import { HabitWeekViewPage } from '@/features/habits/pages/HabitWeekViewPage'
import { HabitCalendarPage } from '@/features/habits/pages/HabitCalendarPage'
import { HabitCategoriesPage } from '@/features/habits/pages/HabitCategoriesPage'

export const habitsRoutes: RouteObject = {
  path: 'habits',
  element: <HabitsModuleLayout />,
  children: [
    {
      index: true,
      element: <HabitMyDayPage />,
    },
    {
      path: 'my-day',
      element: <HabitMyDayPage />,
    },
    {
      path: 'list',
      element: <HabitsListPage />,
    },
    {
      path: 'categories',
      element: <HabitCategoriesPage />,
    },
    {
      path: ':id/edit',
      element: <HabitFormPage />,
    },
    {
      path: ':id/week',
      element: <HabitWeekViewPage />,
    },
    {
      path: ':id/calendar',
      element: <HabitCalendarPage />,
    },
    {
      path: ':id',
      element: <HabitDetailPage />,
    },
  ],
}
