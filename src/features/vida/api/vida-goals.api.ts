import { VIDA_GOAL_DAYS_SET_MUTATION } from '@/features/vida/graphql/vida-goals.graphql'
import type { VidaGoal, VidaGoalDaysSetInput } from '@/features/vida/types/vida-goal.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type VidaGoalDaysSetData = {
  vidaGoalDaysSet: VidaGoal
}

/**
 * Cambia los días en que una meta cuenta. Un toque, un viaje.
 *
 * Devuelve la meta entera, pero quien la consume no la escribe en caché a mano:
 * invalida el catálogo de categorías, que es de donde el front lee las metas.
 */
export async function setVidaGoalDays(input: VidaGoalDaysSetInput): Promise<VidaGoal> {
  const data = await graphqlRequest<VidaGoalDaysSetData, { input: VidaGoalDaysSetInput }>(
    VIDA_GOAL_DAYS_SET_MUTATION,
    { input },
  )
  return data.vidaGoalDaysSet
}
