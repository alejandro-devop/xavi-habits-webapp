import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './HabitStreakBadge.module.scss'

type Props = {
  streak: number
  /** Solo la llama y el número: para filas estrechas. */
  compact?: boolean
}

export function HabitStreakBadge({ streak, compact = false }: Props) {
  if (streak === 0) {
    return (
      <span className={[styles.badge, styles.empty].join(' ')} title="Sin racha">
        {compact ? '—' : 'Sin racha'}
      </span>
    )
  }

  const label = `${streak} ${streak === 1 ? 'día' : 'días'} de racha`

  return (
    <span className={[styles.badge, styles.active].join(' ')} title={label} aria-label={label}>
      <AppIcon name="fire" size="2xs" decorative className={styles.flame} />
      <span className={styles.value}>{streak}</span>
      {compact ? null : <span>{streak === 1 ? 'día' : 'días'}</span>}
    </span>
  )
}
