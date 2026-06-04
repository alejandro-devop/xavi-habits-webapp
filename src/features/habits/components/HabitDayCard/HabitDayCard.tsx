import { useState } from 'react'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitLifelineButton } from '@/features/habits/components/HabitLifelineButton'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import type { HabitMyDayEntry } from '@/features/habits/types/habit.types'
import styles from './HabitDayCard.module.scss'

type Props = {
  entry: HabitMyDayEntry
  date: string
}

export function HabitDayCard({ entry, date }: Props) {
  const { habit, followUp, lifelinesRemaining } = entry
  const [formOpen, setFormOpen] = useState(false)

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
      <div className={styles.header}>
        <div className={styles.meta}>
          {habit.icon ? (
            <span className={styles.icon}>{habit.icon}</span>
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
