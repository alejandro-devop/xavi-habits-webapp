import { useMemo } from 'react'
import { useRemainingDayTimer } from '@/features/activities/hooks/useRemainingDayTimer'
import {
  DAY_END_TIME,
  formatDayEndLabel,
} from '@/features/activities/utils/activity-day-metrics.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './DayRemainingWidget.module.scss'

const CLOCK_SIZE = 140
const STROKE_WIDTH = 7

type DayRemainingWidgetProps = {
  endTime?: string
  className?: string
}

export function DayRemainingWidget({
  endTime = DAY_END_TIME,
  className,
}: DayRemainingWidgetProps) {
  const { display, elapsedPercentage } = useRemainingDayTimer(endTime)
  const remainingPct = Math.max(0, Math.min(100, 100 - elapsedPercentage))

  const { radius, circumference, strokeDashoffset, center } = useMemo(() => {
    const r = (CLOCK_SIZE - STROKE_WIDTH) / 2 - 2
    const c = 2 * Math.PI * r
    return {
      radius: r,
      circumference: c,
      strokeDashoffset: c - (remainingPct / 100) * c,
      center: CLOCK_SIZE / 2,
    }
  }, [remainingPct])

  return (
    <article
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label="Tiempo restante del día"
    >
      <div className={styles.clock}>
        <svg
          className={styles.ring}
          viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          width={CLOCK_SIZE}
          height={CLOCK_SIZE}
          aria-hidden
        >
          <defs>
            <linearGradient id="dayRemainingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop
                offset="100%"
                stopColor="color-mix(in srgb, var(--color-primary) 55%, var(--color-success))"
              />
            </linearGradient>
          </defs>
          <circle
            className={styles.track}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            className={styles.progress}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            role="progressbar"
            aria-valuenow={remainingPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de tiempo restante"
          />
        </svg>
        <div className={styles.face}>
          <AppIcon name="clock" size="sm" decorative className={styles.icon} />
          <time className={styles.counter} aria-live="polite">
            {display}
          </time>
          <span className={styles.sublabel}>restante</span>
        </div>
      </div>
      <p className={styles.footer}>
        <span className={styles.elapsed}>{elapsedPercentage}% transcurrido</span>
        <span className={styles.dot} aria-hidden>
          ·
        </span>
        <span>cierra {formatDayEndLabel(endTime)}</span>
      </p>
    </article>
  )
}
