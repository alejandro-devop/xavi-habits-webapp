import type { VidaGoal } from '@/features/vida/types/vida-goal.types'

export interface ActivityCategory {
  id: string
  userId: number
  orderIndex: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  /** Meta a la que apunta esta categoría, o null. */
  goalId: string | null
  goal: VidaGoal | null
}

/**
 * El puntero **no viaja por `ActivityCategoryEditInput`**: tiene su propia
 * mutación porque, al primer uso, el cliente no tiene el id de la meta — no
 * existe todavía — y es el servidor quien la crea en la misma transacción.
 */
export interface ActivityCategoryGoalSetInput {
  categoryId: string
  /** false quita el puntero. true lo pone. */
  attached: boolean
  /** Meta explícita. Omitida con `attached: true`, se usa la meta por defecto del usuario. */
  goalId?: string | null
}

export interface ActivityCategoryInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

export interface ActivityCategoryEditInput {
  id: string
  name?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}
