import { useEffect, useMemo, useRef } from 'react'
import type { WeekDay } from '@/features/activities/types/activity-followup.types'
import {
  canNavigateToNextMonth,
  getCurrentLocalDate,
  getMonthDaysForDate,
  shiftMonth,
} from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './ActivityMonthSelector.module.scss'

const MOBILE_MAX_WIDTH = 767

type ActivityMonthSelectorProps = {
  year: number
  month: number
  selectedDate: string
  onSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
}

function scrollElementIntoView(el: HTMLElement, inline: ScrollLogicalPosition) {
  el.scrollIntoView?.({ inline, block: 'nearest', behavior: 'smooth' })
}

function scrollMobileWeekIntoView(container: HTMLElement, days: WeekDay[], today: string): boolean {
  if (!days.some((day) => day.date === today)) return false

  const todayEl = container.querySelector<HTMLElement>(`[data-date="${today}"]`)
  if (!todayEl) return false

  scrollElementIntoView(todayEl, 'center')
  return true
}

export function ActivityMonthSelector({
  year,
  month,
  selectedDate,
  onSelect,
  onMonthChange,
}: ActivityMonthSelectorProps) {
  const days = useMemo(
    () => getMonthDaysForDate(year, month, selectedDate),
    [year, month, selectedDate],
  )

  const daysRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const canGoNext = canNavigateToNextMonth(year, month)

  const monthLabel = useMemo(
    () =>
      new Date(year, month - 1, 1).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      }),
    [year, month],
  )

  useEffect(() => {
    const scrollDaysIntoView = () => {
      const container = daysRef.current
      if (!container) return

      const today = getCurrentLocalDate()
      const isCurrentMonth = days.some((day) => day.isToday)

      if (isMobileViewport() && isCurrentMonth) {
        scrollMobileWeekIntoView(container, days, today)
        return
      }

      const target = selectedRef.current ?? container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)
      if (target) scrollElementIntoView(target, 'center')
    }

    scrollDaysIntoView()

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    mediaQuery.addEventListener('change', scrollDaysIntoView)
    return () => mediaQuery.removeEventListener('change', scrollDaysIntoView)
  }, [days, selectedDate, year, month])

  const handlePrevMonth = () => {
    const next = shiftMonth(year, month, -1)
    onMonthChange(next.year, next.month)
  }

  const handleNextMonth = () => {
    if (!canGoNext) return
    const next = shiftMonth(year, month, 1)
    onMonthChange(next.year, next.month)
  }

  return (
    <div className={styles.root}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handlePrevMonth}
          aria-label="Mes anterior"
        >
          <AppIcon name="arrow-left" size="sm" decorative />
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handleNextMonth}
          disabled={!canGoNext}
          aria-label="Mes siguiente"
        >
          <AppIcon name="chevron-right" size="sm" decorative />
        </button>
      </div>

      <div className={styles.daysWrap}>
        <div className={styles.days} ref={daysRef} role="group" aria-label={`Días de ${monthLabel}`}>
          {days.map((day) => (
            <button
              key={day.date}
              ref={day.isSelected ? selectedRef : undefined}
              type="button"
              data-date={day.date}
              className={[
                styles.day,
                day.isSelected ? styles.selected : '',
                day.isToday ? styles.today : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={day.isFuture}
              aria-disabled={day.isFuture}
              aria-pressed={day.isSelected}
              aria-current={day.isToday ? 'date' : undefined}
              onClick={() => onSelect(day.date)}
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
