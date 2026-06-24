import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  useActivityOpenFollowUpQuery,
  useActivityDayFollowUpsQuery,
} from '@/features/activities/hooks/useActivityFollowUps'
import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'
import {
  getCurrentLocalDate,
  formatDurationMinutes,
} from '@/features/activities/utils/activity-time.utils'
import { openFollowUpToRunningSession } from '@/features/activities/utils/activity-followup-form'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './ActivitiesWidget.module.scss'

function RunningBadge({ session }: { session: RunningActivitySession }) {
  const elapsed = useElapsedTimer(session.startedAt, 'compact')
  const color = session.categoryColor ?? 'var(--color-primary)'

  return (
    <div
      className={styles.runningCard}
      style={
        {
          '--session-accent': color,
          '--session-accent-bg': `color-mix(in srgb, ${color} 12%, transparent)`,
          '--session-accent-border': `color-mix(in srgb, ${color} 30%, transparent)`,
        } as React.CSSProperties
      }
    >
      <span className={styles.runningIcon}>
        <AppIcon name={session.categoryIcon ?? 'clock'} size="sm" decorative />
      </span>
      <div className={styles.runningInfo}>
        <span className={styles.runningLabel}>En curso</span>
        <span className={styles.runningTitle}>{session.activityTitle}</span>
      </div>
      <span className={styles.elapsed}>{elapsed}</span>
    </div>
  )
}

export function ActivitiesWidget() {
  const today = getCurrentLocalDate()
  const { data: openFollowUp, isLoading: loadingOpen } = useActivityOpenFollowUpQuery()
  const { data: dayFollowUps, isLoading: loadingDay } = useActivityDayFollowUpsQuery(today)

  const session = useMemo(
    () => (openFollowUp ? openFollowUpToRunningSession(openFollowUp) : null),
    [openFollowUp],
  )

  const completedSessions = (dayFollowUps ?? []).filter(
    (f) => !f.isOpen && f.durationMinutes != null,
  )
  const totalMinutes = completedSessions.reduce((sum, f) => sum + (f.durationMinutes ?? 0), 0)

  const isLoading = loadingOpen || loadingDay
  const isEmpty = !session && completedSessions.length === 0

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>Actividades</span>
        <Link to={activitiesPaths.tracking} className={styles.link}>
          Rastrear
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          {session && <RunningBadge session={session} />}

          {completedSessions.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryHeader}>
                <span className={styles.sectionLabel}>Hoy</span>
                <span className={styles.totalTime}>{formatDurationMinutes(totalMinutes)}</span>
              </div>
              <ul className={styles.sessionList}>
                {completedSessions.slice(0, 4).map((f) => {
                  const color = f.activity?.category?.color ?? 'var(--color-primary)'
                  return (
                    <li key={f.id} className={styles.sessionItem}>
                      <span className={styles.sessionDot} style={{ background: color }} />
                      <span className={styles.sessionName}>{f.activity?.title ?? '—'}</span>
                      <span className={styles.sessionDuration}>
                        {formatDurationMinutes(f.durationMinutes!)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {completedSessions.length > 4 && (
                <p className={styles.more}>+{completedSessions.length - 4} más</p>
              )}
            </div>
          )}

          {isEmpty && <p className={styles.empty}>Sin actividades registradas hoy.</p>}
        </>
      )}
    </div>
  )
}
