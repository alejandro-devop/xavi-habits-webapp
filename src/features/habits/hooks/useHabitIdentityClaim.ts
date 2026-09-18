import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as habitPurposesApi from '@/features/habits/api/habit-purposes.api'
import * as habitsApi from '@/features/habits/api/habits.api'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  composeIdentityEvidence,
  describeMilestoneEvidence,
  type HabitMilestoneKind,
} from '@/features/habits/utils/habit-identity.utils'
import { GraphQLClientError } from '@/shared/api/api-error'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export interface HabitIdentityClaimInput {
  habit: Habit
  milestone: HabitMilestoneKind
  name: string
  icon: string | null
  /** Día en que se gana, `YYYY-MM-DD`. */
  today: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof GraphQLClientError) return error.message
  if (error instanceof Error) return error.message
  return 'No pudimos guardar tu respuesta.'
}

/**
 * Reclamar una identidad es **un solo toque**: crea el `HabitPurpose` con la
 * evidencia dentro de `description` y lo enlaza a `habit.purposeId`.
 *
 * Son dos llamadas a la API, pero una sola mutación a propósito: así hay un
 * único estado de carga, una sola invalidación y —sobre todo— un solo aviso.
 * Dos toasts encadenados justo después de cumplir son exactamente la
 * interrupción administrativa que esta fase viene a quitar.
 */
export function useHabitIdentityClaim() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<HabitPurpose, unknown, HabitIdentityClaimInput>({
    mutationFn: async ({ habit, milestone, name, icon, today }) => {
      const description = composeIdentityEvidence({
        wonAt: today,
        milestone,
        detail: describeMilestoneEvidence(milestone, habit),
      })

      const purpose = await habitPurposesApi.createHabitPurpose({
        name,
        description,
        icon,
        placement: habit.shouldAvoid ? 'avoid' : 'want',
      })

      await habitsApi.updateHabit({ id: habit.id, purposeId: purpose.id })
      return purpose
    },
    onSuccess: () => {
      // `habitKeys.all` es prefijo de los propósitos y de Mi Día: una basta.
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
