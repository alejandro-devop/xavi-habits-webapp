import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACTIVITY_TRACKING_STORAGE_KEY,
  useActivityTrackingStore,
} from '@/features/activities/store/activity-tracking.store'

describe('activity-tracking.store', () => {
  beforeEach(() => {
    localStorage.removeItem(ACTIVITY_TRACKING_STORAGE_KEY)
    useActivityTrackingStore.setState({ session: null })
  })

  it('persists running session to localStorage', () => {
    const session = {
      activityId: '1',
      activityTitle: 'Deep work',
      startedAt: '2026-05-20T10:00:00.000Z',
    }

    useActivityTrackingStore.getState().startSession(session)
    expect(useActivityTrackingStore.getState().session).toEqual(session)

    const stored = localStorage.getItem(ACTIVITY_TRACKING_STORAGE_KEY)
    expect(stored).toContain('Deep work')
  })

  it('clearSession removes active session', () => {
    useActivityTrackingStore.getState().startSession({
      activityId: '1',
      activityTitle: 'Test',
      startedAt: new Date().toISOString(),
    })
    useActivityTrackingStore.getState().clearSession()
    expect(useActivityTrackingStore.getState().session).toBeNull()
  })
})
