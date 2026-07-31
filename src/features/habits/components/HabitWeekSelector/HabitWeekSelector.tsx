import { useEffect, useMemo, useRef } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import {
  getMonthDaysForWeek,
  getWeekEnd,
  getYearMonthFromDate,
} from '@/features/habits/utils/habit-week.utils'
import styles from './HabitWeekSelector.module.scss'

const MOBILE_MAX_WIDTH = 767

type HabitWeekSelectorProps = {
  weekStart: string
  onWeekChange: (weekStart: string) => void
}

function scrollElementIntoView(el: HTMLElement, inline: ScrollLogicalPosition) {
  el.scrollIntoView?.({ inline, block: 'nearest', behavior: 'smooth' })
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00Z')
  const end = new Date(getWeekEnd(weekStart) + 'T12:00:00Z')

  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  const startMonth = start.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
  const endMonth = end.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
  const year = end.getUTCFullYear()

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${endMonth} ${year}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`
}

export function HabitWeekSelector({ weekStart, onWeekChange }: HabitWeekSelectorProps) {
  const currentWeekStart = getMondayOfWeek(getTodayString())
  const isCurrentWeek = weekStart === currentWeekStart
  const { year, month } = useMemo(() => getYearMonthFromDate(weekStart), [weekStart])
  const days = useMemo(() => getMonthDaysForWeek(year, month, weekStart), [year, month, weekStart])

  const daysRef = useRef<HTMLDivElement>(null)
  const weekAnchorRef = useRef<HTMLButtonElement>(null)
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart])

  useEffect(() => {
    const scrollWeekIntoView = () => {
      const container = daysRef.current
      if (!container) return

      const inWeek = container.querySelectorAll<HTMLElement>('[data-in-week="true"]')
      const mid = inWeek[Math.floor(inWeek.length / 2)]
      const target = mid ?? weekAnchorRef.current
      if (target) scrollElementIntoView(target, 'center')
    }

    // Esperar layout del padding para que el centro sea alcanzable
    const frame = requestAnimationFrame(scrollWeekIntoView)

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    mediaQuery.addEventListener('change', scrollWeekIntoView)
    return () => {
      cancelAnimationFrame(frame)
      mediaQuery.removeEventListener('change', scrollWeekIntoView)
    }
  }, [days, weekStart])

  const handlePrevWeek = () => {
    onWeekChange(addDaysToString(weekStart, -7))
  }

  const handleNextWeek = () => {
    onWeekChange(addDaysToString(weekStart, 7))
  }

  const handleSelectDay = (date: string) => {
    onWeekChange(getMondayOfWeek(date))
  }

  const handleGoToCurrentWeek = () => {
    onWeekChange(currentWeekStart)
  }

  return (
    <div className={styles.root}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handlePrevWeek}
          aria-label="Semana anterior"
        >
          <AppIcon name="arrow-left" size="sm" decorative />
        </button>
        <span className={styles.weekLabel}>{weekLabel}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handleNextWeek}
          aria-label="Semana siguiente"
        >
          <AppIcon name="chevron-right" size="sm" decorative />
        </button>
      </div>

      {!isCurrentWeek && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className={styles.currentWeekBtn}
          onClick={handleGoToCurrentWeek}
        >
          Semana actual
        </Button>
      )}

      <div className={styles.daysWrap}>
        <div className={styles.days} ref={daysRef} role="group" aria-label={`Semana ${weekLabel}`}>
          {days.map((day) => (
            <button
              key={day.date}
              ref={day.date === weekStart ? weekAnchorRef : undefined}
              type="button"
              data-date={day.date}
              data-in-week={day.isInWeek ? 'true' : undefined}
              className={[
                styles.day,
                day.isInWeek ? styles.inWeek : '',
                day.isToday ? styles.today : '',
                day.isFuture ? styles.future : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={day.isInWeek}
              aria-current={day.isToday ? 'date' : undefined}
              onClick={() => handleSelectDay(day.date)}
            >
              <span className={styles.label}>{day.label}</span>
              <span className={styles.number}>{day.dayNumber}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
