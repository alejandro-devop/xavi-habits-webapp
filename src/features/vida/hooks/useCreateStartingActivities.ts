import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as activitiesApi from '@/features/vida/api/activities.api'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
import {
  findStartingCategory,
  type VidaStartingPoint,
} from '@/features/vida/data/vida-starting-points'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { CATALOG_LIMIT, excludeArchivedActivities } from '@/features/vida/utils/vida-catalog.utils'
import {
  invalidateActivityCategoryQueries,
  invalidateActivityQueries,
  invalidateVidaItemQueries,
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
  /** Las actividades que **se crearon** aquí (las reutilizadas no entran). */
  created: Activity[]
  /** Las que ya estaban en el catálogo y se reutilizaron (criterio 37). */
  reused: Activity[]
  /** Los **ids de punto** que quedaron enteros: actividad y, con `schedule`, su ítem. */
  done: string[]
  failed: StartingActivityFailure[]
}

/**
 * Con `schedule`, cada punto no solo se crea: **entra en la plantilla** con sus
 * días, su hora y su duración (criterio 36 de FEAT-005). Sin él, el hook se
 * comporta **exactamente como en FEAT-002**: crea actividades y nada más, que
 * es lo que sigue pidiendo el catálogo.
 */
export type CreateStartingActivitiesInput = {
  points: VidaStartingPoint[]
  schedule?: { days: VidaDayOfWeek[] }
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

/**
 * El catálogo fresco, indexado por **nombre normalizado**. Es lo que hace que
 * un punto de partida **no duplique** una actividad que ya existe (criterio 37
 * de FEAT-005): hasta ahora se creaban a ciegas y dos «Bañarme» era lo normal.
 *
 * Las **archivadas no cuentan**: reutilizar una archivada dejaría un ítem de
 * plantilla que la propia plantilla no pinta y que «Armar desde la plantilla»
 * nunca ofrece —sería poner algo invisible—. Si el catálogo no se puede leer,
 * se sigue sin índice: como mucho nace una repetida, que es mejor que no
 * poner nada.
 */
async function loadCatalogByTitle(): Promise<Map<string, Activity>> {
  try {
    const response = await activitiesApi.getActivities({ page: 1, limit: CATALOG_LIMIT })
    const index = new Map<string, Activity>()
    for (const activity of excludeArchivedActivities(response.activities)) {
      const key = normalizeVidaText(activity.title)
      if (!index.has(key)) index.set(key, activity)
    }
    return index
  } catch {
    return new Map()
  }
}

export function useCreateStartingActivities() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<CreateStartingActivitiesResult, Error, CreateStartingActivitiesInput>({
    mutationFn: async ({ points, schedule }) => {
      const failed: StartingActivityFailure[] = []
      const created: Activity[] = []
      const reused: Activity[] = []
      const done: string[] = []

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
      const catalogByTitle = await loadCatalogByTitle()

      for (const point of points) {
        // **Lo que ya existe no se crea otra vez** (criterio 37): mismo
        // criterio que con las categorías —nombre normalizado, sin tildes ni
        // mayúsculas—, solo que aquí no lo hacía nadie.
        let activity = catalogByTitle.get(normalizeVidaText(point.title)) ?? null
        if (activity) {
          reused.push(activity)
        } else {
          const categoryId = categoryIds.get(normalizeVidaText(point.categoryName))
          if (!categoryId) {
            // Su categoría no se pudo crear; ya está nombrada en `failed`.
            continue
          }
          try {
            activity = await activitiesApi.createActivity({ title: point.title, categoryId })
            created.push(activity)
          } catch (error) {
            failed.push({ name: point.title, reason: toReason(error) })
            continue
          }
        }

        if (!schedule) {
          done.push(point.id)
          continue
        }

        // Con `schedule`, el punto **entra en la plantilla** con lo que el
        // render propone: sus días, su hora y su duración. Si esto falla, el
        // punto cuenta como fallido aunque la actividad sí quedara creada —lo
        // que el usuario pidió era ponerla en su semana, no tenerla suelta—.
        try {
          await vidaItemsApi.createVidaItem({
            activityId: activity.id,
            days: schedule.days,
            ...(point.startTime ? { startTime: point.startTime } : {}),
            ...(point.durationMinutes ? { durationMinutes: point.durationMinutes } : {}),
          })
          done.push(point.id)
        } catch (error) {
          failed.push({ name: point.title, reason: toReason(error) })
        }
      }

      return { created, reused, done, failed }
    },
    onSuccess: (result, { points, schedule }) => {
      // Una sola invalidación al final: la lista se repinta una vez, no seis.
      invalidateActivityCategoryQueries(queryClient)
      invalidateActivityQueries(queryClient)
      // Con `schedule` también cambia la plantilla, y con ella lo que Hoy
      // ofrece en sus huecos: `invalidateVidaItemQueries` ya lo cubre por
      // prefijo, así que no hace falta invalidación nueva.
      if (schedule) invalidateVidaItemQueries(queryClient)

      if (schedule) {
        const placed = result.done.length
        if (result.failed.length > 0) {
          const names = [...new Set(result.failed.map((failure) => failure.name))]
          const list =
            names.length === 1
              ? names[0]!
              : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
          toast.error(
            placed === 0
              ? `No pudimos poner ninguna; ${list} se queda para otro intento.`
              : `Pusimos ${placed} de ${points.length}; ${list} no se pudo.`,
          )
          return
        }
        toast.success(
          placed === 1 ? 'Ya tienes tu primera en la plantilla' : `Pusimos ${placed} en tu plantilla`,
        )
        return
      }

      const count = result.created.length
      if (result.failed.length > 0) {
        toast.error(
          count === 0
            ? 'No pudimos crear ninguna. Inténtalo otra vez.'
            : `Creamos ${count} de ${points.length}. Las demás siguen aquí para volver a intentarlo.`,
        )
        return
      }
      if (count === 0 && result.reused.length > 0) {
        // Todas estaban ya: con la deduplicación del criterio 37 esto dejó de
        // ser «creamos 0» y pasó a ser una respuesta honesta.
        toast.success('Ya las tenías en tu catálogo')
        return
      }
      toast.success(
        count === 1 ? 'Ya tienes tu primera actividad' : `Ya tienes ${count} actividades`,
      )
    },
  })
}
