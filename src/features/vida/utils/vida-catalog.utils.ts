import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { compareVidaNames } from '@/features/vida/utils/vida-text.utils'

/**
 * El catálogo agrupado por categoría. Aritmética pura: la página cruza dos
 * consultas aquí y las tarjetas reciben lo suyo ya resuelto —la misma forma que
 * `buildFollowUpsByHabit` en hábitos—, así no hay ni una consulta por tarjeta.
 */

/**
 * Cuántas actividades se piden de una vez. `activities` es paginado y el
 * catálogo no enseña controles de página: trae un lote y, si no cabía entero,
 * lo dice en una línea. Vive aquí y no en la página porque las archivadas piden
 * el mismo lote con otro filtro.
 */
export const CATALOG_LIMIT = 200

/** No es un id del API: es la llave del grupo que no tiene categoría. */
export const UNCATEGORIZED_GROUP_ID = '__sin-categoria__'
export const UNCATEGORIZED_GROUP_NAME = 'Sin categoría'
/** Icono neutro del grupo sin categoría (criterio 2). */
export const UNCATEGORIZED_GROUP_ICON = 'circle-dot'

export type VidaCatalogGroupModel = {
  /** Id de la categoría, o `UNCATEGORIZED_GROUP_ID`. */
  id: string
  name: string
  icon: string | null
  color: string | null
  /** `true` solo en el grupo «Sin categoría», que siempre va al final. */
  isUncategorized: boolean
  activities: Activity[]
}

/**
 * Las archivadas fuera, en cliente. `ActivityFilters.status` es un enum único y
 * anulable: no hay forma de pedir «todo menos `cancelled`» al API sin partir la
 * consulta en tres, así que se pide sin filtro y se recorta aquí. El recuento
 * del criterio 4 sale de este array, nunca de `total` (que sí cuenta las
 * archivadas y mentiría).
 */
export function excludeArchivedActivities(activities: Activity[]): Activity[] {
  return activities.filter((activity) => activity.status !== 'cancelled')
}

/** `activityId → VidaItem` activo. Los desactivados no pintan casillas. */
export function buildVidaItemsByActivity(items: VidaItem[]): Map<string, VidaItem> {
  const byActivity = new Map<string, VidaItem>()
  for (const item of items) {
    if (!item.isActive) continue
    if (byActivity.has(item.activityId)) continue
    byActivity.set(item.activityId, item)
  }
  return byActivity
}

/**
 * El `VidaItem` de una actividad **para la hoja**: el activo si lo hay y, si no,
 * el desactivado. La tarjeta solo mira el activo (`buildVidaItemsByActivity`);
 * la hoja necesita también el apagado, porque es lo que evita crear un segundo
 * `VidaItem` al volver a encender el interruptor y lo que conserva su nota
 * (criterios 19 y 20). Por eso la página pide la plantilla con `includeInactive`.
 */
export function findVidaItemForActivity(
  items: VidaItem[],
  activityId: string,
): VidaItem | null {
  const own = items.filter((item) => item.activityId === activityId)
  return own.find((item) => item.isActive) ?? own[0] ?? null
}

type GroupAccumulator = {
  group: VidaCatalogGroupModel
  orderIndex: number
}

/**
 * Grupos por `orderIndex` de la categoría y, a igualdad, por nombre; dentro de
 * cada grupo, las actividades por nombre. Ordenación del navegador para español
 * (`localeCompare` con `'es'`): simple y predecible.
 *
 * Una actividad cuya categoría no esté en el catálogo —borrada, o todavía sin
 * llegar— cae en «Sin categoría» en vez de desaparecer.
 */
export function groupActivitiesByCategory(
  activities: Activity[],
  categories: ActivityCategory[],
): VidaCatalogGroupModel[] {
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const accumulators = new Map<string, GroupAccumulator>()

  for (const activity of activities) {
    const category = activity.categoryId ? categoriesById.get(activity.categoryId) : undefined
    const ref = category ?? activity.category ?? undefined
    const isUncategorized = !activity.categoryId || !ref
    const id = isUncategorized ? UNCATEGORIZED_GROUP_ID : activity.categoryId!

    let accumulator = accumulators.get(id)
    if (!accumulator) {
      accumulator = {
        orderIndex: isUncategorized
          ? Number.MAX_SAFE_INTEGER
          : (ref?.orderIndex ?? Number.MAX_SAFE_INTEGER),
        group: {
          id,
          name: isUncategorized ? UNCATEGORIZED_GROUP_NAME : (ref?.name ?? UNCATEGORIZED_GROUP_NAME),
          icon: isUncategorized ? UNCATEGORIZED_GROUP_ICON : (ref?.icon ?? null),
          color: isUncategorized ? null : (ref?.color ?? null),
          isUncategorized,
          activities: [],
        },
      }
      accumulators.set(id, accumulator)
    }
    accumulator.group.activities.push(activity)
  }

  for (const accumulator of accumulators.values()) {
    accumulator.group.activities.sort((a, b) => compareVidaNames(a.title, b.title))
  }

  return [...accumulators.values()]
    .sort((a, b) => {
      if (a.group.isUncategorized !== b.group.isUncategorized) {
        return a.group.isUncategorized ? 1 : -1
      }
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
      return compareVidaNames(a.group.name, b.group.name)
    })
    .map((accumulator) => accumulator.group)
}

/**
 * Las categorías del «N actividades · M categorías». «Sin categoría» no cuenta:
 * es un grupo, no una categoría, y anunciarla como tal sería mentir.
 */
export function countCatalogCategories(groups: VidaCatalogGroupModel[]): number {
  return groups.filter((group) => !group.isUncategorized).length
}

/**
 * `categoryId → cuántas actividades` para la pantalla de categorías. Las que no
 * tienen categoría no entran: no hay ninguna fila a la que sumarlas.
 */
export function countActivitiesByCategory(activities: Activity[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    if (!activity.categoryId) continue
    counts.set(activity.categoryId, (counts.get(activity.categoryId) ?? 0) + 1)
  }
  return counts
}
