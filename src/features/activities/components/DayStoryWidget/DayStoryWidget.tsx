import { useMemo } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { normalizeTimeForDisplay, sortFollowUpsByStartTimeAsc } from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { DataCard } from '@/shared/ui/DataCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './DayStoryWidget.module.scss'

export type DayStoryWidgetProps = {
  date: string
  followUps: ActivityFollowUp[]
  isLoading?: boolean
  className?: string
}

type StoryEntry = {
  id: string
  startTime: string
  endTime: string | null
  durationMinutes: number | null
  isOpen: boolean
  activityTitle: string
  storyText: string
  usedFallback: boolean
  categoryColor: string | null
  categoryIcon: string | null
  categoryName: string | null
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

function getHourLabel(time: string): string {
  return normalizeTimeForDisplay(time).slice(0, 2) + ':00'
}

function buildStoryEntries(followUps: ActivityFollowUp[]): StoryEntry[] {
  const completed = followUps.filter((f) => !f.isOpen && f.durationMinutes !== null)
  const sorted = sortFollowUpsByStartTimeAsc([...completed])

  return sorted.map((f) => {
    const notes = f.notes?.trim() ?? null
    const description = f.activity?.description?.trim() ?? null
    const title = f.activity?.title ?? 'Actividad'
    const storyText = notes ?? description ?? title
    const usedFallback = !notes && !description

    return {
      id: f.id,
      startTime: f.startTime,
      endTime: f.endTime,
      durationMinutes: f.durationMinutes,
      isOpen: f.isOpen ?? false,
      activityTitle: title,
      storyText,
      usedFallback,
      categoryColor: f.activity?.category?.color ?? null,
      categoryIcon: f.activity?.category?.icon ?? null,
      categoryName: f.activity?.category?.name ?? null,
    }
  })
}

function HourDivider({ label }: { label: string }) {
  return (
    <li className={styles.hourDivider} role="presentation">
      <span className={styles.hourLabel}>{label}</span>
    </li>
  )
}

type EntryItemProps = {
  entry: StoryEntry
  isLast: boolean
}

function EntryItem({ entry, isLast }: EntryItemProps) {
  const accentColor = entry.categoryColor ?? 'var(--color-primary)'
  const duration = formatDuration(entry.durationMinutes)

  return (
    <li className={[styles.entry, isLast ? styles.entryLast : ''].filter(Boolean).join(' ')}>
      <div
        className={styles.entryRail}
        aria-hidden
      >
        <span
          className={styles.entryDot}
          style={{
            background: accentColor,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 20%, transparent)`,
          }}
        />
        {!isLast && <span className={styles.entryLine} />}
      </div>

      <div className={styles.entryBody}>
        <div className={styles.entryMeta}>
          <time className={styles.entryTime} dateTime={entry.startTime}>
            {normalizeTimeForDisplay(entry.startTime)}
          </time>
          {entry.categoryName ? (
            <span
              className={styles.entryCategory}
              style={{ color: accentColor }}
            >
              <AppIcon
                name={entry.categoryIcon ?? 'tag'}
                size="xs"
                decorative
                className={styles.entryCategoryIcon}
              />
              {entry.categoryName}
            </span>
          ) : null}
          {duration ? (
            <span className={styles.entryDuration}>{duration}</span>
          ) : null}
        </div>

        {!entry.usedFallback && (
          <p className={styles.entryActivity}>{entry.activityTitle}</p>
        )}

        <p
          className={[
            styles.entryText,
            entry.usedFallback ? styles.entryTextFallback : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {entry.storyText}
        </p>
      </div>
    </li>
  )
}

export function DayStoryWidget({
  date,
  followUps,
  isLoading = false,
  className,
}: DayStoryWidgetProps) {
  const entries = useMemo(() => buildStoryEntries(followUps), [followUps])

  const grouped = useMemo(() => {
    const result: Array<{ hour: string; items: StoryEntry[] }> = []
    for (const entry of entries) {
      const hour = getHourLabel(entry.startTime)
      const last = result[result.length - 1]
      if (last && last.hour === hour) {
        last.items.push(entry)
      } else {
        result.push({ hour, items: [entry] })
      }
    }
    return result
  }, [entries])

  const totalMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0),
    [entries],
  )

  if (isLoading) {
    return (
      <article
        className={[styles.skeletonCard, className].filter(Boolean).join(' ')}
        aria-busy="true"
        aria-label="Cargando historia del día"
      >
        <Skeleton width="45%" height={14} />
        <Skeleton width="30%" height={28} />
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonEntry}>
            <Skeleton width={36} height={36} circle />
            <div className={styles.skeletonEntryBody}>
              <Skeleton width="25%" height={11} />
              <Skeleton width="85%" height={13} />
              <Skeleton width="65%" height={13} />
            </div>
          </div>
        ))}
      </article>
    )
  }

  return (
    <DataCard
      variant="glass"
      className={[styles.root, className].filter(Boolean).join(' ')}
      title="Historia del día"
      icon={<AppIcon name="book-open" size="md" decorative />}
      value={
        <div className={styles.body}>
          {entries.length > 0 ? (
            <>
              <p className={styles.summary}>
                <span className={styles.summaryCount}>{entries.length}</span>
                <span className={styles.summaryLabel}>
                  {entries.length === 1 ? 'sesión' : 'sesiones'} ·{' '}
                  {formatDuration(totalMinutes)} registrados
                </span>
              </p>

              <ol className={styles.timeline} aria-label="Timeline de actividades del día">
                {grouped.map((group, gi) =>
                  group.items.map((entry, ei) => {
                    const isFirstInGroup = ei === 0
                    const isLastGroup = gi === grouped.length - 1
                    const isLastInGroup = ei === group.items.length - 1
                    const isLast = isLastGroup && isLastInGroup
                    return (
                      <div key={entry.id}>
                        {isFirstInGroup && <HourDivider label={group.hour} />}
                        <EntryItem entry={entry} isLast={isLast} />
                      </div>
                    )
                  }),
                )}
              </ol>

              <p className={styles.foot}>{date}</p>
            </>
          ) : (
            <p className={styles.empty}>
              No hay sesiones completadas este día aún.
            </p>
          )}
        </div>
      }
    />
  )
}
