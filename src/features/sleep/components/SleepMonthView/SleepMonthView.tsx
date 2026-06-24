import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import type { SleepLog } from '@/features/sleep/types/sleep.types'
import { useSleepLogsQuery, useSleepStatsQuery } from '@/features/sleep/hooks/useSleep'
import {
  buildLogsByDay,
  computeStreak,
  formatDuration,
  getMonthName,
  getMonthRange,
} from '@/features/sleep/utils/sleep-month.utils'
import { SleepBarChart } from '../SleepBarChart/SleepBarChart'
import { SleepCalendar } from '../SleepCalendar/SleepCalendar'
import { SleepDayDetail } from '../SleepDayDetail/SleepDayDetail'
import { SleepTimeline } from '../SleepTimeline/SleepTimeline'
import styles from './SleepMonthView.module.scss'

interface SleepMonthViewProps {
  onAdd: (date?: string) => void
  onEdit: (log: SleepLog) => void
  onDelete: (log: SleepLog) => void
  deletingId: string | null
}

export function SleepMonthView({ onAdd, onEdit, onDelete, deletingId }: SleepMonthViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const { startDate, endDate } = getMonthRange(year, month)
  const { data: logsData, isLoading: logsLoading } = useSleepLogsQuery({
    startDate,
    endDate,
    limit: 31,
  })
  const { data: stats } = useSleepStatsQuery({ startDate, endDate })

  const logs = logsData?.sleepLogs ?? []
  const logsByDay = buildLogsByDay(logs)
  const selectedLog = selectedDay != null ? logsByDay.get(selectedDay) : undefined
  const streak = computeStreak(logs, year, month)

  function prevMonth() {
    setSelectedDay(null)
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    setSelectedDay(null)
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function handleDaySelect(day: number, log: SleepLog | undefined) {
    setSelectedDay(day === selectedDay ? null : day)
    void log
  }

  function handleAdd(date?: string) {
    onAdd(date)
  }

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.nav}>
          <button type="button" className={styles.navBtn} onClick={prevMonth} aria-label="Mes anterior">
            ‹
          </button>
          <span className={styles.monthLabel}>{getMonthName(month)} {year}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
        <Button variant="primary" size="sm" onClick={() => handleAdd()}>
          + Registrar
        </Button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Promedio</span>
          <span className={styles.statValue}>
            {stats ? formatDuration(stats.avgDurationMinutes) : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Noches</span>
          <span className={styles.statValue}>{stats?.totalNights ?? '—'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Racha</span>
          <span className={styles.statValue}>{streak > 0 ? `${streak}d` : '—'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Mejor noche</span>
          <span className={styles.statValue}>
            {stats && stats.maxDurationMinutes > 0 ? formatDuration(stats.maxDurationMinutes) : '—'}
          </span>
        </div>
      </div>

      {logsLoading ? (
        <div className={styles.center}><Spinner /></div>
      ) : (
        <>
          <Card className={styles.chartCard}>
            <p className={styles.sectionLabel}>Horas de sueño por noche</p>
            <SleepBarChart logs={logs} year={year} month={month} />
          </Card>

          <div className={styles.calendarRow}>
            <Card className={styles.calendarCard}>
              <p className={styles.sectionLabel}>Calendario</p>
              <SleepCalendar
                logs={logs}
                year={year}
                month={month}
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
              />
            </Card>

            <Card className={styles.detailCard}>
              <p className={styles.sectionLabel}>Detalle</p>
              <SleepDayDetail
                day={selectedDay}
                month={month}
                year={year}
                log={selectedLog}
                onAdd={handleAdd}
                onEdit={onEdit}
              />
            </Card>
          </div>

          {logs.length > 0 && (
            <Card>
              <p className={styles.sectionLabel}>Registros del mes</p>
              <SleepTimeline
                logs={logs}
                onEdit={onEdit}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
