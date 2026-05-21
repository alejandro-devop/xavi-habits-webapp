import { useMemo } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpTimelineEntry } from '@/features/activities/components/ActivityFollowUpTimelineEntry'
import { ActivityFreeSlotTimelineEntry } from '@/features/activities/components/ActivityFreeSlotTimelineEntry'
import { ActivityTimelineNowEntry } from '@/features/activities/components/ActivityTimelineNowEntry'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  buildTimelineItems,
  getFreeSlotsBetweenFollowUps,
  getMostRecentFollowUp,
} from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityDayTimeline.module.scss'

type ActivityDayTimelineProps = {
  date: string
  followUps: ActivityFollowUp[]
  freeSlots?: TimelineFreeSlot[]
  showCurrentTimeMarker?: boolean
  quickActionsDisabled?: boolean
  onFollowUpClick: (followUp: ActivityFollowUp) => void
  onFreeSlotClick: (slot: TimelineFreeSlot) => void
  onContinueAfterFollowUp?: (followUp: ActivityFollowUp) => void
  onStartFromFollowUp?: (followUp: ActivityFollowUp) => void
}

export function ActivityDayTimeline({
  date,
  followUps,
  freeSlots: freeSlotsProp,
  showCurrentTimeMarker = false,
  quickActionsDisabled = false,
  onFollowUpClick,
  onFreeSlotClick,
  onContinueAfterFollowUp,
  onStartFromFollowUp,
}: ActivityDayTimelineProps) {
  const mostRecentFollowUpId = useMemo(
    () => getMostRecentFollowUp(date, followUps)?.id ?? null,
    [date, followUps],
  )

  const items = useMemo(() => {
    const freeSlots = freeSlotsProp ?? getFreeSlotsBetweenFollowUps(date, followUps)
    return buildTimelineItems(followUps, freeSlots, {
      showNow: showCurrentTimeMarker,
      date,
    })
  }, [date, followUps, freeSlotsProp, showCurrentTimeMarker])

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
            showQuickActions={
              item.data.id === mostRecentFollowUpId &&
              Boolean(onContinueAfterFollowUp || onStartFromFollowUp)
            }
            quickActionsDisabled={quickActionsDisabled}
            onClick={onFollowUpClick}
            onContinueAfter={onContinueAfterFollowUp}
            onStartFrom={onStartFromFollowUp}
          />
        )
      })}
    </ol>
  )
}
