import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { VIDA_DAY_LABELS } from '@/features/vida/utils/vida-date.utils'
import { toErrorMessage } from '@/features/vida/utils/vida-error.utils'
import { invalidateVidaItemQueries } from '@/features/vida/utils/invalidate-vida-queries'
import {
  planCopyDay,
  type TemplateCopySkip,
  type TemplateCopyUpdate,
} from '@/features/vida/utils/vida-template.utils'
import { useToast } from '@/shared/ui/Toast'

export type CopyTemplateDayInput = {
  /** La plantilla entera tal como la tiene la pantalla: no se vuelve a pedir. */
  items: VidaItem[]
  fromDay: VidaDayOfWeek
  toDays: VidaDayOfWeek[]
}

export type CopyTemplateDayDone = {
  title: string
  addedDays: VidaDayOfWeek[]
}

export type CopyTemplateDayFailure = {
  title: string
  reason: string
}

export type CopyTemplateDayResult = {
  fromDay: VidaDayOfWeek
  toDays: VidaDayOfWeek[]
  /** Lo que de verdad quedó copiado. */
  done: CopyTemplateDayDone[]
  /** Lo que no se pudo, **con su nombre** (criterio 52). */
  failed: CopyTemplateDayFailure[]
  /** Lo que ya estaba y **se quedó como estaba** (criterio 50). */
  skipped: TemplateCopySkip[]
  /** Cuántos de los días marcados recibieron algo. */
  daysTouched: number
}

/** «el martes, el miércoles y el jueves». */
function listDays(days: VidaDayOfWeek[]): string {
  const labels = days.map((day) => `el ${VIDA_DAY_LABELS[day]}`)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]!
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
}

function countTouchedDays(done: CopyTemplateDayDone[]): number {
  const days = new Set<VidaDayOfWeek>()
  for (const entry of done) for (const day of entry.addedDays) days.add(day)
  return days.size
}

/**
 * **Copiar un día a otros** (criterios 49–53): el atajo que sustituye al
 * arrastrar.
 *
 * Copiar **no crea ítems**: le añade días al que ya existe (decisión A7), así
 * que son `vidaItemUpdate` en serie y **nunca** un `vidaItemCreate`. Quien
 * decide qué se copia y qué se queda como está es `planCopyDay`, que es puro y
 * está probado aparte; aquí solo se ejecuta y se cuenta lo que pasó.
 *
 * **Molde literal: `useBuildWeekFromTemplate.ts:59-95`** —el único patrón de
 * lote que este módulo tiene, junto con `useCreateStartingActivities`—: orquesta
 * sobre `api/` en vez de disparar N veces el hook de mutación (serían N toasts
 * por un solo gesto), va **en serie**, **una sola invalidación al final**, y
 * **no lanza: resuelve** con `{ done, failed, skipped }`. Si el tercero falla,
 * los dos de antes **siguen copiados** y el aviso lo dice: anunciar «copiado»
 * cuando fueron 4 de 6 sería mentir sobre lo que hay en la cuenta (criterio 52).
 *
 * **No hay clave de caché nueva ni invalidación nueva**: `invalidateVidaItemQueries`
 * tira de `vidaKeys.items.all()`, que es prefijo de las sugerencias y de lo
 * tomado hoy, y por eso Hoy ve la plantilla nueva sin recargar (criterio 53).
 */
export function useCopyTemplateDay() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<CopyTemplateDayResult, Error, CopyTemplateDayInput>({
    mutationFn: async ({ items, fromDay, toDays }) => {
      const { updates, skipped } = planCopyDay(items, fromDay, toDays)
      const done: CopyTemplateDayDone[] = []
      const failed: CopyTemplateDayFailure[] = []

      for (const update of updates as TemplateCopyUpdate[]) {
        try {
          await vidaItemsApi.updateVidaItem(update.input)
          done.push({ title: update.title, addedDays: update.addedDays })
        } catch (error) {
          failed.push({
            title: update.title,
            reason: toErrorMessage(error, 'No se pudo copiar'),
          })
        }
      }

      return {
        fromDay,
        toDays,
        done,
        failed,
        skipped,
        daysTouched: countTouchedDays(done),
      }
    },
    onSuccess: (result) => {
      // Una sola invalidación, y solo si algo cambió de verdad.
      if (result.done.length > 0) invalidateVidaItemQueries(queryClient)

      const from = VIDA_DAY_LABELS[result.fromDay]
      const count = result.done.length

      if (result.failed.length > 0) {
        const names = result.failed.map((entry) => entry.title).join(', ')
        toast.error(
          count === 0
            ? `No pudimos copiar tu ${from} (${names}). Tu plantilla se quedó como estaba.`
            : `Copiamos ${count} ${count === 1 ? 'cosa' : 'cosas'} a ${result.daysTouched} ${
                result.daysTouched === 1 ? 'día' : 'días'
              }; ${names} se quedó sin copiar.`,
        )
        return
      }

      if (count === 0) {
        // **Nada que hacer no es un fallo**: o ya estaba todo, o el día de
        // partida no tiene nada que llevarse.
        toast.info(
          result.skipped.length > 0
            ? `${listDays(result.toDays)} ya ${result.toDays.length === 1 ? 'tenía' : 'tenían'} lo de tu ${from}: se quedó como estaba.`
            : `Tu ${from} no tiene nada que copiar todavía.`,
        )
        return
      }

      toast.success(
        `Copiamos ${count} ${count === 1 ? 'cosa' : 'cosas'} de tu ${from} a ${result.daysTouched} ${
          result.daysTouched === 1 ? 'día' : 'días'
        }${result.skipped.length > 0 ? '; lo que ya estaba se quedó como estaba' : ''}`,
      )
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos copiar el día'))
    },
  })
}
