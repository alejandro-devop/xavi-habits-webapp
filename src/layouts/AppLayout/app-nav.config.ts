import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { authPaths } from '@/features/auth/router/auth-paths'
import { habitsPaths } from '@/features/habits'
import { learningPaths } from '@/features/learning'
import { appIdeasPaths } from '@/features/app-ideas'
import { settingsPaths } from '@/features/settings'
import { sleepPaths } from '@/features/sleep'
import { weeklyRoutinePaths } from '@/features/weekly-routine'
import type { SidebarNavItem } from '@/shared/ui/Sidebar'
import type { CommandAction } from '@/shared/ui/CommandPalette'

/**
 * Elemento del menú principal. Extiende el del `Sidebar` con lo que solo la app
 * sabe: el grupo bajo el que se pinta y las secciones internas del módulo, que
 * alimentan la miga de pan de la barra superior.
 */
export type AppNavItem = SidebarNavItem & {
  group: string
  sections?: { to: string; label: string }[]
}

const DAY_TO_DAY = 'Día a día'
const THINKING = 'Pensar'
const SYSTEM = 'Sistema'

/**
 * Agrupado visual: los destinos no cambian, solo el orden y el encabezado bajo
 * el que se pintan. El `Sidebar` agrupa elementos consecutivos con el mismo
 * `group`, así que el orden de esta lista es el orden de los grupos.
 */
export const appSidebarItems: AppNavItem[] = [
  { to: authPaths.today, label: 'Hoy', icon: 'home', end: true, group: DAY_TO_DAY },
  {
    to: habitsPaths.myDay,
    label: 'Hábitos',
    icon: 'fire',
    group: DAY_TO_DAY,
    sections: [
      { to: habitsPaths.myDay, label: 'Mi día' },
      { to: habitsPaths.list, label: 'Mis hábitos' },
      { to: habitsPaths.archived, label: 'Archivados' },
      { to: habitsPaths.categories, label: 'Categorías' },
      { to: habitsPaths.measures, label: 'Medidas' },
      { to: habitsPaths.persona, label: 'Mi Persona' },
    ],
  },
  { to: '/app/todos', label: 'Tareas', icon: 'clipboard', group: DAY_TO_DAY },
  { to: weeklyRoutinePaths.root, label: 'Rutina', icon: 'calendar-week', group: DAY_TO_DAY },
  { to: activitiesPaths.root, label: 'Actividades', icon: 'list-check', group: DAY_TO_DAY },
  { to: sleepPaths.root, label: 'Sueño', icon: 'moon', group: DAY_TO_DAY },

  { to: '/app/notes', label: 'Notas', icon: 'file-lines', group: THINKING },
  { to: learningPaths.root, label: 'Learning', icon: 'graduation-cap', group: THINKING },
  { to: appIdeasPaths.root, label: 'Ideas', icon: 'lightbulb', group: THINKING },
  { to: '/app/quarters', label: 'Quarters', icon: 'calendar-days', group: THINKING },
  { to: '/app/projects', label: 'Proyectos', icon: 'diagram-project', group: THINKING },

  { to: settingsPaths.root, label: 'Ajustes', icon: 'gear', group: SYSTEM },
  { to: authPaths.testingHall, label: 'Testing Hall', icon: 'search', group: SYSTEM },
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
      id: 'go-learning',
      label: 'Ir a Learning',
      icon: 'graduation-cap',
      keywords: ['learning', 'conocimiento', 'notas', 'apuntes', 'buscar'],
      onSelect: () => handlers.navigate(learningPaths.root),
    },
    {
      id: 'go-app-ideas',
      label: 'Ir a Ideas de apps',
      icon: 'lightbulb',
      keywords: ['ideas', 'apps', 'productos', 'markdown', 'conceptos'],
      onSelect: () => handlers.navigate(appIdeasPaths.root),
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
