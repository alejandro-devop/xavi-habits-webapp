import { habitsPaths } from '@/features/habits'
import { settingsPaths } from '@/features/settings'
import { vidaPaths } from '@/features/vida'
import type { AppIconName } from '@/shared/icons'
import type { CommandAction } from '@/shared/ui/CommandPalette'

/** Un destino de uso diario: píldora en la barra y acción en `⌘K`. */
export type AppModuleSection = {
  id: string
  to: string
  label: string
  icon: AppIconName | string
  keywords: string[]
}

/** Un ajuste **del módulo**: vive en el popover «Ajustes», no en la barra. */
export type AppModuleSettingsLink = {
  id: string
  to: string
  label: string
  icon: AppIconName | string
  keywords: string[]
}

export type AppModule = {
  id: string
  label: string
  /** Prefijo de URL por el que se reconoce que el módulo está activo. */
  root: string
  /** Dónde aterriza quien elige el módulo en la píldora. */
  home: string
  sections: readonly AppModuleSection[]
  /** Ajustes del módulo; si no los tiene, la barra no pinta el popover. */
  settings?: readonly AppModuleSettingsLink[]
}

/**
 * La **única** descripción de los módulos de la app: de aquí salen la píldora
 * de módulo, las píldoras de sección, el popover de ajustes del módulo y los
 * destinos de `⌘K`. Antes esta lista estaba escrita dos veces (en la barra y
 * en la paleta) y se desincronizaba en silencio.
 *
 * Categorías, Medidas y Mi Persona son ajustes del módulo, no destinos de uso
 * diario: van agrupados para que la barra respire. Los de la cuenta se llaman
 * «Ajustes de cuenta» y viven en el menú de la ficha.
 */
export const appModules: readonly AppModule[] = [
  {
    id: 'habits',
    label: 'Hábitos',
    root: habitsPaths.root,
    home: habitsPaths.myDay,
    sections: [
      {
        id: 'my-day',
        to: habitsPaths.myDay,
        label: 'Mi día',
        icon: 'fire',
        keywords: ['hábitos', 'habits', 'hoy', 'día'],
      },
      {
        id: 'list',
        to: habitsPaths.list,
        label: 'Mis hábitos',
        icon: 'list-check',
        keywords: ['hábitos', 'habits', 'lista'],
      },
      {
        id: 'archived',
        to: habitsPaths.archived,
        label: 'Archivados',
        icon: 'box-archive',
        keywords: ['archivo', 'archivados', 'hábitos'],
      },
    ],
    settings: [
      {
        id: 'categories',
        to: habitsPaths.categories,
        label: 'Categorías',
        icon: 'layer-group',
        keywords: ['categorías', 'etiquetas', 'hábitos'],
      },
      {
        id: 'measures',
        to: habitsPaths.measures,
        label: 'Medidas',
        icon: 'chart-simple',
        keywords: ['medidas', 'unidades', 'hábitos'],
      },
      {
        id: 'persona',
        to: habitsPaths.persona,
        label: 'Mi Persona',
        icon: 'circle-user',
        keywords: ['persona', 'identidad', 'hábitos'],
      },
    ],
  },
  {
    id: 'vida',
    label: 'Vida',
    root: vidaPaths.root,
    home: vidaPaths.hoy,
    sections: [
      {
        id: 'hoy',
        to: vidaPaths.hoy,
        label: 'Hoy',
        icon: 'sun',
        keywords: ['vida', 'hoy', 'día', 'agenda'],
      },
      {
        id: 'plantilla',
        to: vidaPaths.plantilla,
        label: 'Plantilla',
        icon: 'calendar-days',
        keywords: ['vida', 'plantilla', 'semana'],
      },
      {
        id: 'revision',
        to: vidaPaths.revision,
        label: 'Revisión',
        icon: 'clipboard-check',
        keywords: ['vida', 'revisión', 'revisar'],
      },
      {
        id: 'actividades',
        to: vidaPaths.actividades,
        label: 'Actividades',
        icon: 'list-ul',
        keywords: ['vida', 'actividades', 'catálogo'],
      },
    ],
  },
]

/** El módulo al que pertenece una URL; el primero es el de casa. */
export function findActiveModule(pathname: string): AppModule {
  return appModules.find((module) => pathname.startsWith(module.root)) ?? appModules[0]
}

/**
 * `⌘K` es un acelerador, no un menú: solo ofrece destinos que existen. La
 * lista sale de `appModules` (secciones y ajustes de cada módulo, en orden)
 * más lo transversal: tema, ajustes de cuenta y salir.
 */
export function createCommandActions(handlers: {
  navigate: (path: string) => void
  cycleTheme: () => void
  logout: () => void
}): CommandAction[] {
  const moduleActions = appModules.flatMap((module) =>
    [...module.sections, ...(module.settings ?? [])].map((destination) => ({
      id: `go-${module.id}-${destination.id}`,
      label: `Ir a ${destination.label}`,
      icon: destination.icon,
      keywords: destination.keywords,
      onSelect: () => handlers.navigate(destination.to),
    })),
  )

  return [
    ...moduleActions,
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
