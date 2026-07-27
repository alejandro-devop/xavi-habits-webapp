import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'
import { useCurrentTimeMarker } from '@/features/activities/hooks/useCurrentTimeMarker'
import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { formatEventTime } from '@/features/weekly-routine/utils/planner.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { IconButton } from '@/shared/ui/IconButton'
import styles from './ActivityTimelineNowEntry.module.scss'

type ActivityTimelineNowEntryProps = {
  enabled: boolean
  isLast: boolean
  runningSession?: RunningActivitySession | null
  onFinish?: () => void
  onCancel?: () => void
  onOpenBitacora?: (session: RunningActivitySession) => void
  sessionLoading?: boolean
  suggestion?: WeeklyRoutineActivity | null
  onStartSuggestion?: (event: WeeklyRoutineActivity) => void
}

function RunningSessionCard({
  session,
  onFinish,
  onCancel,
  onOpenBitacora,
  loading,
}: {
  session: RunningActivitySession
  onFinish?: () => void
  onCancel?: () => void
  onOpenBitacora?: (session: RunningActivitySession) => void
  loading?: boolean
}) {
  const elapsed = useElapsedTimer(session.startedAt, 'compact')
  const accentColor = session.categoryColor ?? 'var(--color-primary)'
  const hasBitacora = Boolean(session.notes?.trim())

  return (
    <div className={styles.sessionCard} style={{ borderLeftColor: accentColor }}>
      <div className={styles.sessionHeader}>
        <span
          className={styles.sessionIcon}
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          }}
          aria-hidden
        >
          <AppIcon name={session.categoryIcon ?? 'clock'} size="sm" decorative />
        </span>

        <div className={styles.sessionText}>
          <span className={styles.sessionLabel}>En curso</span>
          <span className={styles.sessionTitle}>{session.activityTitle}</span>
          {session.categoryName ? (
            <span className={styles.sessionCategory}>{session.categoryName}</span>
          ) : null}
        </div>

        <div className={styles.sessionMeta}>
          <span className={styles.sessionTimer} aria-live="polite">
            {elapsed}
          </span>
          <div className={styles.sessionActions}>
            {onOpenBitacora ? (
              <IconButton
                icon="file-lines"
                variant={hasBitacora ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onOpenBitacora(session)}
                disabled={loading}
                aria-label={hasBitacora ? 'Abrir bitácora' : 'Añadir bitácora'}
              />
            ) : null}
            <IconButton
              icon="check"
              variant="primary"
              size="sm"
              onClick={onFinish}
              disabled={loading}
              aria-label="Finalizar actividad"
            />
            <IconButton
              icon="xmark"
              variant="danger"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              aria-label="Cancelar actividad"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ActivityTimelineNowEntry({
  enabled,
  isLast,
  runningSession,
  onFinish,
  onCancel,
  onOpenBitacora,
  sessionLoading,
  suggestion,
  onStartSuggestion,
}: ActivityTimelineNowEntryProps) {
  const { timeLabel } = useCurrentTimeMarker(enabled)

  if (!enabled) return null

  const showSession = Boolean(runningSession)
  const showSuggestion = !showSession && Boolean(suggestion && onStartSuggestion)

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

      {showSession && runningSession ? (
        <RunningSessionCard
          session={runningSession}
          onFinish={onFinish}
          onCancel={onCancel}
          onOpenBitacora={onOpenBitacora}
          loading={sessionLoading}
        />
      ) : showSuggestion ? (
        <div className={styles.suggestion}>
          <div className={styles.suggestionInfo}>
            <span className={styles.suggestionLabel}>Según tu rutina</span>
            <span className={styles.suggestionTitle}>{suggestion!.activity?.title ?? '—'}</span>
            <span className={styles.suggestionTime}>
              {formatEventTime(suggestion!.startTime, suggestion!.durationMinutes)}
            </span>
          </div>
          <button
            type="button"
            className={styles.suggestionPlay}
            onClick={() => onStartSuggestion!(suggestion!)}
            aria-label={`Iniciar ${suggestion!.activity?.title ?? 'actividad sugerida'}`}
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
