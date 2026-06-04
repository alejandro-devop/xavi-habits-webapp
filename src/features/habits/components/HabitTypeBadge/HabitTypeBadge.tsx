import type { HabitType } from '@/features/habits/types/habit.types'
import { HABIT_TYPE_LABELS } from '@/features/habits/utils/habit-type.utils'
import styles from './HabitTypeBadge.module.scss'

type Props = {
  habitType: HabitType
}

export function HabitTypeBadge({ habitType }: Props) {
  return (
    <span className={[styles.badge, styles[habitType]].join(' ')}>
      {HABIT_TYPE_LABELS[habitType]}
    </span>
  )
}
