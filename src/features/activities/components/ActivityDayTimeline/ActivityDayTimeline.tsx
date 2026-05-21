import { useMemo } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityHourBlock } from '@/features/activities/components/ActivityHourBlock'
import {
  getTimelineHours,
  groupFollowUpsByHour,
} from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityDayTimeline.module.scss'

type ActivityDayTimelineProps = {
  followUps: ActivityFollowUp[]
  onFollowUpClick: (followUp: ActivityFollowUp) => void
}

export function ActivityDayTimeline({ followUps, onFollowUpClick }: ActivityDayTimelineProps) {
  const grouped = useMemo(() => groupFollowUpsByHour(followUps), [followUps])
  const hours = getTimelineHours()

  return (
    <div className={styles.root} role="list" aria-label="Timeline del día">
      {hours.map((hour) => (
        <ActivityHourBlock
          key={hour}
          hour={hour}
          followUps={grouped.get(hour) ?? []}
          onFollowUpClick={onFollowUpClick}
        />
      ))}
    </div>
  )
}
