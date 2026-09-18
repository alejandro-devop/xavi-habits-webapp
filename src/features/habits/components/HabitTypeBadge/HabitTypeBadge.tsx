import type { HabitType } from '@/features/habits/types/habit.types'
import type { HabitIntent } from '@/features/habits/utils/habit-list.utils'
import { HABIT_TYPE_LABELS } from '@/features/habits/utils/habit-type.utils'
import styles from './HabitTypeBadge.module.scss'

const INTENT_LABELS: Record<HabitIntent, string> = {
  keep: 'Mantener',
  avoid: 'Evitar',
}

type Props = {
  habitType: HabitType
  /**
   * Cuando se pasa, la insignia dice qué clase de hábito es —Mantener en mint,
   * Evitar en violeta— en vez de cómo se registra. Es lo que pide la tarjeta de
   * "Mis Hábitos": ahí el tipo de registro ya lo cuenta la insignia de
   * frecuencia.
   */
  intent?: HabitIntent
}

export function HabitTypeBadge({ habitType, intent }: Props) {
  if (intent) {
    return (
      <span className={[styles.badge, styles[intent]].join(' ')}>{INTENT_LABELS[intent]}</span>
    )
  }

  return (
    <span className={[styles.badge, styles[habitType]].join(' ')}>
      {HABIT_TYPE_LABELS[habitType]}
    </span>
  )
}
