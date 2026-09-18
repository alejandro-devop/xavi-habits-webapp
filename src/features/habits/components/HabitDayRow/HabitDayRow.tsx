import { useNavigate } from 'react-router'
import { HabitDayMarker } from '@/features/habits/components/HabitDayMarker'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import {
  useAddHabitFollowUpMutation,
  useRemoveHabitFollowUpMutation,
} from '@/features/habits/hooks/useHabitFollowUps'
import { useHabitLifelineAction } from '@/features/habits/hooks/useHabitLifelineAction'
import { useUpdateHabitMutation } from '@/features/habits/hooks/useHabits'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import type { HabitFollowUp, HabitMyDayEntry } from '@/features/habits/types/habit.types'
import { formatDayForLabel } from '@/features/habits/utils/habit-date-format.utils'
import { formatMeasureDisplay } from '@/features/habits/utils/habit-measure-form.utils'
import {
  followUpHasNotes,
  getCurrentProgressValue,
  getDayRingProgress,
  getHabitDailyGoal,
  getHabitDayStatus,
  HABIT_DAY_STATUS_LABELS,
} from '@/features/habits/utils/habit-progress.utils'
import type { HabitWeekBarDay } from '@/features/habits/utils/habit-week.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './HabitDayRow.module.scss'

type HabitDayRowProps = {
  entry: HabitMyDayEntry
  /** Los 7 días de la semana en curso. */
  days: HabitWeekBarDay[]
  /** Día sobre el que actúa el control circular. */
  focusDate: string
  followUpByDate: Map<string, HabitFollowUp>
  /** `false` en semanas futuras: los controles se ven, pero deshabilitados. */
  canRegister: boolean
  onOpenRegister: (date: string, followUp: HabitFollowUp | null) => void
}

/** Frecuencia o medida, la línea pequeña bajo el nombre. */
function getMicrocopy(
  habit: HabitMyDayEntry['habit'],
  followUp: HabitFollowUp | null | undefined,
): string {
  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'

  if (isQuantified) {
    const unit = habit.habitType === 'time' ? 'min' : formatMeasureDisplay(habit.measure)
    const goal = getHabitDailyGoal(habit)
    if (goal <= 0) return `medida · sin meta diaria`
    const current = getCurrentProgressValue(habit, followUp)
    if (current <= 0) return `medida · sin registrar, meta ${goal} ${unit}`
    return `medida · ${current} de ${goal} ${unit}`
  }

  if (habit.periodDays > 1) return `objetivo de ${habit.periodDays} días`
  return 'diario'
}

