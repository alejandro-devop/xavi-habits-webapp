import { useState } from 'react'
import { Drawer } from '@/shared/ui/Drawer'
import { AppIcon } from '@/shared/ui/AppIcon'
import {
  BLOCK_HEIGHT_PX,
  DAY_LABELS,
  TIME_COL_WIDTH,
  formatBlockTime,
  formatEventTime,
  generateTimeBlocks,
  getOrderedDays,
  getRowSpan,
} from '@/features/weekly-routine/utils/planner.utils'
import type {
  DayOfWeek,
  WeeklyRoutine,
  WeeklyRoutineActivity,
} from '@/features/weekly-routine/types/weekly-routine.types'
import styles from './WeeklyPlanner.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  routine: WeeklyRoutine
  onSlotClick: (day: DayOfWeek, time: string) => void
  onEventClick: (event: WeeklyRoutineActivity) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActivitiesForDay(routine: WeeklyRoutine, day: DayOfWeek): WeeklyRoutineActivity[] {
  return routine.schedule?.find((s) => s.dayOfWeek === day)?.activities ?? []
}

function getCategoryColor(event: WeeklyRoutineActivity): string {
  return event.activity?.category?.color ?? 'var(--color-accent)'
}

// ── Event block ───────────────────────────────────────────────────────────────

type EventBlockProps = {
  event: WeeklyRoutineActivity
  rowStart: number
  rowSpan: number
  onClick: () => void
}

function EventBlock({ event, rowStart, rowSpan, onClick }: EventBlockProps) {
  const color = getCategoryColor(event)
  const timeLabel = formatEventTime(event.startTime, event.durationMinutes)
  const isShort = rowSpan <= 2

  return (
    <button
      type="button"
      className={[styles.event, isShort ? styles.eventShort : ''].join(' ')}
      style={{
        gridRow: `${rowStart} / span ${rowSpan}`,
        '--event-color': color,
      } as React.CSSProperties}
      onClick={onClick}
      aria-label={`${event.activity?.title ?? 'Evento'} – ${timeLabel}`}
    >
      <span className={styles.eventTitle}>{event.activity?.title ?? '—'}</span>
      {!isShort && <span className={styles.eventTime}>{timeLabel}</span>}
      {!isShort && event.notes && <span className={styles.eventNotes}>{event.notes}</span>}
    </button>
  )
}

// ── Group block ───────────────────────────────────────────────────────────────

type GroupBlockProps = {
  events: WeeklyRoutineActivity[]
  rowStart: number
  onClick: () => void
}

