import { DIFFICULTY_EMOJIS, DIFFICULTY_LABELS } from '@/features/habits/utils/habit-difficulty.utils'
import styles from './HabitDifficultyPicker.module.scss'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
}

export function HabitDifficultyPicker({ value, onChange }: Props) {
  return (
    <div className={styles.root} role="group" aria-label="Dificultad">
      {[0, 1, 2, 3, 4].map((level) => (
        <button
          key={level}
          type="button"
          className={[styles.btn, value === level ? styles.active : ''].join(' ')}
          onClick={() => onChange(value === level ? null : level)}
          title={DIFFICULTY_LABELS[level]}
          aria-pressed={value === level}
        >
          {DIFFICULTY_EMOJIS[level]}
        </button>
      ))}
    </div>
  )
}