export function HabitDayRow({
  entry,
  days,
  focusDate,
  followUpByDate,
  canRegister,
  onOpenRegister,
}: HabitDayRowProps) {
  const { habit, followUp, lifelinesRemaining } = entry
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const addMutation = useAddHabitFollowUpMutation()
  const removeMutation = useRemoveHabitFollowUpMutation()
  const updateHabitMutation = useUpdateHabitMutation()
  const { spendLifeline, isPending: isSpendingLifeline } = useHabitLifelineAction()

  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'
  const focusFollowUp = followUpByDate.get(focusDate) ?? followUp
  const focusStatus = getHabitDayStatus(habit, focusFollowUp)
  const focusDayLabel = formatDayForLabel(focusDate)
  const isMutating = addMutation.isPending || removeMutation.isPending || isSpendingLifeline

  const startsLater = habit.startDate != null && focusDate < habit.startDate
  const toggleDisabled = !canRegister || startsLater || isMutating

  const detailPath = habitsPaths.detail(habit.id)
  const usedLifelines = Math.max(0, habit.weeklyLifelines - lifelinesRemaining)

  function isDayEditable(day: HabitWeekBarDay): boolean {
    if (!canRegister || day.isFuture) return false
    return habit.startDate == null || day.date >= habit.startDate
  }

  /**
   * Booleano: el círculo alterna logrado ↔ vacío. Con medida no se puede
   * alternar —hay que decir cuánto—, así que abre el panel de registro.
   */
  function handleToggle() {
    if (toggleDisabled) return

    if (isQuantified || focusStatus === 'lifeline' || focusStatus === 'failed') {
      onOpenRegister(focusDate, focusFollowUp ?? null)
      return
    }

    if (focusStatus === 'accomplished' && focusFollowUp) {
      removeMutation.mutate({
        id: focusFollowUp.id,
        context: { habitId: habit.id, date: focusDate },
      })
      return
    }

    addMutation.mutate({ habitId: habit.id, date: focusDate, isAccomplished: true })
  }

  async function handleArchive() {
    const ok = await confirm({
      title: '¿Archivar este hábito?',
      description: 'El hábito se ocultará de Mi Día y de las vistas activas.',
      confirmLabel: 'Archivar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    updateHabitMutation.mutate({ id: habit.id, status: 'archived' })
  }

  const toggleLabel = (() => {
    if (isQuantified) return `Registrar ${habit.name}, ${focusDayLabel}`
    if (focusStatus === 'accomplished') return `Desmarcar ${habit.name}, ${focusDayLabel}`
    if (focusStatus === 'lifeline' || focusStatus === 'failed') {
      return `Editar registro de ${habit.name}, ${focusDayLabel}`
    }
    return `Marcar ${habit.name}, ${focusDayLabel}`
  })()

  const focusRingProgress = getDayRingProgress(habit, focusFollowUp)

  const menu = (
    <ul className={styles.menu}>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => onOpenRegister(focusDate, focusFollowUp ?? null)}
          disabled={!canRegister}
        >
          Registrar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() =>
            void spendLifeline({ habitId: habit.id, date: focusDate, lifelinesRemaining })
          }
          disabled={!canRegister || lifelinesRemaining <= 0 || isSpendingLifeline}
        >
          Usar salvavidas ({lifelinesRemaining})
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => navigate(habitsPaths.edit(habit.id))}
        >
          Editar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={[styles.menuItem, styles.menuItemDanger].join(' ')}
          onClick={handleArchive}
          disabled={updateHabitMutation.isPending}
        >
          Archivar
        </button>
      </li>
    </ul>
  )

  return (
    <article className={styles.row}>
      <div className={styles.identity}>
        <button
          type="button"
          className={styles.capsule}
          onClick={() => navigate(detailPath)}
          aria-label={`Ver detalle de ${habit.name}`}
        >
          <AppIcon name={habit.icon ?? 'seedling'} size="sm" decorative />
        </button>

        <div className={styles.identityText}>
          <button type="button" className={styles.name} onClick={() => navigate(detailPath)}>
            {habit.name}
          </button>
          <p className={styles.microcopy}>
            {habit.category?.name ? (
              <span className={styles.tag}>{habit.category.name}</span>
            ) : null}
            <span className={styles.microcopyText}>{getMicrocopy(habit, focusFollowUp)}</span>
            {habit.weeklyLifelines > 0 ? (
              <span
                className={styles.lifelines}
                aria-label={`${lifelinesRemaining} de ${habit.weeklyLifelines} salvavidas disponibles`}
              >
                {Array.from({ length: habit.weeklyLifelines }, (_, index) => (
                  <span
                    key={index}
                    className={[
                      styles.lifelineDot,
                      index < usedLifelines ? styles.lifelineDotSpent : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className={styles.days} role="group" aria-label={`Semana de ${habit.name}`}>
        {days.map((day) => {
          const dayFollowUp = followUpByDate.get(day.date) ?? (day.date === focusDate ? followUp : null)
          const status = getHabitDayStatus(habit, dayFollowUp)
          const editable = isDayEditable(day)
          const label = `${editable ? 'Registrar' : 'Ver'} ${habit.name}, ${formatDayForLabel(day.date)} — ${HABIT_DAY_STATUS_LABELS[status]}`

          const marker = (
            <HabitDayMarker
              dayNumber={day.dayNumber}
              progress={isQuantified ? getDayRingProgress(habit, dayFollowUp) : null}
              hasNotes={followUpHasNotes(dayFollowUp)}
              status={status}
              isToday={day.isToday}
              isFuture={day.isFuture}
            />
          )

          return editable ? (
            <button
              key={day.date}
              type="button"
              className={styles.dayBtn}
              aria-label={label}
              onClick={() => onOpenRegister(day.date, dayFollowUp ?? null)}
            >
              {marker}
            </button>
          ) : (
            <span key={day.date} className={styles.dayStatic} aria-label={label} role="img">
              {marker}
            </span>
          )
        })}
      </div>

      <div className={styles.streak}>
        <HabitStreakBadge streak={habit.streak} compact />
      </div>

      <button
        type="button"
        className={[
          styles.toggle,
          focusStatus === 'accomplished' ? styles.toggleDone : '',
          focusStatus === 'lifeline' ? styles.toggleLifeline : '',
          focusStatus === 'failed' ? styles.toggleFailed : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleToggle}
        disabled={toggleDisabled}
        aria-pressed={isQuantified ? undefined : focusStatus === 'accomplished'}
        aria-label={toggleLabel}
      >
        {focusStatus === 'accomplished' ? <AppIcon name="check" size="sm" decorative /> : null}
        {focusStatus === 'lifeline' ? <AppIcon name="heart" size="sm" decorative /> : null}
        {focusStatus === 'failed' ? <AppIcon name="xmark" size="sm" decorative /> : null}
        {focusStatus !== 'accomplished' &&
        focusStatus !== 'lifeline' &&
        focusStatus !== 'failed' &&
        focusRingProgress !== null ? (
          <ToggleProgressRing progress={focusRingProgress} />
        ) : null}
      </button>

      <div className={styles.more}>
        <Popover
          triggerLabel={`Más opciones de ${habit.name}`}
          trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
          content={menu}
          placement="bottom-end"
        />
      </div>
    </article>
  )
}

const TOGGLE_RING_RADIUS = 9.5
const TOGGLE_RING_CIRCUMFERENCE = 2 * Math.PI * TOGGLE_RING_RADIUS

function ToggleProgressRing({ progress }: { progress: number }) {
  const dash = Math.min(Math.max(progress, 0), 1) * TOGGLE_RING_CIRCUMFERENCE
  return (
    <svg className={styles.toggleRing} viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle
        className={styles.toggleRingTrack}
        cx="12"
        cy="12"
        r={TOGGLE_RING_RADIUS}
        fill="none"
        strokeWidth="3"
      />
      <circle
        className={styles.toggleRingProgress}
        cx="12"
        cy="12"
        r={TOGGLE_RING_RADIUS}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${TOGGLE_RING_CIRCUMFERENCE}`}
        transform="rotate(-90 12 12)"
      />
    </svg>
  )
}
