import { useRef, useState } from 'react'
import { useUpdateActivityFollowUpMutation } from '@/features/activities/hooks/useActivityFollowUps'
import { useCurrentTimeMarker } from '@/features/activities/hooks/useCurrentTimeMarker'
import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'
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
  sessionLoading?: boolean
  suggestion?: WeeklyRoutineActivity | null
  onStartSuggestion?: (event: WeeklyRoutineActivity) => void
}

function RunningSessionCard({
  session,
  onFinish,
  onCancel,
  loading,
}: {
  session: RunningActivitySession
  onFinish?: () => void
  onCancel?: () => void
  loading?: boolean
}) {
  const elapsed = useElapsedTimer(session.startedAt, 'compact')
  const accentColor = session.categoryColor ?? 'var(--color-primary)'
  const updateMutation = useUpdateActivityFollowUpMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [notesValue, setNotesValue] = useState(session.notes ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleOpenEdit = () => {
    setNotesValue(session.notes ?? '')
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { id: session.followUpId, notes: notesValue || null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  const handleCancelEdit = () => {
    setNotesValue(session.notes ?? '')
    setIsEditing(false)
  }

  const isSaving = updateMutation.isPending

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
            {!isEditing ? (
              <IconButton
                icon="pen"
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                disabled={loading}
                aria-label="Editar notas"
              />
            ) : null}
            <IconButton
              icon="check"
              variant="primary"
              size="sm"
              onClick={onFinish}
              disabled={loading || isEditing}
              aria-label="Finalizar actividad"
            />
            <IconButton
              icon="xmark"
              variant="danger"
              size="sm"
              onClick={onCancel}
              disabled={loading || isEditing}
              aria-label="Cancelar actividad"
            />
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className={styles.sessionNotesEdit}>
          <textarea
            ref={textareaRef}
            className={styles.sessionNotesTextarea}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Añade una descripción o notas..."
            rows={2}
            disabled={isSaving}
          />
          <div className={styles.sessionNotesActions}>
            <button
              type="button"
              className={styles.sessionNotesCancelBtn}
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.sessionNotesSaveBtn}
              onClick={handleSaveNotes}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : session.notes ? (
        <p className={styles.sessionNotesPreview}>{session.notes}</p>
      ) : null}
    </div>
  )
}

export function ActivityTimelineNowEntry({
  enabled,
  isLast,
  runningSession,
  onFinish,
  onCancel,
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
