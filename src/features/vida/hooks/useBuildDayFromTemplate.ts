import { useCallback, useState } from 'react'
import { useSetActivityDayPlanMutation } from '@/features/vida/hooks/useActivityDayPlan'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  buildDayFromTemplate,
  type BuildDayResult,
  type BuildDaySummary,
} from '@/features/vida/utils/vida-build-day.utils'

export type BuildDayRequest = {
  /** `YYYY-MM-DD` del día que se arma. */
  date: string
  /** Los ítems de la plantilla de **ese** día de la semana. */
  templateItems: VidaItem[]
  /** Horario del día, de los ajustes de Vida. */
  dayStart: string
  dayEnd: string
}

export type BuildDayOutcome = {
  date: string
  summary: BuildDaySummary
}

/**
 * Armar **un** día desde la plantilla (criterios 41–44).
 *
 * Es **una sola operación** (`activityDayPlanSet`, criterio 42): se calcula el
 * día entero en `vida-build-day.utils.ts` —puro— y se manda de una vez. Al
 * volver, la invalidación por fecha que ya trae `useSetActivityDayPlanMutation`
 * repinta la agenda, el presupuesto **y** el punto de ese día en la tira: son
 * la misma entrada de caché. Ninguna mutación nueva, ninguna clave nueva.
 *
 * **Con la plantilla vacía no se llama al API.** `Set` reemplaza el día entero:
 * mandarle una lista vacía sería vaciar el día, que es justo lo contrario de lo
 * que el usuario pidió. Se devuelve el resumen y ya.
 *
 * El resumen se guarda en `lastBuild` porque el aviso del criterio 43/44 no
 * cabe en un toast: lleva un enlace al catálogo. Quien pinta lo lee de ahí.
 */
export function useBuildDayFromTemplate() {
  const setMutation = useSetActivityDayPlanMutation()
  const [lastBuild, setLastBuild] = useState<BuildDayOutcome | null>(null)

  const clearLastBuild = useCallback(() => setLastBuild(null), [])

  const build = useCallback(
    (request: BuildDayRequest): BuildDayResult => {
      const result = buildDayFromTemplate(request.templateItems, {
        dayStart: request.dayStart,
        dayEnd: request.dayEnd,
      })
      const { items, ...summary } = result

      if (items.length === 0) {
        setLastBuild({ date: request.date, summary })
        return result
      }

      setMutation.mutate(
        { date: request.date, items },
        // Solo se afirma lo que pasó: si la mutación falla, no hay resumen que
        // enseñar —el toast de error del hook ya lo cuenta— y el día se queda
        // como estaba.
        { onSuccess: () => setLastBuild({ date: request.date, summary }) },
      )
      return result
    },
    [setMutation],
  )

  return {
    build,
    isPending: setMutation.isPending,
    lastBuild,
    clearLastBuild,
  }
}
