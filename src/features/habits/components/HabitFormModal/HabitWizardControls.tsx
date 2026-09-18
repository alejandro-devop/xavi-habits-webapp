import type { ReactNode } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './HabitCreateWizard.module.scss'

type OptionCardProps = {
  icon: string
  title: string
  text: string
  examples: string
  selected: boolean
  /** Violeta en vez de mint: la vía de «dejar algo atrás». */
  tone?: 'grow' | 'avoid'
  disabled?: boolean
  onSelect: () => void
}

/** Tarjeta grande de elección. Es un botón: se pulsa, se tabula y se anuncia. */
export function OptionCard({
  icon,
  title,
  text,
  examples,
  selected,
  tone = 'grow',
  disabled,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      className={[
        styles.option,
        tone === 'avoid' ? styles.optionAvoid : '',
        selected ? styles.optionSelected : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className={styles.optionIcon} aria-hidden="true">
        <AppIcon name={icon} />
      </span>
      <span>
        <span className={styles.optionTitle}>{title}</span>
        <span className={styles.optionText}>{text}</span>
        <span className={styles.optionExamples}>{examples}</span>
      </span>
    </button>
  )
}

type ChipProps = {
  children: ReactNode
  selected?: boolean
  tone?: 'grow' | 'violet'
  disabled?: boolean
  onClick: () => void
}

export function Chip({ children, selected = false, tone = 'grow', disabled, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        styles.chip,
        tone === 'violet' ? styles.chipViolet : '',
        selected ? styles.chipSelected : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
