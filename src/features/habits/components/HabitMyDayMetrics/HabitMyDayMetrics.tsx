import { useId, useMemo } from 'react'
import type { HabitMyDayEntry } from '@/features/habits/types/habit.types'
import {
  getHabitDayTotals,
  getHabitStreakSummary,
  getStarHabit,
} from '@/features/habits/utils/habit-stats.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitMyDayMetrics.module.scss'

const RING_RADIUS = 50
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

type HabitMyDayMetricsProps = {
  entries: HabitMyDayEntry[]
  isLoading?: boolean
}

/**
 * Las tres tarjetas del encabezado. Todo sale de `entries`: son derivados de
 * cliente sobre lo que ya devuelve `habitMyDay`, sin una sola petición nueva.
 */
export function HabitMyDayMetrics({ entries, isLoading = false }: HabitMyDayMetricsProps) {
  const totals = useMemo(() => getHabitDayTotals(entries), [entries])
  const streaks = useMemo(() => getHabitStreakSummary(entries), [entries])
  const star = useMemo(() => getStarHabit(entries), [entries])
  const showAggregates = streaks !== null || star !== null

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[0, 1, 2].map((index) => (
          <Card key={index} className={styles.card} padding="md">
            <Skeleton width="40%" height={12} />
            <div className={styles.skeletonBody}>
              <Skeleton width={index === 0 ? 104 : '55%'} height={index === 0 ? 104 : 34} circle={index === 0} />
              <Skeleton width="80%" height={12} />
              <Skeleton width="60%" height={12} />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={[styles.grid, showAggregates ? '' : styles.gridSolo].filter(Boolean).join(' ')}>
      <DayRingCard totals={totals} />
      {streaks ? <StreakCard summary={streaks} /> : null}
      {star ? <StarCard summary={star} /> : null}
    </div>
  )
}

function DayRingCard({ totals }: { totals: ReturnType<typeof getHabitDayTotals> }) {
  const gradientId = useId()
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(totals.percent, 100) / 100)

  const counters = [
    { key: 'ok', tone: styles.dotDone, value: totals.accomplished, label: 'logrados' },
    { key: 'lf', tone: styles.dotLifeline, value: totals.lifelines, label: 'con salvavidas' },
    { key: 'no', tone: styles.dotFailed, value: totals.failed, label: 'fallados' },
    { key: 'pd', tone: styles.dotPending, value: totals.pending, label: 'pendientes' },
  ]

  return (
    <Card className={[styles.card, styles.cardDay].join(' ')} padding="md">
      <span className={styles.bloom} aria-hidden />
      <p className={styles.cardTitle}>Tu día</p>
      <div className={styles.ringRow}>
        <div
          className={styles.ring}
          role="img"
          aria-label={`${totals.percent}% del día cubierto: ${totals.accomplished} logrados y ${totals.lifelines} con salvavidas de ${totals.total} hábitos`}
        >
          <svg viewBox="0 0 120 120" width="104" height="104" aria-hidden focusable="false">
            <circle
              className={styles.ringTrack}
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="11"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="120" y2="120">
                <stop stopColor="var(--aura-ring-from)" />
                <stop offset="1" stopColor="var(--color-success)" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.ringCenter} aria-hidden>
            <span className={styles.ringValue}>{totals.percent}%</span>
            <span className={styles.ringLabel}>del día</span>
          </span>
        </div>

        <ul className={styles.counters}>
          {counters.map((counter) => (
            <li key={counter.key} className={styles.counter}>
              <span className={[styles.dot, counter.tone].join(' ')} aria-hidden />
              <b className={styles.counterValue}>{counter.value}</b> {counter.label}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function StreakCard({ summary }: { summary: NonNullable<ReturnType<typeof getHabitStreakSummary>> }) {
  return (
    <Card className={[styles.card, styles.cardStreak].join(' ')} padding="md">
      <span className={styles.bloom} aria-hidden />
      <p className={styles.cardTitle}>Racha media</p>
      <p className={styles.bigStat}>
        {summary.average}
        <span className={styles.bigStatUnit}> {summary.average === 1 ? 'día' : 'días'}</span>
      </p>
      <p className={styles.sub}>
        <AppIcon name="fire" size="2xs" decorative className={styles.subIcon} />
        {summary.aboveTen} {summary.aboveTen === 1 ? 'hábito pasa' : 'hábitos pasan'} de 10 días
        seguidos
      </p>
      <ProgressTrack
        ratio={summary.ratio}
        tone="amber"
        label={`Racha media de ${summary.average} días sobre la mejor marca de ${summary.best}`}
      />
      <p className={styles.sub}>
        Mejor racha: {summary.best} {summary.best === 1 ? 'día' : 'días'} ·{' '}
        {Math.round(summary.ratio * 100)}%
      </p>
    </Card>
  )
}

function StarCard({ summary }: { summary: NonNullable<ReturnType<typeof getStarHabit>> }) {
  const { entry, periodDays, days, periodRatio, streak } = summary

  return (
    <Card className={[styles.card, styles.cardStar].join(' ')} padding="md">
      <span className={styles.bloom} aria-hidden />
      <p className={styles.cardTitle}>Hábito estrella</p>
      <p className={styles.starName}>
        <AppIcon name={entry.habit.icon ?? 'star'} size="sm" decorative className={styles.starIcon} />
        {entry.habit.name}
      </p>
      {periodDays !== null ? (
        <>
          <p className={styles.sub}>
            {days} de {periodDays} días del periodo
          </p>
          <ProgressTrack
            ratio={periodRatio ?? 0}
            tone="mint"
            label={`${days} de ${periodDays} días del periodo`}
          />
        </>
      ) : (
        <p className={styles.sub}>{days} {days === 1 ? 'día' : 'días'} acumulados</p>
      )}
      <p className={styles.sub}>
        Racha activa de {streak} {streak === 1 ? 'día' : 'días'}
      </p>
    </Card>
  )
}

function ProgressTrack({
  ratio,
  tone,
  label,
}: {
  ratio: number
  tone: 'mint' | 'amber'
  label: string
}) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100)

  return (
    <div
      className={[styles.track, tone === 'amber' ? styles.trackAmber : ''].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      <span className={styles.trackFill} style={{ width: `${percent}%` }} />
    </div>
  )
}
