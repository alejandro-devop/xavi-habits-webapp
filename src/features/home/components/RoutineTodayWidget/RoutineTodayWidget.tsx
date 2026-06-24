import { Link } from 'react-router'
import { useActiveWeeklyRoutineQuery } from '@/features/weekly-routine/hooks/useWeeklyRoutine'
import {
  getDayOfWeekForDate,
  findCurrentRoutineActivity,
} from '@/features/weekly-routine/utils/routine-suggestion.utils'
import { timeToMinutes, formatBlockTime } from '@/features/weekly-routine/utils/planner.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './RoutineTodayWidget.module.scss'

function getCurrentMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function RoutineTodayWidget() {
  const today = new Date().toISOString().split('T')[0]
  const todayDow = getDayOfWeekForDate(today)
  const nowMinutes = getCurrentMinutes()

  const { data: routine, isLoading } = useActiveWeeklyRoutineQuery()

  const todaySchedule = routine?.schedule?.find((d) => d.dayOfWeek === todayDow)
  const activities = [...(todaySchedule?.activities ?? [])].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  const currentActivity = routine ? findCurrentRoutineActivity(activities, nowMinutes) : null

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
        <ul className={styles.list}>
          {activities.slice(0, 8).map((act) => {
            const start = timeToMinutes(act.startTime)
            const end = start + act.durationMinutes
            const isCurrent = currentActivity?.id === act.id
            const isPast = end <= nowMinutes
            const color = act.activity?.category?.color ?? 'var(--color-primary)'
            const icon = act.activity?.category?.icon

            return (
              <li
                key={act.id}
                className={[
                  styles.item,
                  isCurrent ? styles.itemCurrent : '',
                  isPast ? styles.itemPast : '',
                ].join(' ')}
              >
                <span className={styles.timeCol}>
                  <span className={styles.time}>{formatBlockTime(act.startTime)}</span>
                </span>
                <span
                  className={styles.dot}
                  style={{ background: isCurrent || !isPast ? color : undefined }}
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
                {isCurrent && <span className={styles.nowBadge}>Ahora</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
