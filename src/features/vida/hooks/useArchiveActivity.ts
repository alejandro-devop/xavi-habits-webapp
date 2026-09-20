import { useUpdateActivityMutation } from '@/features/vida/hooks/useActivities'
import { useUpdateVidaItemMutation } from '@/features/vida/hooks/useVidaItems'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'

/**
 * Archivar y restaurar una actividad. Es un **orquestador** sobre las dos
 * mutaciones que ya existen (F0), como `useSaveVidaItemForActivity`: no añade
 * ni un documento GraphQL ni acceso nuevo al API.
 *
 * Las reglas son D1 del dossier, y las tres son criterios:
 *
 * - Archivar es `activityEdit` con `status: 'cancelled'` (criterio 21).
 *   **`activityRemove` no se usa nunca**: nada se borra del todo.
 * - Si la actividad tenía un `VidaItem`, se **desactiva** (`isActive: false`),
 *   no se borra: sus días y su nota se quedan (criterio 22).
 * - Restaurar es `status: 'pending'` y **reactiva el mismo `VidaItem`**
 *   (`isActive: true`), con sus días intactos (criterio 24).
 *
 * El `cancelled` del API no asoma nunca a la pantalla: aquí las palabras son
 * «Archivar» y «Restaurar» (criterio 25).
 *
 * **El orden importa.** Primero la actividad y, solo si esa salió bien, el
 * `VidaItem`: si se hiciera al revés, un fallo al archivar dejaría la plantilla
 * apagada sin que nadie lo hubiera pedido. Si falla el segundo paso, el hook de
 * F0 avisa con su toast y la plantilla se queda como estaba —recuperable
 * volviendo a archivar o desde la hoja—.
 */
export function useArchiveActivity() {
  const updateActivity = useUpdateActivityMutation()
  const updateVidaItem = useUpdateVidaItemMutation()

  function apply(
    activity: Activity,
    item: VidaItem | null | undefined,
    isArchived: boolean,
    options?: { onSuccess?: () => void },
  ) {
    const wantedItemActive = !isArchived
    updateActivity.mutate(
      { id: activity.id, status: isArchived ? 'cancelled' : 'pending' },
      {
        onSuccess: () => {
          if (item && item.isActive !== wantedItemActive) {
            updateVidaItem.mutate(
              { id: item.id, isActive: wantedItemActive },
              { onSuccess: () => options?.onSuccess?.() },
            )
            return
          }
          options?.onSuccess?.()
        },
      },
    )
  }

  return {
    archive: (
      activity: Activity,
      item?: VidaItem | null,
      options?: { onSuccess?: () => void },
    ) => apply(activity, item, true, options),
    restore: (
      activity: Activity,
      item?: VidaItem | null,
      options?: { onSuccess?: () => void },
    ) => apply(activity, item, false, options),
    isPending: updateActivity.isPending || updateVidaItem.isPending,
  }
}
