import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { systemIcons } from '@/shared/icons/catalog/system.icons'
import type { AppIconEntry } from '@/shared/icons/types'

// ─────────────────────────────────────────────────────────────────────────────
// El registro de iconos
//
// El catálogo completo pasa de 850 entradas y pesa más que cualquier otra cosa
// del paquete. No puede viajar en el arranque: viaja en un trozo aparte que se
// pide cuando hace falta.
//
// Lo que sí arranca con la app son los iconos del cromo —la lupa, la campana,
// el check—: sin ellos la barra superior saldría en blanco mientras se
// descarga el resto, y eso se ve en cada carga.
// ─────────────────────────────────────────────────────────────────────────────

const registry = new Map<string, IconDefinition>()
const listeners = new Set<() => void>()

let catalogLoaded = false
let pendingLoad: Promise<void> | null = null

function addAll(entries: readonly AppIconEntry[]): void {
  for (const entry of entries) registry.set(entry.name, entry.icon)
}

// El cromo no espera a ninguna descarga.
addAll(systemIcons)

/** El icono ya registrado, o `null` si todavía no ha llegado —o no existe—. */
export function getRegisteredIcon(name: string): IconDefinition | null {
  return registry.get(name) ?? null
}

export function hasRegisteredIcon(name: string): boolean {
  return registry.has(name)
}

/**
 * Da por entregado el catálogo completo y avisa a quien esté pintando.
 *
 * Lo llama la carga perezosa, y también los tests, que no tienen red que
 * esperar y registran el catálogo entero antes de renderizar nada.
 */
export function registerIconCatalog(entries: readonly AppIconEntry[]): void {
  addAll(entries)
  catalogLoaded = true
  for (const listener of listeners) listener()
}

export function isIconCatalogLoaded(): boolean {
  return catalogLoaded
}

/**
 * Pide el catálogo completo. Se resuelve una sola vez por sesión: las llamadas
 * siguientes se enganchan a la misma promesa.
 */
export function loadIconCatalog(): Promise<void> {
  if (catalogLoaded) return Promise.resolve()
  pendingLoad ??= import('@/shared/icons/app-icons').then(({ appIcons }) => {
    registerIconCatalog(appIcons)
  })
  return pendingLoad
}

export function subscribeToIconCatalog(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
