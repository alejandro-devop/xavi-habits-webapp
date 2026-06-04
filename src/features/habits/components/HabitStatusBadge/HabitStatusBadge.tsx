import type { HabitStatus } from '@/features/habits/types/habit.types'
import styles from './HabitStatusBadge.module.scss'

const STATUS_LABELS: Record<HabitStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
}

type Props = {
  status: HabitStatus
}

export function HabitStatusBadge({ status }: Props) {
  return (
    <span className={[styles.badge, styles[status]].join(' ')}>
      {STATUS_LABELS[status]}
    </span>
  )
}
