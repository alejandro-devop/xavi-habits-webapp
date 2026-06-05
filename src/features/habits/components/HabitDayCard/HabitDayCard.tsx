import { useState } from 'react'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitLifelineButton } from '@/features/habits/components/HabitLifelineButton'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { HabitPurposeBanner } from '@/features/habits/components/HabitPurposeBanner'
import { useHabitWeekViewQuery } from '@/features/habits/hooks/useHabits'
import { getMondayOfWeek } from '@/features/habits/utils/habit-type.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import type { HabitMyDayEntry } from '@/features/habits/types/habit.types'
import styles from './HabitDayCard.module.scss'

type Props = {
  entry: HabitMyDayEntry
  date: string
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function HabitDayCard({ entry, date }: Props) {
  const { habit, followUp, lifelinesRemaining } = entry
  const [formOpen, setFormOpen] = useState(false)

  const weekStart = getMondayOfWeek(date)
  const { data: weekView } = useHabitWeekViewQuery(habit.id, weekStart)

  const hasFollowUp = followUp !== null
  const showLifeline =
    habit.weeklyLifelines > 0 &&
    (!hasFollowUp || (followUp?.isAccomplished && !followUp?.isLifeline))

  function renderStatus() {
    if (!followUp) return null

    if (followUp.isLifeline) {
      return <span className={[styles.badge, styles.lifeline].join(' ')}>Salvavidas</span>
    }
    if (followUp.isFailed) {
      return <span className={[styles.badge, styles.failed].join(' ')}>Fallido</span>
    }
    if (followUp.isAccomplished) {
      const value =
        habit.habitType === 'count' && followUp.count != null
          ? ` · ${followUp.count} ${habit.measure?.name ?? 'veces'}`
          : habit.habitType === 'time' && followUp.time != null
            ? ` · ${followUp.time} min`
            : ''
      return (
        <span className={[styles.badge, styles.accomplished].join(' ')}>
          Logrado{value}
        </span>
      )
    }
    return null
  }

  const progress =
    habit.periodDays > 0 ? Math.min(habit.streak / habit.periodDays, 1) : null

  return (
    <div className={styles.card}>
      <HabitPurposeBanner purpose={entry.habit.purpose} habitId={entry.habit.id} />
      <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.meta}>
          {habit.icon ? (
            <AppIcon name={habit.icon} size="sm" className={styles.icon} />
          ) : null}
          <span className={styles.name}>{habit.name}</span>
        </div>
        <HabitStreakBadge streak={habit.streak} />
      </div>

      {progress !== null && (
        <div className={styles.progressBar} aria-label={`${habit.streak}/${habit.periodDays} días`}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          <span className={styles.progressLabel}>{habit.streak}/{habit.periodDays} días</span>
        </div>
      )}

      {weekView && (
        <div className={styles.weekStrip}>
          {weekView.days.map((day) => {
            const d = new Date(day.date + 'T12:00:00Z')
            const label = DAY_LABELS[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1]
            const isToday = day.date === date
            return (
              <div
                key={day.date}
                className={[
                  styles.weekDot,
                  styles[`dot--${day.status}`],
                  isToday ? styles['dot--today'] : '',
                ].join(' ')}
                title={day.date}
              >
                <span className={styles.dotLabel}>{label}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.statusRow}>
          {renderStatus()}
          {showLifeline && (
            <HabitLifelineButton
              habitId={habit.id}
              date={date}
              lifelinesRemaining={lifelinesRemaining}
            />
          )}
        </div>

        {!hasFollowUp && (
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            Registrar
          </Button>
        )}

        {hasFollowUp && (
          <Button variant="ghost" size="sm" onClick={() => setFormOpen(true)}>
            Editar
          </Button>
        )}
      </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={habit.name}
        size="sm"
      >
        <HabitFollowUpForm
          habit={habit}
          date={date}
          existingFollowUp={followUp ?? undefined}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  )
}
