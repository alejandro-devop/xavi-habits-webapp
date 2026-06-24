import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import { isPartialFollowUp } from '@/features/habits/utils/habit-progress.utils'
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

  const displayStatus =
    entry.followUp && isPartialFollowUp(habit, entry.followUp) ? 'partial' : entry.status

  function statusIcon() {
    if (displayStatus === 'accomplished') return '✓'
    if (displayStatus === 'failed') return '✗'
    if (displayStatus === 'lifeline') return '🛡'
    if (displayStatus === 'partial') return '◐'
    return null
  }

  return (
    <>
      <button
        className={[styles.cell, styles[displayStatus], isEditable ? styles.editable : ''].join(' ')}
        onClick={isEditable ? () => setFormOpen(true) : undefined}
        disabled={!isEditable}
        aria-label={`${dayLabel} ${dayNumber} — ${displayStatus}`}
      >
        <span className={styles.dayLabel}>{dayLabel}</span>
        <span className={styles.dayNumber}>{dayNumber}</span>
        {displayStatus !== 'empty' && (
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
