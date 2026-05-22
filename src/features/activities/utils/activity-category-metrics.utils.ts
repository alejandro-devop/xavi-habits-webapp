import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__'

export type CategoryTimeEntry = {
  id: string
  name: string
  color: string
  icon: string | null
  minutes: number
  hours: number
  percentage: number
}

export type CategoryTimeMetrics = {
  entries: CategoryTimeEntry[]
  totalMinutes: number
  totalHours: number
}

/** Decimal hours label, e.g. "2.5 h", "1 h", "0 h". */
export function formatHoursFromMinutes(minutes: number): string {
  const safe = Math.max(0, minutes)
  const hours = safe / 60
  if (hours === 0) return '0 h'
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? `${rounded} h` : `${rounded} h`
}

function getCategoryKey(followUp: ActivityFollowUp): string {
  return followUp.activity?.category?.id ?? UNCATEGORIZED_CATEGORY_ID
}

export function getCategoryTimeFromFollowUps(
  followUps: ActivityFollowUp[],
): CategoryTimeMetrics {
  const totals = new Map<
    string,
    { name: string; color: string; icon: string | null; minutes: number }
  >()

  for (const followUp of followUps) {
    const minutes = Math.max(0, followUp.durationMinutes)
    if (minutes === 0) continue

    const category = followUp.activity?.category
    const id = getCategoryKey(followUp)
    const existing = totals.get(id)

    if (existing) {
      existing.minutes += minutes
      continue
    }

    totals.set(id, {
      name: category?.name ?? 'Sin categoría',
      color: category?.color ?? 'var(--color-text-muted)',
      icon: category?.icon ?? null,
      minutes,
    })
  }

  const totalMinutes = [...totals.values()].reduce((sum, row) => sum + row.minutes, 0)

  const entries: CategoryTimeEntry[] = [...totals.entries()]
    .map(([id, row]) => {
      const hours = row.minutes / 60
      const percentage =
        totalMinutes > 0 ? Math.round((row.minutes / totalMinutes) * 100) : 0
      return {
        id,
        name: row.name,
        color: row.color,
        icon: row.icon,
        minutes: row.minutes,
        hours,
        percentage,
      }
    })
    .sort((a, b) => b.minutes - a.minutes)

  return {
    entries,
    totalMinutes,
    totalHours: totalMinutes / 60,
  }
}
