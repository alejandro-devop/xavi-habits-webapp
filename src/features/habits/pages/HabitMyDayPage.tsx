import { useMemo, useState } from 'react'
import {
  useHabitFollowUpsInDatesQuery,
  useHabitMyDayQuery,
} from '@/features/habits/hooks/useHabits'
import { HabitDayCard } from '@/features/habits/components/HabitDayCard'
import { HabitWeekSelector } from '@/features/habits/components/HabitWeekSelector'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import {
  getMonthDaysForWeek,
  getMonthRange,
  getMyDayFocusDate,
  getWeekEnd,
  getYearMonthFromDate,
  isFutureWeek,
} from '@/features/habits/utils/habit-week.utils'
import type { HabitFollowUp } from '@/features/habits/types/habit.types'
import styles from './HabitMyDayPage.module.scss'

export function HabitMyDayPage() {
  const today = getTodayString()
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today))
  const focusDate = getMyDayFocusDate(weekStart, today)
  const canRegister = !isFutureWeek(weekStart, today)
  const weekEnd = getWeekEnd(weekStart)

  const { year, month } = useMemo(() => getYearMonthFromDate(weekStart), [weekStart])
  const monthRange = useMemo(() => getMonthRange(year, month), [year, month])
  const monthDays = useMemo(
    () => getMonthDaysForWeek(year, month, weekStart, today),
    [year, month, weekStart, today],
  )

  const { data, isLoading } = useHabitMyDayQuery(focusDate)
  const { data: followUpGroups } = useHabitFollowUpsInDatesQuery(monthRange.from, monthRange.to)

  const followUpsByHabit = useMemo(() => {
    const byHabit = new Map<string, Map<string, HabitFollowUp>>()
    if (!followUpGroups) return byHabit

    for (const group of followUpGroups) {
      for (const fu of group.followUps) {
        let byDate = byHabit.get(fu.habitId)
        if (!byDate) {
          byDate = new Map()
          byHabit.set(fu.habitId, byDate)
        }
        byDate.set(fu.date, {
          id: fu.id,
          date: fu.date,
          habitId: fu.habitId,
          isAccomplished: fu.isAccomplished,
          isFailed: fu.isFailed,
          isLifeline: fu.isLifeline,
          difficulty: fu.difficulty,
          count: fu.count,
          time: fu.time,
          notes: null,
          story: null,
          archived: false,
        })
      }
    }
    return byHabit
  }, [followUpGroups])

  if (isLoading) {
    return (
      <div className={styles.root}>
        <HabitWeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />
        <div className={styles.center}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.root}>
        <HabitWeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />
        <EmptyState
          title="Sin hábitos activos"
          description={
            canRegister
              ? 'Crea un hábito para empezar a registrar tu progreso diario.'
              : 'No hay hábitos que mostrar en esta semana futura.'
          }
        />
      </div>
    )
  }

  const total = data.length
  const accomplished = data.filter((e) => e.followUp?.isAccomplished || e.followUp?.isLifeline).length
  const failed = data.filter((e) => e.followUp?.isFailed).length
  const pending = total - accomplished - failed

  const pctAccomplished = total > 0 ? (accomplished / total) * 100 : 0
  const pctFailed = total > 0 ? (failed / total) * 100 : 0
  const pctPending = total > 0 ? (pending / total) * 100 : 0

  return (
    <div className={styles.root}>
      <HabitWeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />

      <header className={styles.pageHeader}>
        <h1 className={styles.date}>{formatWeekHeading(weekStart, weekEnd, today)}</h1>

        {!canRegister && (
          <p className={styles.futureHint}>
            Semana futura — solo consulta; no se pueden registrar follow-ups.
          </p>
        )}

        <div className={styles.summaryBar}>
          <div className={styles.barTrack}>
            <div className={styles.barAccomplished} style={{ width: `${pctAccomplished}%` }} />
            <div className={styles.barFailed} style={{ width: `${pctFailed}%` }} />
            <div className={styles.barPending} style={{ width: `${pctPending}%` }} />
          </div>
          <div className={styles.barLegend}>
            <span className={styles.legendAccomplished}>
              {accomplished} logrado{accomplished !== 1 ? 's' : ''}
            </span>
            <span className={styles.legendFailed}>
              {failed} fallado{failed !== 1 ? 's' : ''}
            </span>
            <span className={styles.legendPending}>
              {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.listHeader} aria-hidden>
        <div className={styles.listHeaderIdentity} />
        <div className={styles.listHeaderDays}>
          {monthDays.map((day) => (
            <span
              key={day.date}
              className={[
                styles.listHeaderDay,
                day.isInWeek ? styles.listHeaderDayInWeek : styles.listHeaderDayMonthOnly,
                day.isToday ? styles.listHeaderDayToday : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.listHeaderDayLabel}>{day.label.slice(0, 3)}</span>
              <span className={styles.listHeaderDayNumber}>{day.dayNumber}</span>
            </span>
          ))}
        </div>
      </div>

      <ul className={styles.list}>
        {data.map((entry) => (
          <li key={entry.habit.id}>
            <HabitDayCard
              entry={entry}
              date={focusDate}
              days={monthDays}
              followUpByDate={followUpsByHabit.get(entry.habit.id) ?? EMPTY_FOLLOW_UP_MAP}
              canRegister={canRegister}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

const EMPTY_FOLLOW_UP_MAP = new Map<string, HabitFollowUp>()

function formatWeekHeading(weekStart: string, weekEnd: string, today: string): string {
  if (getMondayOfWeek(today) === weekStart) {
    const date = new Date(today + 'T12:00:00')
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const start = new Date(weekStart + 'T12:00:00Z')
  const end = new Date(weekEnd + 'T12:00:00Z')
  const startLabel = start.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const endLabel = end.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${startLabel} – ${endLabel}`
}
