import { describe, expect, it } from 'vitest'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import {
  formatHoursFromMinutes,
  getCategoryTimeFromFollowUps,
  UNCATEGORIZED_CATEGORY_ID,
} from '@/features/activities/utils/activity-category-metrics.utils'

const followUp = (
  durationMinutes: number,
  category?: ActivityFollowUp['activity'],
): ActivityFollowUp => ({
  id: `fu-${durationMinutes}-${category?.category?.id ?? 'none'}`,
  activityId: 'a1',
  date: '2026-05-20',
  startTime: '09:00:00',
  durationMinutes,
  endTime: '10:00:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T10:00:00',
  notes: null,
  activity: category,
})

describe('activity-category-metrics.utils', () => {
  it('formatHoursFromMinutes uses decimal hours', () => {
    expect(formatHoursFromMinutes(90)).toBe('1.5 h')
    expect(formatHoursFromMinutes(60)).toBe('1 h')
    expect(formatHoursFromMinutes(0)).toBe('0 h')
  })

  it('getCategoryTimeFromFollowUps groups and sorts by minutes desc', () => {
    const metrics = getCategoryTimeFromFollowUps([
      followUp(60, {
        id: 'a1',
        title: 'Work',
        category: { id: 'work', name: 'Trabajo', color: '#3366ff', icon: 'laptop' },
      }),
      followUp(30, {
        id: 'a2',
        title: 'Gym',
        category: { id: 'fit', name: 'Fitness', color: '#22aa44', icon: 'dumbbell' },
      }),
      followUp(30, {
        id: 'a3',
        title: 'More work',
        category: { id: 'work', name: 'Trabajo', color: '#3366ff', icon: 'laptop' },
      }),
    ])

    expect(metrics.totalMinutes).toBe(120)
    expect(metrics.entries).toHaveLength(2)
    expect(metrics.entries[0].id).toBe('work')
    expect(metrics.entries[0].minutes).toBe(90)
    expect(metrics.entries[0].percentage).toBe(75)
    expect(metrics.entries[1].id).toBe('fit')
    expect(metrics.entries[1].minutes).toBe(30)
  })

  it('getCategoryTimeFromFollowUps buckets missing category', () => {
    const metrics = getCategoryTimeFromFollowUps([
      followUp(45, { id: 'a1', title: 'Misc' }),
    ])

    expect(metrics.entries[0].id).toBe(UNCATEGORIZED_CATEGORY_ID)
    expect(metrics.entries[0].name).toBe('Sin categoría')
  })
})
