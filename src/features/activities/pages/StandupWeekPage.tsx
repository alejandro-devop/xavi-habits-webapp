import { useMemo } from 'react'
import { Link } from 'react-router'
import { useStandupMembersQuery, useStandupWeekQuery } from '@/features/activities/hooks/useStandup'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { StandupItem, StandupItemStatus } from '@/features/activities/types/standup.types'
import { getCurrentLocalDate } from '@/features/activities/utils/activity-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './StandupWeekPage.module.scss'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es', { weekday: 'short' })
const DAY_FORMATTER = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

const STATUS_CHIP_CLASS: Record<StandupItemStatus, string> = {
  pending: 'chipPending',
  in_progress: 'chipInProgress',
  blocked: 'chipBlocked',
  completed: 'chipCompleted',
}

function formatDateLabel(date: string) {
  const d = new Date(`${date}T12:00:00`)
  const weekday = WEEKDAY_FORMATTER.format(d)
  const day = DAY_FORMATTER.format(d)
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day }
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase()
}

export function StandupWeekPage() {
  const today = getCurrentLocalDate()
  const { data: members = [] } = useStandupMembersQuery(true)
  const { data: week = [], isLoading, isError, refetch } = useStandupWeekQuery(today, 5)

  const rows = useMemo(() => {
    const memberIds = new Map<string, string>()
    for (const member of members) {
      if (member.isActive) memberIds.set(member.id, member.name)
    }
    for (const entry of week) {
      for (const item of entry.items) {
        if (!memberIds.has(item.memberId)) {
          memberIds.set(item.memberId, item.member?.name ?? 'Sin responsable')
        }
      }
    }

    return [...memberIds.entries()]
      .map(([memberId, memberName]) => {
        const itemsByDate = new Map<string, StandupItem[]>()
        for (const entry of week) {
          itemsByDate.set(
            entry.date,
            entry.items.filter((item) => item.memberId === memberId),
          )
        }

        const titleCounts = new Map<string, number>()
        for (const items of itemsByDate.values()) {
          const seenThisDay = new Set<string>()
          for (const item of items) {
            const key = normalizeTitle(item.title)
            if (seenThisDay.has(key)) continue
            seenThisDay.add(key)
            titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1)
          }
        }

        return { memberId, memberName, itemsByDate, titleCounts }
      })
      .sort((a, b) => a.memberName.localeCompare(b.memberName, 'es'))
  }, [members, week])

  const hasAnyItem = week.some((entry) => entry.items.length > 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vista semanal</h1>
          <p className={styles.subtitle}>
            Últimos días hábiles: si el mismo ítem se repite varios días seguidos, aparece con 🔁.
          </p>
        </div>
        <Link to={activitiesPaths.standup} className={styles.backLink}>
          ← Ver día
        </Link>
      </div>

      {isLoading ? <Skeleton height="12rem" /> : null}
      {isError ? (
        <Alert variant="danger">
          No se pudo cargar la vista semanal.{' '}
          <button className={styles.retryButton} onClick={() => void refetch()}>
            Reintentar
          </button>
        </Alert>
      ) : null}

      {!isLoading && !isError && !hasAnyItem ? (
        <EmptyState
          title="Sin entradas esta semana"
          description="Aún no hay ítems registrados en los últimos días hábiles."
        />
      ) : null}

      {!isLoading && !isError && rows.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.memberHeader}>Responsable</th>
                {week.map((entry) => {
                  const { weekday, day } = formatDateLabel(entry.date)
                  const isToday = entry.date === today
                  return (
                    <th key={entry.date} className={isToday ? styles.todayHeader : undefined}>
                      <Link
                        to={`${activitiesPaths.standup}?date=${entry.date}`}
                        className={styles.dateLink}
                      >
                        <span className={styles.weekday}>{weekday}</span>
                        <span className={styles.day}>{day}</span>
                      </Link>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.memberId}>
                  <td className={styles.memberCell}>{row.memberName}</td>
                  {week.map((entry) => {
                    const items = row.itemsByDate.get(entry.date) ?? []
                    return (
                      <td key={entry.date} className={styles.cell}>
                        {items.map((item) => {
                          const repeated = (row.titleCounts.get(normalizeTitle(item.title)) ?? 0) > 1
                          return (
                            <Link
                              key={item.id}
                              to={`${activitiesPaths.standup}?date=${entry.date}`}
                              className={`${styles.chip} ${styles[STATUS_CHIP_CLASS[item.status]]}`}
                              title={item.blockedReason ?? item.notes ?? item.title}
                            >
                              {repeated ? '🔁 ' : ''}
                              {item.title}
                            </Link>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
