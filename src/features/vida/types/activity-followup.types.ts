import type { ActivityStatus, ActivitySubtasksCount } from '@/features/vida/types/activity.types'

export interface ActivityFollowUpActivityRef {
  id: string
  title: string
  description?: string | null
  /**
   * Opcional porque **no todos los documentos la piden**: la piden los de
   * `vida-items` (FEAT-003, tajada 5, para no armar el día con una actividad
   * archivada) y no los de follow-ups ni los del plan del día. Quien la mire
   * tiene que tratar `undefined` como «no se sabe», nunca como «está viva».
   */
  status?: ActivityStatus
  category?: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export interface ActivityFollowUpSubtask {
  id: string
  followUpId: string
  activitySubtaskId: string | null
  title: string
  isCompleted: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ActivityFollowUp {
  id: string
  activityId: string
  date: string
  startTime: string
  durationMinutes: number | null
  isOpen?: boolean
  endTime: string | null
  endDate: string | null
  endDateTime: string | null
  notes: string | null
  activity?: ActivityFollowUpActivityRef | null
  sessionSubtasks?: ActivityFollowUpSubtask[]
  sessionSubtasksCount?: ActivitySubtasksCount
}

export type ActivityDayFollowUp = ActivityFollowUp

export interface ActivityFollowUpInput {
  activityId: string
  date: string
  startTime: string
  durationMinutes: number
  notes?: string | null
  /** UUID v7 del cliente para idempotencia offline. */
  clientId?: string | null
}

export interface ActivityFollowUpStartInput {
  activityId: string
  date: string
  startTime: string
  notes?: string | null
  /** UUID v7 del cliente para idempotencia offline. */
  clientId?: string | null
  /** IDs de subtareas de la actividad a incluir en esta ejecución. */
  subtaskIds?: string[]
}

/** Backend edit input: id required; other fields optional (no activityId). */
export interface ActivityFollowUpEditInput {
  id: string
  date?: string
  startTime?: string
  durationMinutes?: number
  notes?: string | null
}

/**
 * Marcar o desmarcar una subtarea **de esta ejecución** (criterio 10). No crea
 * ni borra nada: las subtareas se crean en la actividad, no desde aquí.
 */
export interface ActivityFollowUpSubtaskEditInput {
  followUpId: string
  sessionSubtaskId: string
  isCompleted: boolean
}

export interface ActivityFollowUpsDateGroup {
  date: string
  followUps: ActivityFollowUp[]
}
