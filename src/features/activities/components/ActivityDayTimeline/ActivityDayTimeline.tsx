import { useMemo } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpTimelineEntry } from '@/features/activities/components/ActivityFollowUpTimelineEntry'
import { ActivityFreeSlotTimelineEntry } from '@/features/activities/components/ActivityFreeSlotTimelineEntry'
import { ActivityTimelineNowEntry } from '@/features/activities/components/ActivityTimelineNowEntry'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  buildTimelineItems,
  getFreeSlotsBetweenFollowUps,
} from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityDayTimeline.module.scss'

type ActivityDayTimelineProps = {
  date: string
  followUps: ActivityFollowUp[]
  showCurrentTimeMarker?: boolean
  onFollowUpClick: (followUp: ActivityFollowUp) => void
  onFreeSlotClick: (slot: TimelineFreeSlot) => void
}

export function ActivityDayTimeline({
  date,
  followUps,
  showCurrentTimeMarker = false,
  onFollowUpClick,
  onFreeSlotClick,
}: ActivityDayTimelineProps) {
  const items = useMemo(() => {
    const freeSlots = getFreeSlotsBetweenFollowUps(date, followUps)
    return buildTimelineItems(followUps, freeSlots, {
      showNow: showCurrentTimeMarker,
      date,
    })
  }, [date, followUps, showCurrentTimeMarker])

  if (items.length === 0) return null

  return (
    <ol className={styles.root} aria-label="Registros del día, más reciente arriba">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        if (item.type === 'now') {
          return <ActivityTimelineNowEntry key="now" enabled isLast={isLast} />
        }

        if (item.type === 'free-slot') {
          return (
            <ActivityFreeSlotTimelineEntry
              key={item.data.id}
              slot={item.data}
              isLast={isLast}
              onClick={onFreeSlotClick}
            />
          )
        }

        return (
          <ActivityFollowUpTimelineEntry
            key={item.data.id}
            followUp={item.data}
            isLast={isLast}
            onClick={onFollowUpClick}
          />
        )
      })}
    </ol>
  )
}
