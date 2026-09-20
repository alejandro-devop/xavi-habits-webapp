import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as activitiesApi from '@/features/vida/api/activities.api'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import {
  findStartingCategory,
  type VidaStartingPoint,
} from '@/features/vida/data/vida-starting-points'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import {
  invalidateActivityCategoryQueries,
  invalidateActivityQueries,
} from '@/features/vida/utils/invalidate-vida-queries'
import { normalizeVidaText } from '@/features/vida/utils/vida-text.utils'
import { useToast } from '@/shared/ui/Toast'

/**
 * Crear los puntos de partida en bloque.
 *
 * **Es el único sitio de Vida autorizado a saltarse los hooks de mutación**, y
 * por una razón concreta: `useCreateActivityMutation` lanza un toast por
 * mutación, así que seis actividades y cuatro categorías serían diez avisos
 * encima del mismo gesto. Por eso orquesta sobre `api/` —la capa que ya
 * existe—, invalida **una sola vez** al final y deja **un solo mensaje**.
 *
 * No lanza: **resuelve** con `{ created, failed }`. Si la cuarta falla, las tres
 * de antes siguen creadas y el resumen nombra la que falló; anunciar «6 creadas»
 * cuando fueron 3 sería mentir sobre el estado de la cuenta.
 */

export type StartingActivityFailure = {
  /** Lo que se estaba creando: el nombre de la actividad o el de la categoría. */
  name: string
  reason: string
}

export type CreateStartingActivitiesResult = {
  created: Activity[]
  failed: StartingActivityFailure[]
}

function toReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'No se pudo guardar'
}

/**
 * Las categorías que hacen falta, sin repetir. Una categoría se crea **una vez**
 * aunque la pidan tres actividades: `Map` por nombre normalizado, no por texto.
 */
function collectNeededCategoryNames(points: VidaStartingPoint[]): string[] {
  const seen = new Map<string, string>()
  for (const point of points) {
    const key = normalizeVidaText(point.categoryName)
    if (!seen.has(key)) seen.set(key, point.categoryName)
  }
  return [...seen.values()]
}

/**
 * Resuelve `nombre normalizado → id`, reutilizando lo que ya exista en la
 * cuenta (ignorando mayúsculas y tildes: «casa» es la «Casa» de siempre) y
 * creando solo lo que falte. Mismo criterio que `applyHabitTemplate` en
 * hábitos: la plantilla trae nombre, nunca un id.
 */
async function resolveCategoryIds(
  points: VidaStartingPoint[],
  existing: ActivityCategory[],
  failed: StartingActivityFailure[],
): Promise<Map<string, string>> {
  const existingByName = new Map(
    existing.map((category) => [normalizeVidaText(category.name), category.id]),
  )
  const resolved = new Map<string, string>()

  for (const name of collectNeededCategoryNames(points)) {
    const key = normalizeVidaText(name)
    const alreadyThere = existingByName.get(key)
    if (alreadyThere) {
      resolved.set(key, alreadyThere)
      continue
    }

    const suggestion = findStartingCategory(name)
    try {
      const category = await activityCategoriesApi.createActivityCategory({
        name,
        icon: suggestion?.icon ?? null,
        color: suggestion?.color ?? null,
      })
      resolved.set(key, category.id)
    } catch (error) {
      failed.push({ name, reason: toReason(error) })
    }
  }

  return resolved
}

export function useCreateStartingActivities() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<CreateStartingActivitiesResult, Error, VidaStartingPoint[]>({
    mutationFn: async (points) => {
      const failed: StartingActivityFailure[] = []
      const created: Activity[] = []

      // Se pide el catálogo fresco: si el usuario ya tenía «Casa», se reutiliza
      // aunque la caché de la pantalla venga de hace un rato.
      let existing: ActivityCategory[]
      try {
        existing = await activityCategoriesApi.getActivityCategories()
      } catch {
        // Sin catálogo se sigue: como mucho se crea una categoría repetida, y
        // eso es mejor que no crear nada.
        existing = []
      }

      const categoryIds = await resolveCategoryIds(points, existing, failed)

      for (const point of points) {
        const categoryId = categoryIds.get(normalizeVidaText(point.categoryName))
        if (!categoryId) {
          // Su categoría no se pudo crear; ya está nombrada en `failed`.
          continue
        }
        try {
          created.push(await activitiesApi.createActivity({ title: point.title, categoryId }))
        } catch (error) {
          failed.push({ name: point.title, reason: toReason(error) })
        }
      }

      return { created, failed }
    },
    onSuccess: (result, points) => {
      // Una sola invalidación al final: la lista se repinta una vez, no seis.
      invalidateActivityCategoryQueries(queryClient)
      invalidateActivityQueries(queryClient)

      const count = result.created.length
      if (result.failed.length > 0) {
        toast.error(
          count === 0
            ? 'No pudimos crear ninguna. Inténtalo otra vez.'
            : `Creamos ${count} de ${points.length}. Las demás siguen aquí para volver a intentarlo.`,
        )
        return
      }
      toast.success(
        count === 1 ? 'Ya tienes tu primera actividad' : `Ya tienes ${count} actividades`,
      )
    },
  })
}
