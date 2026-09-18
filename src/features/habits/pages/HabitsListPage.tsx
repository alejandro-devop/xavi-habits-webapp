import { useMemo, useState } from 'react'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { HabitListCard } from '@/features/habits/components/HabitListCard'
import { HabitListTable } from '@/features/habits/components/HabitListTable'
import {
  HabitsListToolbar,
  type HabitsListView,
} from '@/features/habits/components/HabitsListToolbar'
import { useHabitPurposesQuery } from '@/features/habits/hooks/useHabitPurposes'
import {
  useHabitCategoriesQuery,
  useHabitFollowUpsInDatesQuery,
  useHabitsQuery,
} from '@/features/habits/hooks/useHabits'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { Habit, HabitCategory, HabitFollowUp } from '@/features/habits/types/habit.types'
import {
  countHabitsByCategory,
  countHabitsByPurpose,
  filterHabits,
  hasActiveHabitFilters,
  sortHabits,
  type HabitSortKey,
} from '@/features/habits/utils/habit-list.utils'
import { buildFollowUpsByHabit } from '@/features/habits/utils/habit-stats.utils'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import { getRecentDays, getVisibleDays } from '@/features/habits/utils/habit-week.utils'
import { storage } from '@/shared/lib/storage'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitsListPage.module.scss'

/**
 * La tira siempre se pide igual —14 días—, se pinte en el ancho que se pinte.
 * En móvil se recorta **al pintar** a los 7 últimos: cambiar de tamaño no
 * cambia ningún dato, y desde luego no cambia la racha.
 */
const DAY_WINDOW = 14
const COMPACT_DAY_WINDOW = 7
const COMPACT_QUERY = '(max-width: 767px)'
const VIEW_STORAGE_KEY = 'xavi:habits:list-view'

const EMPTY_FOLLOW_UP_MAP = new Map<string, HabitFollowUp>()

