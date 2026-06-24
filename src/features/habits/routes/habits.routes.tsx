import type { RouteObject } from 'react-router'
import { HabitsModuleLayout } from '@/features/habits/pages/HabitsModuleLayout'
import { HabitMyDayPage } from '@/features/habits/pages/HabitMyDayPage'
import { HabitsListPage } from '@/features/habits/pages/HabitsListPage'
import { HabitsArchivedPage } from '@/features/habits/pages/HabitsArchivedPage'
import { HabitDetailPage } from '@/features/habits/pages/HabitDetailPage'
import { HabitFormPage } from '@/features/habits/pages/HabitFormPage'
import { HabitWeekViewPage } from '@/features/habits/pages/HabitWeekViewPage'
import { HabitCalendarPage } from '@/features/habits/pages/HabitCalendarPage'
import { HabitCategoriesPage } from '@/features/habits/pages/HabitCategoriesPage'
import { HabitPersonaPage } from '@/features/habits/pages/HabitPersonaPage'

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
      path: 'archived',
      element: <HabitsArchivedPage />,
    },
    {
      path: 'categories',
      element: <HabitCategoriesPage />,
    },
    {
      path: 'persona',
      element: <HabitPersonaPage />,
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
