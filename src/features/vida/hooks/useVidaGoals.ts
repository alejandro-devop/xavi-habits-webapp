import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as vidaGoalsApi from '@/features/vida/api/vida-goals.api'
import type { VidaGoalDaysSetInput } from '@/features/vida/types/vida-goal.types'
import { invalidateActivityCategoryQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { toErrorMessage } from '@/features/vida/utils/vida-error.utils'
import { useToast } from '@/shared/ui/Toast'

/**
 * Guardar los días de una meta. Calcado de `useSetActivityCategoryGoalMutation`
 * (`useActivityCategories.ts`), incluidos el `toast.error` con `toErrorMessage`
 * y el silencio en el acierto: un toque en un botón de día ya se ve a sí mismo,
 * un aviso por cada toque sería ruido.
 *
 * **La invalidación es la del catálogo de categorías a propósito**: el front no
 * tiene ninguna consulta de metas: las lee dentro de `ActivityCategory.goal`.
 * Al volver el catálogo, el arco de Hoy aparece o desaparece sin recargar
 * (mismo mecanismo que el criterio 501 de FEAT-016). No hace falta ninguna
 * clave nueva, así que no hay nada que nombrar en `invalidate-vida-queries.ts`.
 */
export function useSetVidaGoalDaysMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaGoalDaysSetInput) => vidaGoalsApi.setVidaGoalDays(input),
    onSuccess: () => {
      invalidateActivityCategoryQueries(queryClient)
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos guardar los días de la meta'))
    },
  })
}
