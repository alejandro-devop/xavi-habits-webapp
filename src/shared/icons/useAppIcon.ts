import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  getRegisteredIcon,
  isIconCatalogLoaded,
  loadIconCatalog,
  subscribeToIconCatalog,
} from '@/shared/icons/icon-registry'
import { normalizeIconName } from '@/shared/icons/icon-utils'

/**
 * Resuelve el icono que toca pintar.
 *
 * Si ya está registrado —el cromo lo está desde el arranque— sale en el primer
 * render, sin esperar a nada. Si no, pide el catálogo perezoso una vez y vuelve
 * a pintar cuando llega; mientras tanto, `AppIcon` enseña su hueco.
 *
 * `useSyncExternalStore` en vez de un `useState` dentro de un efecto: el
 * registro es estado de fuera de React y así se lee sin sincronizarlo a mano.
 * La instantánea es el propio icono, que es siempre la misma referencia
 * mientras no cambie el registro.
 *
 * `pending` distingue las dos formas de no tener icono: «todavía no ha
 * llegado» y «ese nombre no existe». Se pintan distinto.
 */
export function useAppIcon(name: string): { icon: IconDefinition | null; pending: boolean } {
  const normalized = normalizeIconName(name)

  const getSnapshot = useCallback(() => getRegisteredIcon(normalized), [normalized])
  const icon = useSyncExternalStore(subscribeToIconCatalog, getSnapshot, getSnapshot)

  useEffect(() => {
    if (icon) return
    void loadIconCatalog()
  }, [icon])

  return { icon, pending: !icon && !isIconCatalogLoaded() }
}
