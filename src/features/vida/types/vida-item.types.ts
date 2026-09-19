import type { ActivityFollowUpActivityRef } from '@/features/vida/types/activity-followup.types'

/**
 * La plantilla Vida: lo que el usuario querría hacer cada día de la semana, y
 * lo que ya se «tomó» hoy. Espejo de
 * `xavi-platform-node/src/graphql/modules/vida/vida.schema.ts` (SDL vendorizado
 * en `graphql/schema/vida.schema.graphql`).
 *
 * Como en el plan del día, `activity` se selecciona en su versión corta y por
 * eso reusa `ActivityFollowUpActivityRef` de la tajada 2. En el esquema es
 * `Activity` (anulable, a diferencia del plan del día).
 */
export type VidaDayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface VidaItem {
  id: string
  userId: number
  activityId: string
  days: VidaDayOfWeek[]
  notes: string | null
  isActive: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
  activity?: ActivityFollowUpActivityRef | null
}

export interface VidaTakenToday {
  id: string
  userId: number
  vidaItemId: string
  /** Fecha civil local, `YYYY-MM-DD`. */
  date: string
  createdAt: string
}

export interface VidaSuggestion {
  item: VidaItem
  takenToday: boolean
}

/**
 * `clientId` (UUID v7) existe en el input de creación para idempotencia
 * offline. **Ningún hook lo genera todavía**: la web es el piloto y no hay modo
 * offline. Mismo criterio que en `activity-day-plan.types.ts`.
 */
export interface VidaItemCreateInput {
  activityId: string
  days: VidaDayOfWeek[]
  notes?: string | null
  orderIndex?: number
  /** UUID v7 del cliente para idempotencia offline. Hoy nadie lo emite. */
  clientId?: string | null
}

export interface VidaItemUpdateInput {
  id: string
  days?: VidaDayOfWeek[]
  notes?: string | null
  isActive?: boolean
  orderIndex?: number
}

export interface VidaItemDeleteInput {
  id: string
}

export interface VidaMarkTakenTodayInput {
  vidaItemId: string
  date: string
}

export interface VidaUnmarkTakenTodayInput {
  vidaItemId: string
  date: string
}
