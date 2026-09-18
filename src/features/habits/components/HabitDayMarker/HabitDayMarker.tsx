import type { CSSProperties } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import {
  DIFFICULTY_EMOJIS,
  DIFFICULTY_LABELS,
} from '@/features/habits/utils/habit-difficulty.utils'
import styles from './HabitDayMarker.module.scss'

const RING_RADIUS = 15.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Estado del día que pinta el marcador cuando se usa en modo "chip". */
export type HabitDayMarkerStatus = 'empty' | 'accomplished' | 'failed' | 'lifeline' | 'partial'

const STATUS_CLASS: Record<HabitDayMarkerStatus, string> = {
  empty: styles.statusEmpty,
  accomplished: styles.statusAccomplished,
  failed: styles.statusFailed,
  lifeline: styles.statusLifeline,
  partial: styles.statusPartial,
}

const STATUS_GLYPH: Partial<Record<HabitDayMarkerStatus, string>> = {
  accomplished: 'check',
  failed: 'xmark',
  lifeline: 'heart',
}

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
  /**
   * Modo "chip": el marcador se colorea solo según el estado del día
   * (logrado, fallado, salvavidas, parcial) en lugar de dejárselo al padre.
   */
  status?: HabitDayMarkerStatus
  isToday?: boolean
  isFuture?: boolean
  className?: string
  dayNumberClassName?: string
}

export function HabitDayMarker({
  dayNumber,
  progress,
  hasNotes = false,
  difficulty = null,
  status,
  isToday = false,
  isFuture = false,
  className,
  dayNumberClassName,
}: Props) {
  const isChip = status !== undefined
  // En modo chip el progreso se pinta con un conic-gradient dentro del propio
  // círculo: el anillo SVG sobraría encima.
  const showRing = !isChip && progress !== null && progress > 0
  const clamped = progress !== null ? Math.min(Math.max(progress, 0), 1) : 0
  const dash = clamped * RING_CIRCUMFERENCE
  const showMood = isHeavyishDifficulty(difficulty)
  const moodEmoji = showMood ? DIFFICULTY_EMOJIS[difficulty] : null
  const moodLabel = showMood ? DIFFICULTY_LABELS[difficulty] : null
  const glyph = status ? STATUS_GLYPH[status] : undefined

  const markerClass = [
    styles.marker,
    isChip ? styles.chip : '',
    status ? STATUS_CLASS[status] : '',
    isToday ? styles.today : '',
    isFuture ? styles.future : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const dayNumberStyle: CSSProperties | undefined =
    status === 'partial'
      ? ({ '--marker-progress': `${Math.round(clamped * 100)}%` } as CSSProperties)
      : undefined

  return (
    <span className={markerClass}>
      {showRing ? (
        <svg className={styles.ring} viewBox="0 0 36 36" aria-hidden focusable="false">
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
      <span
        className={[styles.dayNumber, dayNumberClassName].filter(Boolean).join(' ')}
        style={dayNumberStyle}
      >
        {glyph ? <AppIcon name={glyph} size="2xs" decorative /> : dayNumber}
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
