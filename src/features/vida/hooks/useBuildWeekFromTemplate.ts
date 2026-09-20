import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as dayPlanApi from '@/features/vida/api/activity-day-plan.api'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { invalidateDayPlanQueries } from '@/features/vida/utils/invalidate-vida-queries'
import {
  buildDayFromTemplate,
  type BuildDaySummary,
} from '@/features/vida/utils/vida-build-day.utils'
import { formatDayHeading } from '@/features/vida/utils/vida-date.utils'
import { toErrorMessage } from '@/features/vida/utils/vida-error.utils'
import { useToast } from '@/shared/ui/Toast'

export type BuildWeekDay = {
  /** `YYYY-MM-DD`. Quien llama ya filtró: aquí llegan **solo los vacíos y editables**. */
  date: string
  /** Los ítems de la plantilla de ese día de la semana. */
  templateItems: VidaItem[]
}

export type BuildWeekInput = {
  days: BuildWeekDay[]
  dayStart: string
  dayEnd: string
}

export type BuildWeekDone = { date: string; summary: BuildDaySummary }
export type BuildWeekFailure = { date: string; reason: string }

export type BuildWeekResult = {
  done: BuildWeekDone[]
  /** Los que no se pudieron armar, **con su día por nombre** (criterio 46). */
  failed: BuildWeekFailure[]
  /** Los que no tenían nada que poner: ni se llamó al API por ellos. */
  empty: string[]
}

/**
 * Armar **varios** días de golpe (criterios 45 y 46).
 *
 * Sigue el patrón de `useCreateStartingActivities`, que es el único precedente
 * de una operación por lotes en Vida y el que el plan manda imitar: orquesta
 * sobre `api/` —la capa que ya existe— en vez de disparar siete veces
 * `useSetActivityDayPlanMutation`, porque eso serían **siete toasts** encima
 * del mismo gesto. Un solo aviso al final y **una invalidación por día armado**,
 * también al final.
 *
 * **No lanza: resuelve** con `{ done, failed, empty }`. Si el tercer día falla,
 * los dos de antes **siguen armados** y el resumen los nombra: anunciar «semana
 * armada» cuando fueron 3 de 5 sería mentir sobre lo que hay en la cuenta
 * (criterio 46). Van **en serie** a propósito: el API es el mismo y el orden en
 * que quedan escritos es el orden en que el usuario los leerá.
 *
 * Un día cuya plantilla no da ningún bloque **no se toca**: `Set` reemplaza el
 * día entero y mandarle una lista vacía sería vaciarlo.
 */
export function useBuildWeekFromTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<BuildWeekResult, Error, BuildWeekInput>({
    mutationFn: async ({ days, dayStart, dayEnd }) => {
      const done: BuildWeekDone[] = []
      const failed: BuildWeekFailure[] = []
      const empty: string[] = []

      for (const day of days) {
        const { items, ...summary } = buildDayFromTemplate(day.templateItems, {
          dayStart,
          dayEnd,
        })
        if (items.length === 0) {
          empty.push(day.date)
          continue
        }
        try {
          await dayPlanApi.setActivityDayPlan({ date: day.date, items })
          done.push({ date: day.date, summary })
        } catch (error) {
          failed.push({
            date: day.date,
            reason: toErrorMessage(error, 'No se pudo guardar'),
          })
        }
      }

      return { done, failed, empty }
    },
    onSuccess: (result) => {
      // Solo los días que de verdad cambiaron. Invalidar la semana entera
      // obligaría a refetch de fechas que nadie tocó.
      for (const entry of result.done) {
        invalidateDayPlanQueries(queryClient, { date: entry.date })
      }

      const count = result.done.length

      if (result.failed.length > 0) {
        const names = result.failed.map((entry) => formatDayHeading(entry.date)).join(', ')
        toast.error(
          count === 0
            ? `No pudimos armar ningún día (${names}). Inténtalo otra vez.`
            : `Armamos ${count} ${count === 1 ? 'día' : 'días'}; ${names} se quedó sin armar. Lo demás está puesto.`,
        )
        return
      }

      if (count === 0) {
        toast.error(
          result.empty.length > 0
            ? 'Tu plantilla no trae nada para esos días, así que no hay qué armar.'
            : 'No había ningún día que armar.',
        )
        return
      }

      toast.success(
        count === 1
          ? `${formatDayHeading(result.done[0]!.date)} armado desde tu plantilla`
          : `${count} días armados desde tu plantilla`,
      )
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos armar la semana'))
    },
  })
}
