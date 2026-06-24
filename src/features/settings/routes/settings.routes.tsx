import type { RouteObject } from 'react-router'
import { SettingsPage } from '@/pages/app/SettingsPage/SettingsPage'

export const settingsRoutes: RouteObject = {
  path: 'settings',
  element: <SettingsPage />,
}
