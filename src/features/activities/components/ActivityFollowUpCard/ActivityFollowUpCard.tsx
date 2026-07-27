import type { KeyboardEvent, MouseEvent } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { formatDurationMinutes, normalizeTimeForDisplay } from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { IconButton } from '@/shared/ui/IconButton'
import styles from './ActivityFollowUpCard.module.scss'

type ActivityFollowUpCardProps = {
  followUp: ActivityFollowUp
  onClick: (followUp: ActivityFollowUp) => void
  onBitacoraClick?: (followUp: ActivityFollowUp) => void
  /** Lista timeline: sin grid de horas duplicado. */
  variant?: 'default' | 'timeline'
}

export function ActivityFollowUpCard({
  followUp,
  onClick,
  onBitacoraClick,
  variant = 'default',
}: ActivityFollowUpCardProps) {
  if (followUp.isOpen || followUp.durationMinutes === null || !followUp.endTime) {
    return null
  }

  const durationMinutes = followUp.durationMinutes
  const activity = followUp.activity
  const category = activity?.category
  const accentColor = category?.color ?? 'var(--color-primary)'
  const isTimeline = variant === 'timeline'
  const hasBitacora = Boolean(followUp.notes?.trim())

  const handleCardActivate = () => onClick(followUp)

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardActivate()
    }
  }

  const handleBitacoraClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onBitacoraClick?.(followUp)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.card}
      style={{ borderLeftColor: accentColor }}
      onClick={handleCardActivate}
      onKeyDown={handleCardKeyDown}
      aria-label={`Editar registro: ${activity?.title ?? 'Actividad'}`}
    >
      <div className={styles.header}>
        <span
          className={styles.iconWrap}
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          }}
          aria-hidden
        >
          <AppIcon name={category?.icon ?? 'clock'} size="sm" decorative />
        </span>
        <div className={styles.headText}>
          <span className={styles.title}>{activity?.title ?? 'Actividad'}</span>
          {category?.name ? <span className={styles.category}>{category.name}</span> : null}
        </div>
        <div className={styles.headerActions}>
          {hasBitacora && onBitacoraClick ? (
            <IconButton
              icon="file-lines"
              variant="ghost"
              size="sm"
              className={styles.bitacoraBtn}
              onClick={handleBitacoraClick}
              aria-label={`Ver bitácora de ${activity?.title ?? 'actividad'}`}
            />
          ) : null}
          {isTimeline ? (
            <span className={styles.durationBadge}>
              {formatDurationMinutes(durationMinutes)}
            </span>
          ) : null}
        </div>
      </div>

      {!isTimeline ? (
        <dl className={styles.meta}>
          <div>
            <dt>Inicio</dt>
            <dd>{normalizeTimeForDisplay(followUp.startTime)}</dd>
          </div>
          <div>
            <dt>Fin</dt>
            <dd>{normalizeTimeForDisplay(followUp.endTime)}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{formatDurationMinutes(durationMinutes)}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}
