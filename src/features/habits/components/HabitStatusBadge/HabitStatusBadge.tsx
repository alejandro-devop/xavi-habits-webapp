import type { HabitStatus } from '@/features/habits/types/habit.types'
import styles from './HabitStatusBadge.module.scss'

const STATUS_LABELS: Record<HabitStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
}

type Props = {
  status: HabitStatus
  /**
   * Texto alternativo para el mismo estado. La tarjeta de "Mis Hábitos" dice
   * "En pausa" en vez de "Completado"/"Archivado": ahí lo que importa es que
   * el hábito no está corriendo, no en qué cajón está guardado.
   */
  label?: string
}

export function HabitStatusBadge({ status, label }: Props) {
  return (
    <span className={[styles.badge, styles[status]].join(' ')}>
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}
