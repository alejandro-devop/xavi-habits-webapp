import { Link } from 'react-router'
import { useHabitMyDayQuery, useHabitFollowUpsInDatesQuery } from '@/features/habits/hooks/useHabits'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './HabitsWidget.module.scss'

const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export function HabitsWidget() {
  const today = new Date().toISOString().split('T')[0]
  const last7 = getLast7Days()
  const from = last7[0]
  const to = last7[last7.length - 1]

  const { data, isLoading } = useHabitMyDayQuery(today)
  const { data: weekData } = useHabitFollowUpsInDatesQuery(from, to)

  const total = data?.length ?? 0
  const accomplished =
    data?.filter((e) => e.followUp?.isAccomplished || e.followUp?.isLifeline).length ?? 0
  const failed = data?.filter((e) => e.followUp?.isFailed).length ?? 0
  const pending = total - accomplished - failed

  const pctAccomplished = total > 0 ? (accomplished / total) * 100 : 0
  const pctFailed = total > 0 ? (failed / total) * 100 : 0

  // Count accomplished follow-ups per day for the strip
  const accomplishedByDate = new Map<string, number>()
  for (const group of weekData ?? []) {
    const count = group.followUps.filter((f) => f.isAccomplished || f.isLifeline).length
    accomplishedByDate.set(group.date, count)
  }
  const maxCount = Math.max(1, ...Array.from(accomplishedByDate.values()))

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>Hábitos de hoy</span>
        <Link to={habitsPaths.myDay} className={styles.link}>
          Ver todo
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner size="sm" />
        </div>
      ) : total === 0 ? (
        <p className={styles.empty}>No hay hábitos para hoy.</p>
      ) : (
        <>
          <div className={styles.progressBar}>
            <div className={styles.barAccomplished} style={{ width: `${pctAccomplished}%` }} />
            <div className={styles.barFailed} style={{ width: `${pctFailed}%` }} />
          </div>
          <div className={styles.stats}>
            <span className={styles.statAccomplished}>
              {accomplished} logrado{accomplished !== 1 ? 's' : ''}
            </span>
            <span className={styles.statPending}>
              {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
            {failed > 0 && (
              <span className={styles.statFailed}>
                {failed} fallado{failed !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <ul className={styles.list}>
            {data!.slice(0, 6).map((entry) => {
              const { habit, followUp } = entry
              const isAccomplished = followUp?.isAccomplished || followUp?.isLifeline
              const isFailed = followUp?.isFailed
              return (
                <li key={habit.id} className={styles.item}>
                  {habit.icon ? (
                    <AppIcon name={habit.icon} size="sm" className={styles.icon} decorative />
                  ) : (
                    <span className={styles.iconPlaceholder} />
                  )}
                  <span className={styles.habitName}>{habit.name}</span>
                  <span
                    className={[
                      styles.dot,
                      isAccomplished
                        ? styles.dotDone
                        : isFailed
                          ? styles.dotFailed
                          : styles.dotPending,
                    ].join(' ')}
                  />
                </li>
              )
            })}
          </ul>

          {data!.length > 6 && (
            <p className={styles.more}>+{data!.length - 6} más</p>
          )}

          {/* 7-day strip */}
          <div className={styles.weekStrip}>
            {last7.map((date) => {
              const count = accomplishedByDate.get(date) ?? 0
              const pct = Math.round((count / maxCount) * 100)
              const isToday = date === today
              const dayLetter = DAY_LETTERS[new Date(date + 'T12:00:00').getDay()]
              return (
                <div key={date} className={styles.stripDay}>
                  <div className={styles.stripBarTrack}>
                    <div
                      className={[styles.stripBar, pct > 0 ? styles.stripBarFilled : ''].join(' ')}
                      style={{ height: pct > 0 ? `${Math.max(pct, 15)}%` : '3px' }}
                    />
                  </div>
                  <span className={[styles.stripLabel, isToday ? styles.stripLabelToday : ''].join(' ')}>
                    {dayLetter}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
