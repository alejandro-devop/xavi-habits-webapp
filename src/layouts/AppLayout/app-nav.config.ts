import { habitsPaths } from '@/features/habits'
import { settingsPaths } from '@/features/settings'
import type { CommandAction } from '@/shared/ui/CommandPalette'

/**
 * `⌘K` es un acelerador, no un menú: solo ofrece destinos que existen. Con un
 * único módulo dentro, la lista es la de hábitos más lo transversal (tema,
 * ajustes de cuenta y salir).
 */
export function createCommandActions(handlers: {
  navigate: (path: string) => void
  cycleTheme: () => void
  logout: () => void
}): CommandAction[] {
  return [
    {
      id: 'go-habits-my-day',
      label: 'Ir a Mi día',
      icon: 'fire',
      keywords: ['hábitos', 'habits', 'hoy', 'día'],
      onSelect: () => handlers.navigate(habitsPaths.myDay),
    },
    {
      id: 'go-habits-list',
      label: 'Ir a Mis hábitos',
      icon: 'list-check',
      keywords: ['hábitos', 'habits', 'lista'],
      onSelect: () => handlers.navigate(habitsPaths.list),
    },
    {
      id: 'go-habits-archived',
      label: 'Ir a Archivados',
      icon: 'box-archive',
      keywords: ['archivo', 'archivados', 'hábitos'],
      onSelect: () => handlers.navigate(habitsPaths.archived),
    },
    {
      id: 'go-habits-categories',
      label: 'Ir a Categorías',
      icon: 'layer-group',
      keywords: ['categorías', 'etiquetas', 'hábitos'],
      onSelect: () => handlers.navigate(habitsPaths.categories),
    },
    {
      id: 'go-habits-measures',
      label: 'Ir a Medidas',
      icon: 'chart-simple',
      keywords: ['medidas', 'unidades', 'hábitos'],
      onSelect: () => handlers.navigate(habitsPaths.measures),
    },
    {
      id: 'go-habits-persona',
      label: 'Ir a Mi Persona',
      icon: 'circle-user',
      keywords: ['persona', 'identidad', 'hábitos'],
      onSelect: () => handlers.navigate(habitsPaths.persona),
    },
    {
      id: 'toggle-theme',
      label: 'Cambiar tema',
      icon: 'moon',
      keywords: ['light', 'dark', 'system', 'claro', 'oscuro'],
      onSelect: handlers.cycleTheme,
    },
    {
      id: 'go-settings',
      label: 'Ir a Ajustes de cuenta',
      icon: 'gear',
      keywords: ['settings', 'ajustes', 'cuenta', 'privacidad', 'configuración'],
      onSelect: () => handlers.navigate(settingsPaths.root),
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
