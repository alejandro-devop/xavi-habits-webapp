export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent'

/** Referencia para fases posteriores — sin CRUD en 6.1 */
export interface Activity {
  id: string
  userId: number
  title: string
  description: string | null
  status: ActivityStatus
  priority: ActivityPriority
  categoryId: string | null
  scheduledDate: string | null
  completedAt: string | null
  spentTimeMinutes: number
}
