import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { getFollowUpProgressValue, getHabitDailyGoal } from '@/features/habits/utils/habit-progress.utils'
import { addDaysToString, getMondayOfWeek } from '@/features/habits/utils/habit-type.utils'
import styles from './HabitContributionGrid.module.scss'

type Props = {
  startDate: string
  endDate: string
  followUpByDate: Map<string, HabitFollowUp>
  habit: Habit
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function getCellClass(followUp: HabitFollowUp | undefined, habit: Habit): string {
  if (!followUp) return styles['cell--empty']
  if (followUp.isLifeline) return styles['cell--lifeline']
  if (followUp.isFailed) return styles['cell--failed']

  const goal = getHabitDailyGoal(habit)
  const value = getFollowUpProgressValue(followUp, habit.habitType)

  if (!followUp.isAccomplished) {
    if (goal > 0 && value > 0) {
      const pct = value / goal
      if (pct < 0.5) return styles['cell--accomplished-low']
      if (pct < 1) return styles['cell--accomplished-mid']
    }
    return styles['cell--empty']
  }

  if (habit.habitType === 'boolean') return styles['cell--accomplished-full']

  if (goal <= 0 || value <= 0) return styles['cell--accomplished-full']

  const pct = value / goal
  if (pct < 0.5) return styles['cell--accomplished-low']
  if (pct < 1) return styles['cell--accomplished-mid']
  return styles['cell--accomplished-full']
}

export function HabitContributionGrid({ startDate, endDate, followUpByDate, habit }: Props) {
  const gridStart = getMondayOfWeek(startDate)
  const weeks: Array<Array<string | null>> = []

  let cursor = gridStart
  while (cursor <= endDate) {
    const week: Array<string | null> = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor >= startDate && cursor <= endDate ? cursor : null)
      cursor = addDaysToString(cursor, 1)
    }
    weeks.push(week)
  }

  return (
    <div className={styles.root}>
      <div className={styles.dayLabels}>
        {DAY_LABELS.map((label) => (
          <span key={label} className={styles.dayLabel}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.weeksScroll}>
        <div className={styles.weeks}>
          {weeks.map((week, wi) => (
            <div key={wi} className={styles.week}>
              {week.map((date, di) => {
                if (date === null) {
                  return <div key={di} className={`${styles.cell} ${styles['cell--placeholder']}`} />
                }
                const followUp = followUpByDate.get(date)
                const cellClass = getCellClass(followUp, habit)
                return (
                  <div key={date} className={`${styles.cell} ${cellClass}`} title={date} />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
