import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { HabitDayMarker } from '@/features/habits/components/HabitDayMarker'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import {
  followUpHasNotes,
  getDayRingProgress,
  isPartialFollowUp,
} from '@/features/habits/utils/habit-progress.utils'
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

  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'
  const ringProgress = getDayRingProgress(habit, entry.followUp)
  const hasNotes = followUpHasNotes(entry.followUp)

  const ariaParts = [
    `${dayLabel} ${dayNumber}`,
    displayStatus,
    hasNotes ? 'con notas' : null,
    isQuantified && ringProgress != null
      ? `progreso ${Math.round(ringProgress * 100)}%`
      : null,
  ].filter(Boolean)

  return (
    <>
      <button
        className={[
          styles.cell,
          styles[displayStatus],
          isQuantified ? styles.quantified : '',
          isEditable ? styles.editable : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={isEditable ? () => setFormOpen(true) : undefined}
        disabled={!isEditable}
        aria-label={ariaParts.join(' — ')}
      >
        <span className={styles.dayLabel}>{dayLabel}</span>
        <HabitDayMarker
          dayNumber={dayNumber}
          progress={isQuantified ? ringProgress : null}
          hasNotes={hasNotes}
          difficulty={entry.followUp?.difficulty ?? null}
          className={styles.marker}
          dayNumberClassName={styles.dayNumber}
        />
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
