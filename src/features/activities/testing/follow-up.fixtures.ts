import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

export function closedFollowUp(
  overrides: Partial<ActivityFollowUp> = {},
): ActivityFollowUp {
  return {
    id: '1',
    activityId: '7',
    date: '2026-05-20',
    startTime: '09:00:00',
    durationMinutes: 60,
    isOpen: false,
    endTime: '10:00:00',
    endDate: '2026-05-20',
    endDateTime: '2026-05-20T10:00:00',
    notes: null,
    ...overrides,
  }
}
