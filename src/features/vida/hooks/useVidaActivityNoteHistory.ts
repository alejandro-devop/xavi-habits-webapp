import { useQuery } from '@tanstack/react-query'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import {
  recentNoteSuggestions,
  VIDA_NOTE_HISTORY_LIMIT,
  VIDA_NOTE_SUGGESTIONS_MAX,
} from '@/features/vida/utils/vida-notes.utils'
import { vidaKeys } from '@/shared/api/query-keys'

type UseVidaActivityNoteHistoryInput = {
  /** De qué actividad. Sin esto no se consulta nada. */
  activityId: string | null | undefined
  /** **Solo con el editor abierto**: ver abajo. */
  enabled: boolean
  /** La sesión que se está editando: no se ofrece a sí misma. */
  excludeId?: string | null
}

/**
 * **«Lo de otras veces»** (FEAT-018, criterios 546 y 547): las últimas notas de
 * esa misma actividad, listas para tocarse.
 *
 * **Qué cuesta, dicho en voz alta:** una consulta GraphQL **solo cuando el
 * editor está abierto**. El primer pintado de Hoy no cambia en nada —cero
 * consultas nuevas al abrir la pantalla— y `staleTime` de cinco minutos hace
 * que abrir y cerrar el editor tres veces sobre la misma actividad cueste
 * **una**.
 *
 * **Por qué no `useVidaHistoryWindow`**, que también trae las sesiones en
 * crudo: está **condicionada** en Hoy, y sobre todo la barra de la sesión vive
 * en `VidaModuleLayout`, así que este editor se abre también desde Plantilla,
 * Actividades o Archivadas, donde esa ventana **no está montada**; montarla
 * ahí serían ~43 consultas de seis semanas para sacar tres píldoras.
 *
 * El campo `activityFollowUps(activityId:, limit:)` ya estaba en el esquema y
 * ya devolvía **solo sesiones cerradas**, ordenadas de la más reciente a la más
 * vieja. No se tocó el backend.
 */
export function useVidaActivityNoteHistory({
  activityId,
  enabled,
  excludeId = null,
}: UseVidaActivityNoteHistoryInput) {
  const guard = useVidaQueryGuard()
  const isEnabled = guard && enabled && Boolean(activityId)

  const query = useQuery({
    queryKey: vidaKeys.followUps.byActivity(activityId ?? '', VIDA_NOTE_HISTORY_LIMIT),
    enabled: isEnabled,
    queryFn: () =>
      followUpsApi.getActivityFollowUpsByActivity(activityId as string, VIDA_NOTE_HISTORY_LIMIT),
    staleTime: 1000 * 60 * 5,
  })

  return {
    suggestions: recentNoteSuggestions(query.data, {
      max: VIDA_NOTE_SUGGESTIONS_MAX,
      excludeId,
    }),
    /**
     * En vuelo **no se pinta nada** (criterio 547): ni esqueleto, ni hueco, ni
     * explicación. Sin consulta montada no está «pendiente»: está apagada.
     */
    isPending: isEnabled && query.isPending,
  }
}
