import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { SleepLogModal } from '@/features/sleep/components/SleepLogModal'
import { useSleepLogsQuery, useCreateSleepLogMutation } from '@/features/sleep/hooks/useSleep'
import { sleepPaths } from '@/features/sleep/routes/sleep-paths'
import { sleepDateToInputValue } from '@/features/sleep/utils/sleep.utils'
import { QUALITY_COLORS } from '@/features/sleep/utils/sleep-month.utils'
import type { SleepLog, SleepLogInput } from '@/features/sleep/types/sleep.types'
import styles from './SleepWidget.module.scss'

// ─── Week helpers ─────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

interface WeekDay {
  date: string
  label: string
  isToday: boolean
  isFuture: boolean
}

function getCurrentWeek(): { days: WeekDay[]; startDate: string; endDate: string } {
  const today = new Date()
  const todayStr = fmtDate(today)
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    const dateStr = fmtDate(d)
    days.push({ date: dateStr, label: labels[i], isToday: dateStr === todayStr, isFuture: d > today })
  }
  return { days, startDate: days[0].date, endDate: days[6].date }
}

function formatAvg(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Strip (reused in both layouts) ──────────────────────────────────────────

const MAX_MINUTES = 9 * 60

interface StripProps {
  days: WeekDay[]
  logByDate: Map<string, SleepLog>
}

function WeekStrip({ days, logByDate }: StripProps) {
  return (
    <>
      {days.map((day) => {
        const log = logByDate.get(day.date)
        const fillPct = log
          ? Math.max(8, Math.round((log.durationMinutes / MAX_MINUTES) * 100))
          : 0
        const color = log?.quality ? QUALITY_COLORS[log.quality] : 'var(--color-border)'

        return (
          <div key={day.date} className={styles.stripDay} style={{ opacity: day.isFuture ? 0.35 : 1 }}>
            <div className={styles.stripBar}>
              <div
                className={styles.stripFill}
                style={{
                  height: fillPct > 0 ? `${fillPct}%` : '3px',
                  background: fillPct > 0 ? color : 'transparent',
                }}
              />
            </div>
            <span className={[styles.stripLabel, day.isToday ? styles.stripLabelToday : ''].join(' ')}>
              {day.label}
            </span>
          </div>
        )
      })}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SleepWidget() {
  const [modalOpen, setModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { days, startDate, endDate } = getCurrentWeek()
  const today = fmtDate(new Date())

  const { data, isLoading } = useSleepLogsQuery({ startDate, endDate, limit: 7 })
  const createMutation = useCreateSleepLogMutation()

  const logs: SleepLog[] = data?.sleepLogs ?? []
  const logByDate = new Map<string, SleepLog>()
  for (const log of logs) logByDate.set(sleepDateToInputValue(log.sleepDate), log)

  const nightsLogged = logs.length
  const avgMinutes =
    nightsLogged > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.durationMinutes, 0) / nightsLogged)
      : null

  async function handleSubmit(values: SleepLogInput) {
    setSubmitError(null)
    try {
      await createMutation.mutateAsync(values)
      setModalOpen(false)
    } catch {
      setSubmitError('No se pudo guardar el registro.')
    }
  }

  function openModal() {
    setSubmitError(null)
    setModalOpen(true)
  }

  const statsNode =
    nightsLogged === 0 ? (
      <span className={styles.emptyText}>Sin registros esta semana</span>
    ) : (
      <span className={styles.statsText}>
        <span className={styles.statsHighlight}>{nightsLogged}</span>{' '}
        {nightsLogged === 1 ? 'noche' : 'noches'}
        {avgMinutes != null && (
          <>
            {' · '}Prom <span className={styles.statsHighlight}>{formatAvg(avgMinutes)}</span>
          </>
        )}
      </span>
    )

  return (
    <>
      <div className={styles.widget}>
        {/* Header — visible on all breakpoints */}
        <div className={[styles.header, styles.mobileOnly].join(' ')}>
          <span className={styles.title}>🌙 Sueño esta semana</span>
          <Link to={sleepPaths.root} className={styles.link}>Ver todo</Link>
        </div>

        {isLoading ? (
          <div className={styles.center}><Spinner size="sm" /></div>
        ) : (
          <>
            {/* Mobile / tablet: stacked */}
            <div className={[styles.strip, styles.mobileOnly].join(' ')}>
              <WeekStrip days={days} logByDate={logByDate} />
            </div>
            <div className={[styles.footer, styles.mobileOnly].join(' ')}>
              {statsNode}
              <Button variant="primary" size="sm" onClick={openModal}>+ Registrar</Button>
            </div>

            {/* Desktop: horizontal banner */}
            <div className={styles.desktopLayout}>
              <div className={styles.infoCol}>
                <span className={styles.title}>🌙 Sueño esta semana</span>
                <p className={styles.infoStats}>{statsNode}</p>
              </div>
              <div className={styles.stripCol}>
                <WeekStrip days={days} logByDate={logByDate} />
              </div>
              <div className={styles.actionCol}>
                <Button variant="primary" size="sm" onClick={openModal}>+ Registrar</Button>
                <Link to={sleepPaths.root} className={styles.link}>Ver todo</Link>
              </div>
            </div>
          </>
        )}
      </div>

      <SleepLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefillDate={today}
        loading={createMutation.isPending}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </>
  )
}
