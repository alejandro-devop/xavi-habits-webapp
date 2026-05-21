import { useTheme } from '@/features/theme'
import type { ThemePreference } from '@/features/theme/types/theme.types'
import styles from './ThemeToggle.module.scss'

const LABELS: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
}

const ICONS: Record<ThemePreference, string> = {
  light: '☀',
  dark: '☾',
  system: '◐',
}

export function ThemeToggle() {
  const { preference, cyclePreference } = useTheme()

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cyclePreference}
      aria-label={`Tema: ${LABELS[preference]}. Pulsa para cambiar.`}
      title={`Tema actual: ${LABELS[preference]}`}
    >
      <span className={styles.icon} aria-hidden>
        {ICONS[preference]}
      </span>
      <span className={styles.label}>{LABELS[preference]}</span>
    </button>
  )
}
