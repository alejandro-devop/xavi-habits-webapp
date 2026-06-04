import styles from './HabitStreakBadge.module.scss'

type Props = {
  streak: number
}

export function HabitStreakBadge({ streak }: Props) {
  if (streak === 0) {
    return <span className={[styles.badge, styles.empty].join(' ')}>Sin racha</span>
  }
  return (
    <span className={[styles.badge, styles.active].join(' ')}>
      🔥 {streak} {streak === 1 ? 'día' : 'días'}
    </span>
  )
}
