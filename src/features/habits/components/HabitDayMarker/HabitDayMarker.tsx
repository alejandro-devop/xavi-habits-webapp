import { AppIcon } from '@/shared/ui/AppIcon'
import {
  DIFFICULTY_EMOJIS,
  DIFFICULTY_LABELS,
} from '@/features/habits/utils/habit-difficulty.utils'
import styles from './HabitDayMarker.module.scss'

const RING_RADIUS = 15.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Normal (2), Difícil (3), Extremo (4) — “más o menos pesado” / pesado. */
function isHeavyishDifficulty(difficulty: number | null | undefined): difficulty is number {
  return difficulty != null && difficulty >= 2
}

type Props = {
  dayNumber: number
  /** Progress 0–1. Null hides the ring. */
  progress: number | null
  hasNotes?: boolean
  difficulty?: number | null
  className?: string
  dayNumberClassName?: string
}

export function HabitDayMarker({
  dayNumber,
  progress,
  hasNotes = false,
  difficulty = null,
  className,
  dayNumberClassName,
}: Props) {
  const showRing = progress !== null && progress > 0
  const clamped = showRing ? Math.min(Math.max(progress, 0), 1) : 0
  const dash = clamped * RING_CIRCUMFERENCE
  const showMood = isHeavyishDifficulty(difficulty)
  const moodEmoji = showMood ? DIFFICULTY_EMOJIS[difficulty] : null
  const moodLabel = showMood ? DIFFICULTY_LABELS[difficulty] : null

  return (
    <span className={[styles.marker, className].filter(Boolean).join(' ')}>
      {showRing ? (
        <svg
          className={styles.ring}
          viewBox="0 0 36 36"
          aria-hidden
          focusable="false"
        >
          <circle
            className={styles.ringTrack}
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="2.75"
          />
          <circle
            className={styles.ringProgress}
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="2.75"
            strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
      ) : null}
      <span className={[styles.dayNumber, dayNumberClassName].filter(Boolean).join(' ')}>
        {dayNumber}
      </span>
      {showMood && moodEmoji ? (
        <span
          className={styles.moodBadge}
          title={moodLabel ?? undefined}
          aria-label={moodLabel ?? 'Dificultad'}
        >
          {moodEmoji}
        </span>
      ) : null}
      {hasNotes ? (
        <span className={styles.notesBadge} title="Con notas" aria-label="Con notas">
          <AppIcon name="comments" size="2xs" decorative />
        </span>
      ) : null}
    </span>
  )
}
