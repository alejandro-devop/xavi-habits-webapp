import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getCurrentLocalTime } from '@/features/activities/utils/activity-time.utils'
import { useActiveWeeklyRoutineQuery } from '@/features/weekly-routine/hooks/useWeeklyRoutine'
import type { RoutineNowStatus } from '@/features/weekly-routine/utils/routine-suggestion.utils'
import {
  getCurrentDayOfWeek,
  getRoutineActivityWindow,
  getRoutineNowStatus,
} from '@/features/weekly-routine/utils/routine-suggestion.utils'
import {
  timeToMinutes,
  formatBlockTime,
  formatEventTime,
} from '@/features/weekly-routine/utils/planner.utils'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './RoutineTodayWidget.module.scss'

const WINDOW_BEFORE = 2
const WINDOW_AFTER = 2

function getActivityAccent(activity: WeeklyRoutineActivity): string {
  return activity.activity?.category?.color ?? 'var(--color-primary)'
}

function NowIndicator({ status }: { status: RoutineNowStatus }) {
  if (status.kind === 'done') {
    return (
      <div className={[styles.nowIndicator, styles.nowIndicatorDone].join(' ')}>
        <span className={styles.nowIndicatorIcon}>
          <AppIcon name="check" size="sm" decorative />
        </span>
        <div className={styles.nowIndicatorInfo}>
          <span className={styles.nowIndicatorLabel}>Rutina completada</span>
          <span className={styles.nowIndicatorMeta}>No quedan bloques para hoy</span>
        </div>
      </div>
    )
  }

  const { activity } = status
  const accent = getActivityAccent(activity)
  const icon = activity.activity?.category?.icon ?? 'clock'
  const title = activity.activity?.title ?? '—'
  const isInProgress = status.kind === 'in_progress'

  return (
    <div
      className={styles.nowIndicator}
      style={
        {
          '--now-accent': accent,
          '--now-accent-bg': `color-mix(in srgb, ${accent} 12%, transparent)`,
          '--now-accent-border': `color-mix(in srgb, ${accent} 28%, transparent)`,
        } as React.CSSProperties
      }
    >
      <span className={styles.nowIndicatorIcon}>
        <AppIcon name={icon} size="sm" decorative />
      </span>
      <div className={styles.nowIndicatorInfo}>
        <span className={styles.nowIndicatorLabel}>
          {isInProgress ? 'Ahora toca' : 'Siguiente bloque'}
        </span>
        <span className={styles.nowIndicatorTitle}>{title}</span>
        <span className={styles.nowIndicatorMeta}>
          {isInProgress
            ? formatEventTime(activity.startTime, activity.durationMinutes)
            : `Empieza a las ${formatBlockTime(activity.startTime)}`}
        </span>
      </div>
      {isInProgress && <span className={styles.nowIndicatorPulse} aria-hidden />}
    </div>
  )
}

export function RoutineTodayWidget() {
  const todayDow = getCurrentDayOfWeek()
  const [nowTime, setNowTime] = useState(getCurrentLocalTime)

  useEffect(() => {
    const id = window.setInterval(() => setNowTime(getCurrentLocalTime()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const nowMinutes = timeToMinutes(nowTime)

  const { data: routine, isLoading } = useActiveWeeklyRoutineQuery()

  const activities = useMemo(() => {
    const todaySchedule = routine?.schedule?.find((d) => d.dayOfWeek === todayDow)
    return [...(todaySchedule?.activities ?? [])].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    )
  }, [routine, todayDow])

  const nowStatus = useMemo(
    () => getRoutineNowStatus(activities, nowMinutes),
    [activities, nowMinutes],
  )

  const expectedActivityId =
    nowStatus?.kind === 'in_progress' || nowStatus?.kind === 'upcoming'
      ? nowStatus.activity.id
      : null

  const { visible, hasMoreBefore, hasMoreAfter } = useMemo(
    () => getRoutineActivityWindow(activities, nowMinutes, WINDOW_BEFORE, WINDOW_AFTER),
    [activities, nowMinutes],
  )

  const isEmpty = !isLoading && activities.length === 0

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>Rutina de hoy</span>
        <Link to="/app/weekly-routine" className={styles.link}>
          Ver rutina
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner size="sm" />
        </div>
      ) : !routine ? (
        <p className={styles.empty}>Sin rutina activa.</p>
      ) : isEmpty ? (
        <p className={styles.empty}>No hay actividades programadas para hoy.</p>
      ) : (
        <>
          {nowStatus && <NowIndicator status={nowStatus} />}

          <div className={styles.listViewport}>
            {hasMoreBefore && <div className={styles.mistTop} aria-hidden />}
            <ul className={styles.list}>
              {visible.map((act) => {
                const start = timeToMinutes(act.startTime)
                const end = start + act.durationMinutes
                const isExpected = act.id === expectedActivityId
                const isInProgress = isExpected && nowStatus?.kind === 'in_progress'
                const isUpcoming = isExpected && nowStatus?.kind === 'upcoming'
                const isPast = end <= nowMinutes
                const color = act.activity?.category?.color ?? 'var(--color-primary)'
                const icon = act.activity?.category?.icon

                return (
                  <li
                    key={act.id}
                    className={[
                      styles.item,
                      isInProgress ? styles.itemCurrent : '',
                      isUpcoming ? styles.itemUpcoming : '',
                      isPast ? styles.itemPast : '',
                    ].join(' ')}
                  >
                    <span className={styles.timeCol}>
                      <span className={styles.time}>{formatBlockTime(act.startTime)}</span>
                    </span>
                    <span
                      className={styles.dot}
                      style={{ background: isExpected || !isPast ? color : undefined }}
                    />
                    <span className={styles.info}>
                      {icon && (
                        <AppIcon
                          name={icon}
                          size="2xs"
                          className={styles.icon}
                          decorative
                        />
                      )}
                      <span className={styles.name}>
                        {act.activity?.title ?? '—'}
                      </span>
                      <span className={styles.duration}>{act.durationMinutes} min</span>
                    </span>
                    {isInProgress && <span className={styles.nowBadge}>Ahora</span>}
                    {isUpcoming && <span className={styles.nextBadge}>Siguiente</span>}
                  </li>
                )
              })}
            </ul>
            {hasMoreAfter && <div className={styles.mistBottom} aria-hidden />}
          </div>
        </>
      )}
    </div>
  )
}
