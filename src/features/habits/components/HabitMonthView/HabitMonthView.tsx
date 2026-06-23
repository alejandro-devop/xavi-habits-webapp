import { useState } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Modal } from '@/shared/ui/Modal'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { DIFFICULTY_EMOJIS } from '@/features/habits/utils/habit-difficulty.utils'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import styles from './HabitMonthView.module.scss'

type Props = {
  habit: Habit
  followUpByDate: Map<string, HabitFollowUp>
  today: string
}

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function HabitMonthView({ habit, followUpByDate, today }: Props) {
  const [year, setYear] = useState(() => Number(today.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const firstDayRaw = new Date(year, month - 1, 1).getDay()
  const firstDayMon = (firstDayRaw + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    const todayYear = Number(today.slice(0, 4))
    const todayMonth = Number(today.slice(5, 7))
    if (year === todayYear && month === todayMonth) return
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const todayYear = Number(today.slice(0, 4))
  const todayMonth = Number(today.slice(5, 7))
  const isCurrentMonth = year === todayYear && month === todayMonth

  const cells: Array<string | null> = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function handleCellClick(date: string) {
    if (date > today) return
    setSelectedDate(date)
  }

  const selectedFollowUp = selectedDate ? followUpByDate.get(selectedDate) : undefined

  return (
    <div className={styles.root}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
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

      <div className={styles.dayHeaders}>
        {DAY_HEADERS.map((d) => (
          <span key={d} className={styles.dayHeader}>
            {d}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((date, i) => {
          if (date === null) {
            return <div key={`ph-${i}`} className={styles.placeholder} />
          }

          const followUp = followUpByDate.get(date)
          const isFuture = date > today
          const isToday = date === today
          const hasNotes = Boolean(followUp?.notes?.trim())
          const difficulty = followUp?.difficulty ?? null
          const isLifeline = followUp?.isLifeline ?? false

          let stateClass = ''
          if (followUp?.isAccomplished) stateClass = styles.cellOk
          else if (followUp?.isFailed) stateClass = styles.cellFail
          else if (isLifeline) stateClass = styles.cellLife

          const dayNum = Number(date.slice(8))

          return (
            <button
              key={date}
              type="button"
              className={[
                styles.cell,
                stateClass,
                isToday ? styles.cellToday : '',
                isFuture ? styles.cellFuture : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCellClick(date)}
              disabled={isFuture}
              aria-label={`${date}${followUp ? ' — registrado' : ''}`}
              aria-pressed={Boolean(followUp)}
            >
              <span className={styles.cellTop}>
                <span className={styles.dayNum}>{dayNum}</span>
                {hasNotes && (
                  <AppIcon name="comments" size="xs" className={styles.noteIcon} decorative />
                )}
              </span>

              {!isFuture && !followUp?.isFailed && (
                <span className={styles.cellBottom} aria-hidden="true">
                  {isLifeline
                    ? '🛡'
                    : difficulty !== null
                      ? DIFFICULTY_EMOJIS[difficulty]
                      : null}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchOk].join(' ')} />
          Logrado
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchFail].join(' ')} />
          Fallido
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchLife].join(' ')} />
          Salvavidas
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchEmpty].join(' ')} />
          Sin registro
        </div>
        <div className={styles.legendItem}>
          <AppIcon name="comments" size="xs" decorative />
          Tiene nota
        </div>
        <div className={styles.legendItem}>
          <span>😊→💀</span>
          Dificultad
        </div>
      </div>

      {selectedDate && (
        <Modal
          open={Boolean(selectedDate)}
          onClose={() => setSelectedDate(null)}
          title={selectedDate}
          size="sm"
        >
          <HabitFollowUpForm
            habit={habit}
            date={selectedDate}
            existingFollowUp={selectedFollowUp}
            onSuccess={() => setSelectedDate(null)}
          />
        </Modal>
      )}
    </div>
  )
}
