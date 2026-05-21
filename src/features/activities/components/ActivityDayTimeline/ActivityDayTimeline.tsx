import { useMemo } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpTimelineEntry } from '@/features/activities/components/ActivityFollowUpTimelineEntry'
import { ActivityTimelineNowEntry } from '@/features/activities/components/ActivityTimelineNowEntry'
import {
  getCurrentLocalTime,
  parseTimeToMinutes,
  sortFollowUpsByStartTimeAsc,
} from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityDayTimeline.module.scss'

type ActivityDayTimelineProps = {
  followUps: ActivityFollowUp[]
  showCurrentTimeMarker?: boolean
  onFollowUpClick: (followUp: ActivityFollowUp) => void
}

type TimelineListItem =
  | { kind: 'now' }
  | { kind: 'follow-up'; followUp: ActivityFollowUp }

function buildTimelineItems(
  followUps: ActivityFollowUp[],
  showNow: boolean,
): TimelineListItem[] {
  const sorted = sortFollowUpsByStartTimeAsc(followUps)
  if (!showNow) {
    return sorted.map((followUp) => ({ kind: 'follow-up', followUp }))
  }

  const nowMinutes = parseTimeToMinutes(getCurrentLocalTime())
  const insertIndex = sorted.findIndex(
    (followUp) => parseTimeToMinutes(followUp.startTime) > nowMinutes,
  )
  const nowAt = insertIndex === -1 ? sorted.length : insertIndex

  const items: TimelineListItem[] = []
  sorted.forEach((followUp, index) => {
    if (index === nowAt) items.push({ kind: 'now' })
    items.push({ kind: 'follow-up', followUp })
  })
  if (nowAt === sorted.length) items.push({ kind: 'now' })
  return items
}

export function ActivityDayTimeline({
  followUps,
  showCurrentTimeMarker = false,
  onFollowUpClick,
}: ActivityDayTimelineProps) {
  const items = useMemo(
    () => buildTimelineItems(followUps, showCurrentTimeMarker),
    [followUps, showCurrentTimeMarker],
  )

  if (items.length === 0) return null

  return (
    <ol className={styles.root} aria-label="Registros del día en orden cronológico">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        if (item.kind === 'now') {
          return <ActivityTimelineNowEntry key="now" enabled isLast={isLast} />
        }

        return (
          <ActivityFollowUpTimelineEntry
            key={item.followUp.id}
            followUp={item.followUp}
            isLast={isLast}
            onClick={onFollowUpClick}
          />
        )
      })}
    </ol>
  )
}
