import { useState } from 'react'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitLifelineButton } from '@/features/habits/components/HabitLifelineButton'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Modal } from '@/shared/ui/Modal'
import type { HabitFollowUp, HabitMyDayEntry } from '@/features/habits/types/habit.types'
import type { HabitWeekBarDay } from '@/features/habits/utils/habit-week.utils'
import { isPartialFollowUp } from '@/features/habits/utils/habit-progress.utils'
import styles from './HabitDayCard.module.scss'

type Props = {
  entry: HabitMyDayEntry
  date: string
  days: HabitWeekBarDay[]
  followUpByDate: Map<string, HabitFollowUp>
  /** Si es false (semana futura), no se pueden registrar follow-ups. */
  canRegister?: boolean
}

type DayStatus = 'empty' | 'accomplished' | 'failed' | 'lifeline' | 'partial'

const WEEKDAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function weekdayShort(date: string): string {
  const day = new Date(date + 'T12:00:00').getDay()
  return WEEKDAY_SHORT[day] ?? ''
}

function getDayStatus(habit: HabitMyDayEntry['habit'], followUp: HabitFollowUp | undefined): DayStatus {
  if (!followUp) return 'empty'
  if (followUp.isLifeline) return 'lifeline'
  if (followUp.isFailed) return 'failed'
  if (followUp.isAccomplished) return 'accomplished'
  if (isPartialFollowUp(habit, followUp)) return 'partial'
  return 'empty'
}

export function HabitDayCard({
  entry,
  date,
  days,
  followUpByDate,
  canRegister = true,
}: Props) {
  const { habit, followUp, lifelinesRemaining } = entry
  const [formOpen, setFormOpen] = useState(false)
  const [formDate, setFormDate] = useState(date)
  const [formFollowUp, setFormFollowUp] = useState<HabitFollowUp | null | undefined>(followUp)

  const today = getTodayString()
  const hasFollowUp = followUp !== null
  const showLifeline =
    canRegister &&
    habit.weeklyLifelines > 0 &&
    (!hasFollowUp || (followUp?.isAccomplished && !followUp?.isLifeline))

  function openForm(targetDate: string, targetFollowUp: HabitFollowUp | null | undefined) {
    if (!canRegister || targetDate > today) return
    if (habit.startDate != null && targetDate < habit.startDate) return
    setFormDate(targetDate)
    setFormFollowUp(targetFollowUp)
    setFormOpen(true)
  }

  return (
    <div className={styles.row}>
      <div className={styles.identity}>
        <div className={styles.meta}>
          {habit.icon ? (
            <AppIcon name={habit.icon} size="sm" className={styles.icon} />
          ) : null}
          <span className={styles.name}>{habit.name}</span>
        </div>
        <div className={styles.identityAside}>
          <HabitStreakBadge streak={habit.streak} />
          {showLifeline ? (
            <HabitLifelineButton
              habitId={habit.id}
              date={date}
              lifelinesRemaining={lifelinesRemaining}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.days} role="group" aria-label={`Días de ${habit.name}`}>
        {days.map((day) => {
          const dayFollowUp = followUpByDate.get(day.date) ?? (day.date === date ? followUp : null)
          const status = getDayStatus(habit, dayFollowUp ?? undefined)
          const dayEditable =
            canRegister &&
            day.date <= today &&
            (habit.startDate == null || day.date >= habit.startDate)

          const className = [
            styles.dayCell,
            styles[`status--${status}`],
            day.isInWeek ? styles.inWeek : styles.outOfWeek,
            day.isToday ? styles.today : '',
            day.isFuture ? styles.future : '',
            dayEditable ? styles.interactive : '',
          ]
            .filter(Boolean)
            .join(' ')

          const content = (
            <>
              <span className={styles.dayLabelMobile}>{weekdayShort(day.date)}</span>
              <span className={styles.dayNumber}>{day.dayNumber}</span>
            </>
          )

          if (dayEditable) {
            return (
              <button
                key={day.date}
                type="button"
                className={className}
                title={day.date}
                aria-label={`${day.label} ${day.dayNumber} — ${status}`}
                onClick={() => openForm(day.date, dayFollowUp)}
              >
                {content}
              </button>
            )
          }

          return (
            <div key={day.date} className={className} title={day.date} aria-label={`${day.label} ${day.dayNumber} — ${status}`}>
              {content}
            </div>
          )
        })}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={habit.name}
        size="sm"
      >
        <HabitFollowUpForm
          habit={habit}
          date={formDate}
          existingFollowUp={formFollowUp ?? undefined}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  )
}
