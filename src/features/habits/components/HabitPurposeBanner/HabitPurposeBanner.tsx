import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import {
  composeIdentityLine,
  composeSetbackLine,
  getIdentityVisibility,
} from '@/features/habits/utils/habit-identity.utils'
import type { HabitDayVisualStatus } from '@/features/habits/utils/habit-progress.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './HabitPurposeBanner.module.scss'

export type HabitPurposeBannerProps = {
  purpose: HabitPurpose | null | undefined
  /** Estado del día que se está mirando. Es lo que decide qué se dice. */
  status: HabitDayVisualStatus
  /** Días acumulados del hábito: «un mal día no borra 34». */
  days: number
  lifelinesRemaining: number
}

/**
 * La línea de identidad, y **la regla innegociable** en un solo sitio.
 *
 * El propósito aparece al empezar y al lograr. Nunca al fallar: un día fallado
 * o con salvavidas gastado habla de la racha y del salvavidas y de nada más —
 * ni el nombre, ni el icono, ni la línea. La culpa es el mejor predictor de
 * abandono que hay: quien se siente juzgado no deja el hábito, deja la app.
 */
export function HabitPurposeBanner({
  purpose,
  status,
  days,
  lifelinesRemaining,
}: HabitPurposeBannerProps) {
  const tone = getIdentityVisibility(status)

  if (tone === 'hidden') {
    return <p className={styles.setback}>{composeSetbackLine(days, lifelinesRemaining)}</p>
  }

  if (!purpose || purpose.placement === 'pool') return null

  return (
    <p className={[styles.line, tone === 'done' ? styles.lineDone : ''].filter(Boolean).join(' ')}>
      {purpose.icon ? <AppIcon name={purpose.icon} size="2xs" decorative /> : null}
      <span className={styles.lineText}>{composeIdentityLine(purpose.name, tone)}</span>
    </p>
  )
}
