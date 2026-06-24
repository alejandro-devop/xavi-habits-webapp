import type { SleepLog } from '@/features/sleep/types/sleep.types'
import { buildLogsByDay, getQualityColor } from '@/features/sleep/utils/sleep-month.utils'
import styles from './SleepCalendar.module.scss'

interface SleepCalendarProps {
  logs: SleepLog[]
  year: number
  month: number
  selectedDay: number | null
  onDaySelect: (day: number, log: SleepLog | undefined) => void
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function firstWeekdayOffset(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export function SleepCalendar({ logs, year, month, selectedDay, onDaySelect }: SleepCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstWeekdayOffset(year, month)
  const logsByDay = buildLogsByDay(logs)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className={styles.calendar}>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((w) => (
          <span key={w} className={styles.weekday}>{w}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: offset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const log = logsByDay.get(day)
          const isToday = isCurrentMonth && today.getDate() === day
          const isSelected = selectedDay === day

          return (
            <button
              key={day}
              type="button"
              className={`${styles.day} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${log ? styles.hasLog : ''}`}
              onClick={() => onDaySelect(day, log)}
              aria-label={`Día ${day}${log ? ', con registro' : ', sin registro'}`}
              style={isSelected && log ? { borderColor: getQualityColor(log.quality) } : undefined}
            >
              <span className={styles.dayNumber}>{day}</span>
              {log && (
                <span
                  className={styles.dot}
                  style={{ background: getQualityColor(log.quality) }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
