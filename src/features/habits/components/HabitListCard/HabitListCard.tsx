import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { HabitDayMarker } from '@/features/habits/components/HabitDayMarker'
import { HabitPeriodProgress } from '@/features/habits/components/HabitPeriodProgress'
import { HabitStatusBadge } from '@/features/habits/components/HabitStatusBadge'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitTypeBadge } from '@/features/habits/components/HabitTypeBadge'
import {
  useCompleteHabitMutation,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabits'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { getIdentityVisibility } from '@/features/habits/utils/habit-identity.utils'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { Habit, HabitCategory, HabitFollowUp } from '@/features/habits/types/habit.types'
import { formatDayForLabel } from '@/features/habits/utils/habit-date-format.utils'
import {
  getHabitFrequencyLabel,
  getHabitIntent,
} from '@/features/habits/utils/habit-list.utils'
import {
  countCoveredDays,
  getDayRingProgress,
  getHabitDayStatus,
  HABIT_DAY_STATUS_LABELS,
} from '@/features/habits/utils/habit-progress.utils'
import type { HabitWeekBarDay } from '@/features/habits/utils/habit-week.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Badge } from '@/shared/ui/Badge'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './HabitListCard.module.scss'

type HabitListCardProps = {
  habit: Habit
  /** Resuelta en la página con un mapa por id: ni una consulta por tarjeta. */
  category?: HabitCategory | null
  purpose?: HabitPurpose | null
  /**
   * Ventana **ya recortada** para pintar: 14 días en escritorio, 7 en móvil.
   * Los datos cargados son los mismos en las dos anchuras.
   */
  days: HabitWeekBarDay[]
  followUpByDate: Map<string, HabitFollowUp>
  onEdit: (habit: Habit) => void
}

export function HabitListCard({
  habit,
  category,
  purpose,
  days,
  followUpByDate,
  onEdit,
}: HabitListCardProps) {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const completeMutation = useCompleteHabitMutation()
  const updateMutation = useUpdateHabitMutation()

  const intent = getHabitIntent(habit)
  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'
  const detailPath = habitsPaths.detail(habit.id)

  const statuses = days.map((day) => getHabitDayStatus(habit, followUpByDate.get(day.date)))
  // El único número que sale de la ventana visible, y por eso la etiqueta dice
  // de qué ventana habla. La racha y el periodo vienen del hábito.
  const covered = countCoveredDays(statuses)

  // La regla innegociable, también fuera de Mi Día: con el día fallado o el
  // salvavidas gastado, la tarjeta no dice ni una palabra de identidad.
  // El último día de la ventana es el más reciente. Ver `HabitPurposeBanner`.
  const identityTone = getIdentityVisibility(statuses.at(-1) ?? 'empty')

  const haloStyle = habit.color
    ? ({ '--habit-halo-color': habit.color } as CSSProperties)
    : undefined

  async function handleComplete() {
    const ok = await confirm({
      title: '¿Marcar hábito como completado?',
      description: 'El hábito pasará al estado completado y desaparecerá de Mi Día.',
      confirmLabel: 'Completar',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    completeMutation.mutate(habit.id)
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
    updateMutation.mutate({ id: habit.id, status: 'archived' })
  }

  const menu = (
    <ul className={styles.menu}>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => navigate(detailPath)}>
          Ver detalle
        </button>
      </li>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => onEdit(habit)}>
          Editar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleComplete}
          disabled={completeMutation.isPending}
        >
          Completar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={[styles.menuItem, styles.menuItemDanger].join(' ')}
          onClick={handleArchive}
          disabled={updateMutation.isPending}
        >
          Archivar
        </button>
      </li>
    </ul>
  )

  return (
    <article className={styles.card} style={haloStyle}>
      {habit.color ? <span className={styles.halo} aria-hidden /> : null}

      <div className={styles.top}>
        <button
          type="button"
          className={styles.capsule}
          onClick={() => navigate(detailPath)}
          aria-label={`Ver detalle de ${habit.name}`}
        >
          <AppIcon name={habit.icon ?? 'seedling'} size="sm" decorative />
        </button>

        <div className={styles.identity}>
          <button type="button" className={styles.name} onClick={() => navigate(detailPath)}>
            {habit.name}
          </button>
          {habit.description ? <p className={styles.description}>{habit.description}</p> : null}
          {purpose && identityTone !== 'hidden' ? (
            <p className={styles.purpose}>
              <AppIcon name={purpose.icon ?? 'star'} size="2xs" decorative />
              Te acerca a: {purpose.name}
            </p>
          ) : null}
        </div>

        <div className={styles.more}>
          <Popover
            triggerLabel={`Más opciones de ${habit.name}`}
            trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
            content={menu}
            placement="bottom-end"
          />
        </div>
      </div>

      <div className={styles.badges}>
        <HabitTypeBadge habitType={habit.habitType} intent={intent} />
        <Badge>{getHabitFrequencyLabel(habit)}</Badge>
        {category ? <Badge>{category.name}</Badge> : null}
        <HabitStreakBadge streak={habit.streak} />
        {habit.weeklyLifelines > 0 ? (
          <Badge>
            <AppIcon name="heart" size="2xs" decorative className={styles.badgeIcon} />
            {habit.weeklyLifelines} salvavidas
          </Badge>
        ) : null}
        {habit.status !== 'active' ? (
          <HabitStatusBadge status={habit.status} label="En pausa" />
        ) : null}
      </div>

      <div
        className={styles.strip}
        role="img"
        aria-label={`Últimos ${days.length} días de ${habit.name}: ${covered} de ${days.length} cubiertos`}
      >
        {days.map((day, index) => {
          const status = statuses[index] ?? 'empty'
          return (
            <span
              key={day.date}
              className={styles.stripCell}
              title={`${formatDayForLabel(day.date)} — ${HABIT_DAY_STATUS_LABELS[status]}`}
            >
              <HabitDayMarker
                dayNumber={day.dayNumber}
                progress={
                  isQuantified ? getDayRingProgress(habit, followUpByDate.get(day.date)) : null
                }
                status={status}
                shape="bar"
                isToday={day.isToday}
                isFuture={day.isFuture}
              />
            </span>
          )
        })}
      </div>

      <p className={styles.stripLabel}>
        <span>Últimos {days.length} días</span>
        <span className={styles.stripCount}>
          {covered} / {days.length}
        </span>
      </p>

      {habit.periodDays > 0 ? (
        <div className={styles.progress}>
          <HabitPeriodProgress
            value={habit.days}
            periodDays={habit.periodDays}
            tone={intent}
            caption={`Periodo de ${habit.periodDays} días`}
          />
        </div>
      ) : null}
    </article>
  )
}
