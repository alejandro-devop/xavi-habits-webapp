import type { TraitProgress } from '@/features/habits/utils/habit-identity.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './HabitTraitCard.module.scss'

export type HabitTraitState = 'won' | 'proposed' | 'wayto'

const STATE_TAG: Record<HabitTraitState, string> = {
  won: 'Ganado',
  proposed: 'Propuesto',
  wayto: 'En camino',
}

const STATE_ICON: Record<HabitTraitState, string> = {
  won: 'check',
  proposed: 'star',
  wayto: 'clock',
}

export interface HabitTraitChip {
  icon?: string | null
  label: string
}

export interface HabitTraitCardProps {
  state: HabitTraitState
  name: string
  icon?: string | null
  /** La prueba que lo ganó, o lo que falta para ganarlo. */
  evidence: string
  /** Texto que escribió el usuario. Se muestra tal cual, nunca reescrito. */
  freeText?: string
  chips?: HabitTraitChip[]
  progress?: TraitProgress
  /** «Sí, soy eso». Solo en `proposed`. */
  onConfirm?: () => void
  /** «No me suena». Solo en `proposed`. */
  onDismiss?: () => void
  isBusy?: boolean
}

/**
 * Un rasgo en sus tres estados. El de «en camino» es el que hace que la
 * pantalla dé ganas de volver a mirarla: enseña cuánto falta, no cuánto se
 * ha fallado.
 */
export function HabitTraitCard({
  state,
  name,
  icon,
  evidence,
  freeText,
  chips = [],
  progress,
  onConfirm,
  onDismiss,
  isBusy = false,
}: HabitTraitCardProps) {
  return (
    <article className={[styles.trait, styles[state]].join(' ')}>
      <span className={[styles.tag, styles[`tag_${state}`]].join(' ')}>
        <AppIcon name={STATE_ICON[state]} size="2xs" decorative />
        {STATE_TAG[state]}
      </span>

      <h3 className={styles.name}>
        {icon ? <AppIcon name={icon} size="xs" decorative /> : null}
        {name}
      </h3>

      <p className={styles.evidence}>{evidence}</p>

      {freeText ? <p className={styles.freeText}>{freeText}</p> : null}

      {progress ? (
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.target}
          aria-valuenow={progress.done}
          aria-label={`${progress.done} de ${progress.target} días`}
        >
          <i style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
        </div>
      ) : null}

      <footer className={styles.footer}>
        {chips.map((chip) => (
          <span key={chip.label} className={styles.chip}>
            {chip.icon ? <AppIcon name={chip.icon} size="2xs" decorative /> : null}
            {chip.label}
          </span>
        ))}

        {state === 'proposed' && onConfirm ? (
          <Button type="button" size="sm" onClick={onConfirm} isLoading={isBusy}>
            Sí, soy eso
          </Button>
        ) : null}
        {state === 'proposed' && onDismiss ? (
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss} disabled={isBusy}>
            No me suena
          </Button>
        ) : null}
      </footer>
    </article>
  )
}
