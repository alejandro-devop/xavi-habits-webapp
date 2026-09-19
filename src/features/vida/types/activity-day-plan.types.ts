import type { ActivityFollowUpActivityRef } from '@/features/vida/types/activity-followup.types'

/**
 * Plan del día: los bloques que el usuario deja puestos para una fecha.
 * Espejo de `xavi-platform-node/src/graphql/modules/activity-day-plan/activity-day-plan.schema.ts`
 * (SDL vendorizado en `graphql/schema/activity-day-plan.schema.graphql`).
 *
 * `activity` es `Activity!` en el esquema, pero los documentos de este módulo
 * seleccionan de ella el mismo subconjunto que los de follow-ups
 * (`id title description category { … }`), así que el tipo es el mismo
 * `ActivityFollowUpActivityRef` de la tajada 2 en vez de una copia nueva. Si
 * algún día se pide la actividad entera, el tipo sube a `Activity`.
 */
export interface ActivityDayPlanItem {
  id: string
  userId: number
  activityId: string
  /** Fecha local del plan, `YYYY-MM-DD`. */
  date: string
  /** Hora local de inicio, `HH:mm`. */
  startTime: string
  /** Hora local de fin, `HH:mm`. */
  endTime: string
  orderIndex: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
  activity?: ActivityFollowUpActivityRef | null
}

/**
 * `clientId` (UUID v7) existe en los inputs del esquema para idempotencia
 * offline. **Ningún hook lo genera todavía**: la web es el piloto y no hay modo
 * offline. Cuando lo haya, se genera en el hook (no en el api) y se guarda con
 * el borrador; hasta entonces va opcional y sin emisor.
 */
export interface ActivityDayPlanSetItemInput {
  activityId: string
  startTime: string
  endTime: string
  orderIndex?: number
  /** UUID v7 del cliente para idempotencia offline. Hoy nadie lo emite. */
  clientId?: string | null
}

export interface ActivityDayPlanSetInput {
  date: string
  items: ActivityDayPlanSetItemInput[]
}

export interface ActivityDayPlanItemAddInput {
  date: string
  activityId: string
  startTime: string
  endTime: string
  orderIndex?: number
  /** UUID v7 del cliente para idempotencia offline. Hoy nadie lo emite. */
  clientId?: string | null
}

export interface ActivityDayPlanItemEditInput {
  itemId: string
  startTime?: string
  endTime?: string
  orderIndex?: number
  isCompleted?: boolean
}

export interface ActivityDayPlanItemRemoveInput {
  itemId: string
}