/** `storage` ya envuelve `localStorage` en try/catch: en privado devuelve null. */
function readStoredView(): HabitsListView {
  return storage.getItem(VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards'
}

export function HabitsListPage() {
  const today = getTodayString()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<HabitSortKey>('streak')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [purposeId, setPurposeId] = useState<string | null>(null)
  const [view, setView] = useState<HabitsListView>(readStoredView)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const isCompact = useMediaQuery(COMPACT_QUERY)

  const { data, isLoading, isError, refetch } = useHabitsQuery({ status: 'active' })
  const { data: categories = [] } = useHabitCategoriesQuery()
  const { data: purposes = [] } = useHabitPurposesQuery()

  const days = useMemo(() => getRecentDays(DAY_WINDOW, today, today), [today])
  const { data: followUpGroups, isPending: isFollowUpsPending } = useHabitFollowUpsInDatesQuery(
    days[0]?.date ?? today,
    today,
  )
  const followUpsByHabit = useMemo(() => buildFollowUpsByHabit(followUpGroups), [followUpGroups])
  const visibleDays = useMemo(
    () => getVisibleDays(days, isCompact ? COMPACT_DAY_WINDOW : DAY_WINDOW),
    [days, isCompact],
  )

  const habits = useMemo(() => data?.habits ?? [], [data])

  // Un mapa por id y ni una consulta por tarjeta.
  const categoriesById = useMemo(
    () => new Map<string, HabitCategory>(categories.map((category) => [category.id, category])),
    [categories],
  )
  const purposesById = useMemo(
    () => new Map<string, HabitPurpose>(purposes.map((purpose) => [purpose.id, purpose])),
    [purposes],
  )

  const filters = useMemo(
    () => ({ search, categoryId, purposeId }),
    [search, categoryId, purposeId],
  )
  const visibleHabits = useMemo(
    () => sortHabits(filterHabits(habits, filters), sort),
    [habits, filters, sort],
  )
  const categoryCounts = useMemo(() => countHabitsByCategory(habits), [habits])
  const purposeCounts = useMemo(() => countHabitsByPurpose(habits), [habits])
  const categoriesInUse = categoryCounts.size

  function handleEdit(habit: Habit) {
    setEditingHabit(habit)
    setModalOpen(true)
  }

  function handleCreate() {
    setEditingHabit(null)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingHabit(null)
  }

  function handleViewChange(next: HabitsListView) {
    setView(next)
    storage.setItem(VIEW_STORAGE_KEY, next)
  }

  function clearFilters() {
    setSearch('')
    setCategoryId(null)
    setPurposeId(null)
  }

  const newHabitButton = (
    <Button
      className={styles.cta}
      onClick={handleCreate}
      leftIcon={<AppIcon name="plus" size="xs" decorative />}
    >
      <span className={styles.ctaLabel}>Nuevo hábito</span>
    </Button>
  )

  const header = (
    <header className={styles.head}>
      <div className={styles.headText}>
        <p className={styles.eyebrow}>
          {habits.length} {habits.length === 1 ? 'activo' : 'activos'}
          {categoriesInUse > 0
            ? ` · ${categoriesInUse} ${categoriesInUse === 1 ? 'categoría' : 'categorías'}`
            : ''}
        </p>
        <h1 className={styles.title}>Mis hábitos</h1>
      </div>
    </header>
  )

  if (isLoading) {
    return (
      <div className={styles.root}>
        {header}
        <div className={styles.grid} aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonTop}>
                <Skeleton width={44} height={44} radius="0.9375rem" />
                <div className={styles.skeletonText}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="85%" height={10} />
                </div>
              </div>
              <Skeleton width="70%" height={20} radius="var(--radius-full)" />
              <Skeleton width="100%" height={22} radius="5px" />
              <Skeleton width="100%" height={6} radius="var(--radius-full)" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.root}>
        {header}
        <Alert variant="danger" title="No pudimos cargar tus hábitos">
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

  if (habits.length === 0) {
    return (
      <div className={styles.root}>
        {header}
        <Card className={styles.emptyCard} padding="lg">
          <EmptyState
            title="Sin hábitos activos"
            description="Crea tu primer hábito para empezar a construir rutinas."
            action={newHabitButton}
          />
        </Card>
        <HabitFormModal mode="create" open={modalOpen} onClose={handleCloseModal} />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {header}

      <HabitsListToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        categories={categories}
        categoryCounts={categoryCounts}
        totalCount={habits.length}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        purposes={purposes}
        purposeCounts={purposeCounts}
        purposeId={purposeId}
        onPurposeChange={setPurposeId}
        view={view}
        onViewChange={handleViewChange}
        isCompact={isCompact}
        action={newHabitButton}
      />

      {visibleHabits.length === 0 ? (
        <Card className={styles.emptyCard} padding="lg">
          <EmptyState
            title="Ningún hábito con estos filtros"
            description="Prueba con otra búsqueda, otra categoría u otro propósito."
            action={
              hasActiveHabitFilters(filters) ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : view === 'table' ? (
        <HabitListTable habits={visibleHabits} sort={sort} onSortChange={setSort} />
      ) : (
        <div className={styles.grid} aria-busy={isFollowUpsPending}>
          {visibleHabits.map((habit) => (
            <HabitListCard
              key={habit.id}
              habit={habit}
              category={habit.categoryId ? categoriesById.get(habit.categoryId) : null}
              purpose={habit.purposeId ? purposesById.get(habit.purposeId) : null}
              days={visibleDays}
              followUpByDate={followUpsByHabit.get(habit.id) ?? EMPTY_FOLLOW_UP_MAP}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {editingHabit ? (
        <HabitFormModal
          mode="edit"
          habit={editingHabit}
          open={modalOpen}
          onClose={handleCloseModal}
        />
      ) : (
        <HabitFormModal mode="create" open={modalOpen} onClose={handleCloseModal} />
      )}
    </div>
  )
}
