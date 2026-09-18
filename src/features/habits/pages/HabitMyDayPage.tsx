import { useMemo, useState } from 'react'
import { HabitCategoryFilter } from '@/features/habits/components/HabitCategoryFilter'
import { HabitDayRow } from '@/features/habits/components/HabitDayRow'
import { HabitFollowUpDrawer } from '@/features/habits/components/HabitFollowUpDrawer'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { HabitMyDayMetrics } from '@/features/habits/components/HabitMyDayMetrics'
import { HabitWeekSelector } from '@/features/habits/components/HabitWeekSelector'
import {
  useHabitCategoriesQuery,
  useHabitFollowUpsInDatesQuery,
  useHabitMyDayQuery,
} from '@/features/habits/hooks/useHabits'
import type { HabitFollowUp } from '@/features/habits/types/habit.types'
import {
  formatLongDate,
  formatWeekEyebrow,
} from '@/features/habits/utils/habit-date-format.utils'
import { sortMyDayEntries } from '@/features/habits/utils/habit-order.utils'
import {
  buildFollowUpsByHabit,
  countEntriesByCategory,
  filterEntriesByCategory,
} from '@/features/habits/utils/habit-stats.utils'
import { getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import {
  getMyDayFocusDate,
  getWeekDays,
  getWeekEnd,
  isFutureWeek,
} from '@/features/habits/utils/habit-week.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitMyDayPage.module.scss'

const EMPTY_FOLLOW_UP_MAP = new Map<string, HabitFollowUp>()

/** Lunes → domingo. `X` para miércoles, como manda la costumbre en español. */
const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type RegisterTarget = {
  habitId: string
  date: string
  followUp: HabitFollowUp | null
}

export function HabitMyDayPage() {
  const today = getTodayString()
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today))
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [registerTarget, setRegisterTarget] = useState<RegisterTarget | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const focusDate = getMyDayFocusDate(weekStart, today)
  const canRegister = !isFutureWeek(weekStart, today)
  const weekEnd = getWeekEnd(weekStart)
  const days = useMemo(() => getWeekDays(weekStart, today), [weekStart, today])

  const { data, isLoading, isError, refetch } = useHabitMyDayQuery(focusDate)
  const entries = useMemo(() => (data ? sortMyDayEntries(data) : []), [data])

  // La tira solo pinta 7 días: con la semana basta, el mes entero vive en el
  // calendario del hábito.
  const { data: followUpGroups, isPending: isFollowUpsPending } = useHabitFollowUpsInDatesQuery(
    weekStart,
    weekEnd,
  )
  const { data: categories = [] } = useHabitCategoriesQuery()

  const followUpsByHabit = useMemo(
    () => buildFollowUpsByHabit(followUpGroups),
    [followUpGroups],
  )

  const categoryCounts = useMemo(() => countEntriesByCategory(entries), [entries])
  const visibleEntries = useMemo(
    () => filterEntriesByCategory(entries, categoryFilter),
    [entries, categoryFilter],
  )

  const registerEntry = registerTarget
    ? (entries.find((entry) => entry.habit.id === registerTarget.habitId) ?? null)
    : null

  const header = (
    <header className={styles.head}>
      <div className={styles.headText}>
        <p className={styles.eyebrow}>{formatWeekEyebrow(weekStart)}</p>
        <h1 className={styles.title}>{formatLongDate(focusDate)}</h1>
        {!canRegister ? (
          <p className={styles.futureBadge}>
            <AppIcon name="eye" size="2xs" decorative />
            Semana futura — solo consulta
          </p>
        ) : null}
      </div>
      <HabitWeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />
    </header>
  )

  const newHabitButton = (
    <Button className={styles.cta} onClick={() => setCreateOpen(true)} leftIcon={<AppIcon name="plus" size="xs" decorative />}>
      <span className={styles.ctaLabel}>Nuevo hábito</span>
    </Button>
  )

  if (isLoading) {
    return (
      <div className={styles.root}>
        {header}
        <HabitMyDayMetrics entries={[]} isLoading />
        <ul className={styles.rows} aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className={styles.skeletonRow}>
              <Skeleton width={42} height={42} radius="var(--radius-md)" />
              <div className={styles.skeletonText}>
                <Skeleton width="45%" height={14} />
                <Skeleton width="30%" height={10} />
              </div>
              <Skeleton width={40} height={40} circle />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.root}>
        {header}
        <Alert variant="danger" title="No pudimos cargar tu día">
          <p className={styles.errorText}>
            Revisa tu conexión e inténtalo otra vez; tus registros siguen a salvo.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className={styles.root}>
        {header}
        <Card className={styles.emptyCard} padding="lg">
          <EmptyState
            title="Sin hábitos activos"
            description={
              canRegister
                ? 'Crea un hábito para empezar a registrar tu progreso diario.'
                : 'No hay hábitos que mostrar en esta semana futura.'
            }
            action={canRegister ? newHabitButton : undefined}
          />
        </Card>
        <HabitFormModal mode="create" open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {header}

      <HabitMyDayMetrics entries={entries} />

      <div className={styles.filters}>
        <HabitCategoryFilter
          categories={categories}
          counts={categoryCounts}
          totalCount={entries.length}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        {newHabitButton}
      </div>

      {visibleEntries.length === 0 ? (
        <Card className={styles.emptyCard} padding="lg">
          <EmptyState
            title="Ningún hábito en esta categoría"
            description="Hoy no tienes hábitos de esta categoría."
            action={
              <Button variant="secondary" onClick={() => setCategoryFilter(null)}>
                Ver todos
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className={styles.rowsHeader} aria-hidden>
            <span>Hábito</span>
            <span className={styles.rowsHeaderDays}>
              {days.map((day, index) => (
                <span key={day.date} className={day.isToday ? styles.rowsHeaderToday : undefined}>
                  {WEEKDAY_INITIALS[index]} {day.dayNumber}
                </span>
              ))}
            </span>
            <span>Racha</span>
            <span />
            <span />
          </div>

          <ul className={styles.rows} aria-busy={isFollowUpsPending}>
            {visibleEntries.map((entry) => (
              <li key={entry.habit.id}>
                <HabitDayRow
                  entry={entry}
                  days={days}
                  focusDate={focusDate}
                  followUpByDate={followUpsByHabit.get(entry.habit.id) ?? EMPTY_FOLLOW_UP_MAP}
                  canRegister={canRegister}
                  onOpenRegister={(date, followUp) =>
                    setRegisterTarget({ habitId: entry.habit.id, date, followUp })
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <HabitFollowUpDrawer
        open={registerTarget !== null}
        onClose={() => setRegisterTarget(null)}
        habit={registerEntry?.habit ?? null}
        date={registerTarget?.date ?? focusDate}
        followUp={registerTarget?.followUp ?? null}
        lifelinesRemaining={registerEntry?.lifelinesRemaining ?? 0}
      />

      <HabitFormModal mode="create" open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
