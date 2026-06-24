import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { authPaths } from '@/features/auth/router/auth-paths'
import { habitsPaths } from '@/features/habits'
import { settingsPaths } from '@/features/settings'
import { sleepPaths } from '@/features/sleep'
import { weeklyRoutinePaths } from '@/features/weekly-routine'
import type { SidebarNavItem } from '@/shared/ui/Sidebar'
import type { CommandAction } from '@/shared/ui/CommandPalette'

export const appSidebarItems: SidebarNavItem[] = [
  { to: authPaths.today, label: 'Hoy', icon: 'home', end: true },
  { to: activitiesPaths.root, label: 'Actividades', icon: 'list-check' },
  { to: '/app/todos', label: 'Tareas', icon: 'clipboard' },
  { to: '/app/notes', label: 'Notas', icon: 'file-lines' },
  { to: habitsPaths.myDay, label: 'Hábitos', icon: 'fire' },
  { to: sleepPaths.root, label: 'Sueño', icon: 'moon' },
  { to: weeklyRoutinePaths.root, label: 'Rutina', icon: 'calendar-week' },
  { to: '/app/quarters', label: 'Quarters', icon: 'calendar-days' },
  { to: '/app/projects', label: 'Proyectos', icon: 'diagram-project' },
  { to: settingsPaths.root, label: 'Ajustes', icon: 'gear' },
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
      id: 'go-weekly-routine',
      label: 'Ir a Rutina semanal',
      icon: 'calendar-week',
      keywords: ['rutina', 'planner', 'agenda', 'semana'],
      onSelect: () => handlers.navigate(weeklyRoutinePaths.root),
    },
    {
      id: 'go-testing-hall',
      label: 'Ir a Testing Hall',
      icon: 'search',
      keywords: ['laboratorio', 'design system'],
      onSelect: () => handlers.navigate(authPaths.testingHall),
    },
    {
      id: 'go-sleep',
      label: 'Ir a Sueño',
      icon: 'moon',
      keywords: ['sleep', 'sueño', 'descanso', 'dormir'],
      onSelect: () => handlers.navigate(sleepPaths.root),
    },
    {
      id: 'go-settings',
      label: 'Ir a Ajustes',
      icon: 'gear',
      keywords: ['settings', 'ajustes', 'privacidad', 'configuración'],
      onSelect: () => handlers.navigate(settingsPaths.root),
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
