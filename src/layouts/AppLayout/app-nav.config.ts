import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { authPaths } from '@/features/auth/router/auth-paths'
import type { SidebarNavItem } from '@/shared/ui/Sidebar'
import type { CommandAction } from '@/shared/ui/CommandPalette'

export const appSidebarItems: SidebarNavItem[] = [
  { to: authPaths.today, label: 'Hoy', icon: 'home', end: true },
  { to: activitiesPaths.root, label: 'Actividades', icon: 'list-check' },
  { to: '/app/todos', label: 'Tareas', icon: 'clipboard' },
  { to: authPaths.testingHall, label: 'Testing Hall', icon: 'search' },
]

export function createCommandActions(handlers: {
  navigate: (path: string) => void
  cycleTheme: () => void
  logout: () => void
}): CommandAction[] {
  return [
    {
      id: 'go-today',
      label: 'Ir a Hoy',
      icon: 'home',
      keywords: ['today', 'inicio'],
      onSelect: () => handlers.navigate(authPaths.today),
    },
    {
      id: 'go-activities',
      label: 'Ir a Actividades',
      icon: 'list-check',
      keywords: ['activities', 'tareas', 'categorías'],
      onSelect: () => handlers.navigate(activitiesPaths.root),
    },
    {
      id: 'go-todos',
      label: 'Ir a Tareas',
      icon: 'clipboard',
      keywords: ['todos', 'tareas', 'notebook'],
      onSelect: () => handlers.navigate('/app/todos'),
    },
    {
      id: 'go-testing-hall',
      label: 'Ir a Testing Hall',
      icon: 'search',
      keywords: ['laboratorio', 'design system'],
      onSelect: () => handlers.navigate(authPaths.testingHall),
    },
    {
      id: 'toggle-theme',
      label: 'Cambiar tema',
      icon: 'gear',
      keywords: ['light', 'dark', 'system'],
      onSelect: handlers.cycleTheme,
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: 'lock',
      keywords: ['salir', 'logout'],
      onSelect: handlers.logout,
    },
  ]
}
