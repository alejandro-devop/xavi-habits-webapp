import { useCurrentTimeMarker } from '@/features/activities/hooks/useCurrentTimeMarker'
import { AppIcon } from '@/shared/ui/AppIcon'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { formatEventTime } from '@/features/weekly-routine/utils/planner.utils'
import styles from './ActivityTimelineNowEntry.module.scss'

type ActivityTimelineNowEntryProps = {
  enabled: boolean
  isLast: boolean
  suggestion?: WeeklyRoutineActivity | null
  onStartSuggestion?: (event: WeeklyRoutineActivity) => void
}

export function ActivityTimelineNowEntry({
  enabled,
  isLast,
  suggestion,
  onStartSuggestion,
}: ActivityTimelineNowEntryProps) {
  const { timeLabel } = useCurrentTimeMarker(enabled)

  if (!enabled) return null

  return (
    <li className={styles.entry} role="status" aria-live="polite">
      <div className={styles.rail} aria-hidden>
        <div className={styles.railInner}>
          <span className={styles.bulletNow} />
          {!isLast ? <span className={styles.connector} /> : null}
        </div>
        <div className={styles.times}>
          <span className={styles.nowLabel}>Ahora</span>
          <span className={styles.timeNow}>{timeLabel}</span>
        </div>
      </div>

      {suggestion && onStartSuggestion ? (
        <div className={styles.suggestion}>
          <div className={styles.suggestionInfo}>
            <span className={styles.suggestionLabel}>Según tu rutina</span>
            <span className={styles.suggestionTitle}>{suggestion.activity?.title ?? '—'}</span>
            <span className={styles.suggestionTime}>
              {formatEventTime(suggestion.startTime, suggestion.durationMinutes)}
            </span>
          </div>
          <button
            type="button"
            className={styles.suggestionPlay}
            onClick={() => onStartSuggestion(suggestion)}
            aria-label={`Iniciar ${suggestion.activity?.title ?? 'actividad sugerida'}`}
          >
            <AppIcon name="play" size="sm" />
          </button>
        </div>
      ) : (
        <div className={styles.placeholder} aria-hidden />
      )}
    </li>
  )
}