function GroupBlock({ events, rowStart, onClick }: GroupBlockProps) {
  return (
    <button
      type="button"
      className={[styles.event, styles.eventGroup].join(' ')}
      style={{ gridRow: `${rowStart} / span 1` }}
      onClick={onClick}
      aria-label={`${events.length} eventos`}
    >
      <span className={styles.eventTitle}>
        <AppIcon name="layer-group" size="xs" /> {events.length} eventos
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyPlanner({ routine, onSlotClick, onEventClick }: Props) {
  const [groupDrawer, setGroupDrawer] = useState<WeeklyRoutineActivity[] | null>(null)

  const days = getOrderedDays(routine.startDay)
  const blocks = generateTimeBlocks(routine.dayStartTime, routine.dayEndTime)
  const totalRows = blocks.length + 1

  const gridTemplateRows = `48px repeat(${blocks.length}, ${BLOCK_HEIGHT_PX}px)`
  const gridTemplateColumns = `${TIME_COL_WIDTH}px repeat(${days.length}, minmax(300px, 1fr))`

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        <div
          className={styles.grid}
          style={{ gridTemplateRows, gridTemplateColumns }}
          role="grid"
          aria-label={`Planner semanal: ${routine.name}`}
        >
          {/* ── Corner ── */}
          <div className={styles.corner} style={{ gridRow: 1, gridColumn: 1 }} />

          {/* ── Day headers ── */}
          {days.map((day, colIdx) => (
            <div
              key={day}
              className={styles.dayHeader}
              style={{ gridRow: 1, gridColumn: colIdx + 2 }}
              role="columnheader"
            >
              {DAY_LABELS[day]}
            </div>
          ))}

          {/* ── Time labels ── */}
          {blocks.map((block, rowIdx) => (
            <div
              key={block.time}
              className={[
                styles.timeLabel,
                block.isHour ? styles.timeLabelHour : styles.timeLabelQuarter,
                block.isEvenHour ? styles.stripeEven : styles.stripeOdd,
              ].join(' ')}
              style={{ gridRow: rowIdx + 2, gridColumn: 1 }}
              aria-hidden="true"
            >
              {block.label}
            </div>
          ))}

          {/* ── Day columns ── */}
          {days.map((day, colIdx) => {
            const dayActivities = getActivitiesForDay(routine, day)
            const col = colIdx + 2

            const eventsByBlock = new Map<number, WeeklyRoutineActivity[]>()
            for (const act of dayActivities) {
              const blockIdx = blocks.findIndex((b) => b.time === act.startTime)
              if (blockIdx === -1) continue
              const list = eventsByBlock.get(blockIdx) ?? []
              list.push(act)
              eventsByBlock.set(blockIdx, list)
            }

            const occupiedRows = new Set<number>()
            for (const act of dayActivities) {
              const startIdx = blocks.findIndex((b) => b.time === act.startTime)
              if (startIdx === -1) continue
              const span = getRowSpan(act.durationMinutes)
              for (let r = startIdx; r < startIdx + span; r++) occupiedRows.add(r)
            }

            return (
              <div
                key={day}
                className={styles.dayColumn}
                style={{
                  gridRow: `2 / ${totalRows + 1}`,
                  gridColumn: col,
                  display: 'grid',
                  gridTemplateRows: `repeat(${blocks.length}, ${BLOCK_HEIGHT_PX}px)`,
                }}
              >
                {/* Clickable slots */}
                {blocks.map((block, rowIdx) => (
                  <button
                    key={block.time}
                    type="button"
                    className={[
                      styles.slot,
                      block.isHour ? styles.slotHour : styles.slotQuarter,
                      block.isEvenHour ? styles.stripeEven : styles.stripeOdd,
                      occupiedRows.has(rowIdx) ? styles.slotOccupied : '',
                    ].join(' ')}
                    onClick={() => onSlotClick(day, block.time)}
                    aria-label={`Agregar evento el ${DAY_LABELS[day]} a las ${formatBlockTime(block.time)}`}
                    tabIndex={occupiedRows.has(rowIdx) ? -1 : 0}
                  />
                ))}

                {/* Events */}
                <div
                  className={styles.eventsLayer}
                  style={{ gridTemplateRows: `repeat(${blocks.length}, ${BLOCK_HEIGHT_PX}px)` }}
                >
                  {Array.from(eventsByBlock.entries()).map(([blockIdx, events]) => {
                    const block = blocks[blockIdx]
                    if (!block) return null
                    const rowStart = blockIdx + 1

                    if (events.length > 1) {
                      return (
                        <GroupBlock
                          key={block.time}
                          events={events}
                          rowStart={rowStart}
                          onClick={() => setGroupDrawer(events)}
                        />
                      )
                    }

                    const event = events[0]!
                    const rowSpan = getRowSpan(event.durationMinutes)
                    return (
                      <EventBlock
                        key={event.id}
                        event={event}
                        rowStart={rowStart}
                        rowSpan={rowSpan}
                        onClick={() => onEventClick(event)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Group drawer ── */}
      <Drawer
        open={groupDrawer !== null}
        onClose={() => setGroupDrawer(null)}
        side="bottom"
        title="Eventos en este bloque"
      >
        {groupDrawer?.map((event) => (
          <button
            key={event.id}
            type="button"
            className={styles.drawerEvent}
            onClick={() => {
              setGroupDrawer(null)
              onEventClick(event)
            }}
          >
            <span
              className={styles.drawerEventDot}
              style={{ background: getCategoryColor(event) }}
            />
            <div className={styles.drawerEventInfo}>
              <span className={styles.drawerEventTitle}>{event.activity?.title ?? '—'}</span>
              <span className={styles.drawerEventTime}>
                {formatEventTime(event.startTime, event.durationMinutes)}
              </span>
            </div>
            <AppIcon name="chevron-right" size="sm" className={styles.drawerEventChevron} />
          </button>
        ))}
      </Drawer>
    </div>
  )
}
