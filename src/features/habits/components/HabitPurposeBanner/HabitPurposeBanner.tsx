import { Link } from 'react-router'
import { AppIcon } from '@/shared/ui/AppIcon'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import styles from './HabitPurposeBanner.module.scss'

type Props = {
  purpose: HabitPurpose | null | undefined
  habitId: string
}

const PLACEMENT_LABEL: Record<'want' | 'avoid', string> = {
  want: 'Para ser:',
  avoid: 'Para dejar de ser:',
}

export function HabitPurposeBanner({ purpose }: Props) {
  if (purpose && purpose.placement !== 'pool') {
    const label = PLACEMENT_LABEL[purpose.placement]
    return (
      <div className={styles.banner}>
        {purpose.icon ? (
          <AppIcon name={purpose.icon} size="xs" className={styles.icon} />
        ) : null}
        <span className={styles.context}>{label}</span>
        <span className={styles.name}>{purpose.name}</span>
      </div>
    )
  }

  return (
    <div className={styles.cta}>
      <span className={styles.ctaText}>¿Por qué haces este hábito?</span>
      <Link to={habitsPaths.persona} className={styles.ctaLink}>
        Asignar propósito
      </Link>
    </div>
  )
}
