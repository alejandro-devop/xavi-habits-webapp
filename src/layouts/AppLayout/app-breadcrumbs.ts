import { appSidebarItems, type AppNavItem } from '@/layouts/AppLayout/app-nav.config'
import type { BreadcrumbItem } from '@/shared/ui/Breadcrumbs'

/** `/app/habits/my-day` → `/app/habits`. Dos segmentos: la raíz del módulo. */
function moduleRootOf(path: string): string {
  const segments = path.split('/').filter(Boolean).slice(0, 2)
  return `/${segments.join('/')}`
}

function isUnder(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

/**
 * Miga de pan de la barra superior: **dónde estás**, no a dónde puedes ir. Sale
 * del propio menú (`app-nav.config`), así que nunca inventa niveles: si la ruta
 * no tiene una sección declarada, se queda en el nombre del módulo.
 */
export function resolveBreadcrumbs(
  pathname: string,
  items: AppNavItem[] = appSidebarItems,
): BreadcrumbItem[] {
  const root = moduleRootOf(pathname)
  const item = items.find((navItem) => moduleRootOf(navItem.to) === root)

  if (!item) return []

  // De varias secciones que encajen gana la más específica.
  const section = (item.sections ?? [])
    .filter((candidate) => isUnder(pathname, candidate.to))
    .sort((a, b) => b.to.length - a.to.length)[0]

  if (!section) return [{ label: item.label }]

  return [{ label: item.label, to: item.to }, { label: section.label }]
}
