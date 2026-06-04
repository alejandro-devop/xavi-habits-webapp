import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import type { Habit, HabitDayEntry } from '@/features/habits/types/habit.types'
import styles from './HabitDayCell.module.scss'

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

type Props = {
  entry: HabitDayEntry
  habit: Habit
  lifelinesRemaining: number
}

export function HabitDayCell({ entry, habit }: Props) {
  const [formOpen, setFormOpen] = useState(false)

  const today = getTodayString()
  const isEditable =
    entry.date <= today &&
    (habit.startDate == null || entry.date >= habit.startDate)

  const date = new Date(entry.date + 'T12:00:00Z')
  const dayLabel = DAY_LABELS[date.getUTCDay()]
  const dayNumber = date.getUTCDate()

  function statusIcon() {
    if (entry.status === 'accomplished') return '✓'
    if (entry.status === 'failed') return '✗'
    if (entry.status === 'lifeline') return '🛡'
    return null
  }

  return (
    <>
      <button
        className={[styles.cell, styles[entry.status], isEditable ? styles.editable : ''].join(' ')}
        onClick={isEditable ? () => setFormOpen(true) : undefined}
        disabled={!isEditable}
        aria-label={`${dayLabel} ${dayNumber} — ${entry.status}`}
      >
        <span className={styles.dayLabel}>{dayLabel}</span>
        <span className={styles.dayNumber}>{dayNumber}</span>
        {entry.status !== 'empty' && (
          <span className={styles.statusIcon}>{statusIcon()}</span>
        )}
      </button>

      {isEditable && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={`${habit.name} — ${dayLabel} ${dayNumber}`}
          size="sm"
        >
          <HabitFollowUpForm
            habit={habit}
            date={entry.date}
            existingFollowUp={entry.followUp ?? undefined}
            onSuccess={() => setFormOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}
