import { useMemo } from 'react'
import { useHabitFollowUpsInDatesQuery } from '@/features/habits/hooks/useHabits'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { getHabitDailyGoal } from '@/features/habits/utils/habit-progress.utils'
import { buildFollowUpsByHabit } from '@/features/habits/utils/habit-stats.utils'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import {
  buildAverageDifficulty,
  buildDayEntries,
  buildDifficultySeries,
  buildGoalSeries,
  buildRangeSummary,
  buildStreakEpisodes,
  buildWeekdayBreakdown,
  buildWeeklyCompliance,
  composeReading,
  countComebacks,
  formatShortDate,
  getWorstWeekday,
  hasAnyDifficulty,
  resolvePreviousWindow,
  resolveRangeWindow,
  shouldShowGoalChart,
  HABIT_PANEL_RANGES,
  HABIT_PANEL_RANGE_LABELS,
  HABIT_PANEL_RANGE_LONG_LABELS,
  MIN_DAYS_FOR_TREND,
  type HabitPanelRange,
} from '@/features/habits/utils/habit-panel.utils'
import { Inline } from '@/shared/layout/Inline'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { HabitDifficultyChart } from './HabitDifficultyChart'
import { HabitGoalChart } from './HabitGoalChart'
import { HabitStreakEpisodesChart } from './HabitStreakEpisodesChart'
import { HabitWeekdayChart } from './HabitWeekdayChart'
import { HabitWeeklyComplianceChart } from './HabitWeeklyComplianceChart'
import { HabitPanelTiles } from './HabitPanelTiles'
import styles from './HabitPanel.module.scss'

type Props = {
  habit: Habit
  range: HabitPanelRange
  onRangeChange: (range: HabitPanelRange) => void
}

function followUpsFor(
  groups: Parameters<typeof buildFollowUpsByHabit>[0],
  habitId: string,
): Map<string, HabitFollowUp> {
  return buildFollowUpsByHabit(groups).get(habitId) ?? new Map()
}

function measureUnit(habit: Habit): string {
  if (habit.habitType === 'time') return 'min'
  return habit.measure?.abbreviation ?? habit.measure?.name ?? 'veces'
}

/**
 * El panel del hábito: cómo va, no solo dónde está. No escribe nada —ni una
 * mutation— y no habla de propósito ni de identidad: es un panel de números.
 */
export function HabitPanel({ habit, range, onRangeChange }: Props) {
  const today = getTodayString()

  const window = useMemo(
    () => resolveRangeWindow(range, habit.startDate, today, habit.endDate),
    [range, habit.startDate, habit.endDate, today],
  )
  const previousWindow = useMemo(
    () => resolvePreviousWindow(window, range, habit.startDate),
    [window, range, habit.startDate],
  )

  const currentQuery = useHabitFollowUpsInDatesQuery(window.from, window.to)
  // Segunda consulta con el mismo hook y otras fechas: no una consulta doble de
  // larga que luego haya que partir.
  const previousQuery = useHabitFollowUpsInDatesQuery(
    previousWindow?.from ?? window.from,
    previousWindow?.to ?? window.to,
    { enabled: previousWindow !== null },
  )

  const days = useMemo(
    () => buildDayEntries(habit, window, followUpsFor(currentQuery.data, habit.id)),
    [habit, window, currentQuery.data],
  )
  const previousDays = useMemo(
    () =>
      previousWindow
        ? buildDayEntries(habit, previousWindow, followUpsFor(previousQuery.data, habit.id))
        : [],
    [habit, previousWindow, previousQuery.data],
  )

  const summary = useMemo(() => buildRangeSummary(days), [days])
  const previousSummary = useMemo(
    () => (previousWindow && previousQuery.data ? buildRangeSummary(previousDays) : null),
    [previousWindow, previousQuery.data, previousDays],
  )
  const weekly = useMemo(() => buildWeeklyCompliance(days), [days])
  const weekdays = useMemo(() => buildWeekdayBreakdown(days), [days])
  const worstWeekday = useMemo(() => getWorstWeekday(weekdays), [weekdays])
  const episodes = useMemo(() => buildStreakEpisodes(days), [days])
  const comebacks = useMemo(() => countComebacks(days), [days])
  const difficulty = useMemo(() => buildDifficultySeries(days), [days])
  const avgDifficulty = useMemo(() => buildAverageDifficulty(days), [days])
  const goalPoints = useMemo(
    () => (shouldShowGoalChart(habit) ? buildGoalSeries(days, habit) : []),
    [days, habit],
  )

  // Sin dos semanas de vida no hay tendencia ni con qué comparar.
  const showTrend = window.days >= MIN_DAYS_FOR_TREND && weekly.length >= 2
  const reading = showTrend ? composeReading(summary, previousSummary, worstWeekday) : null

  const rangeSelector = (
    <div className={styles.toolbar}>
      <Inline gap="xs" wrap role="group" aria-label="Rango del panel">
        {HABIT_PANEL_RANGES.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === range ? 'primary' : 'ghost'}
            aria-pressed={option === range}
            onClick={() => onRangeChange(option)}
          >
            {HABIT_PANEL_RANGE_LABELS[option]}
          </Button>
        ))}
      </Inline>
      <p className={styles.toolbarHint}>
        Del {formatShortDate(window.from)} al {formatShortDate(window.to)}
      </p>
    </div>
  )

  if (!habit.startDate) {
    return (
      <div className={styles.root}>
        <EmptyState
          title="Este hábito no tiene fecha de inicio"
          description="Sin fecha de inicio no se puede medir un rango. Edítalo para ponerle una."
        />
      </div>
    )
  }

  if (currentQuery.isLoading) {
    return (
      <div className={styles.root}>
        {rangeSelector}
        <div className={styles.center}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (currentQuery.isError) {
    return (
      <div className={styles.root}>
        {rangeSelector}
        <Alert variant="danger" title="No se pudieron cargar los datos del panel.">
          Vuelve a intentarlo dentro de un momento.
        </Alert>
      </div>
    )
  }

  const hasRecords = days.some((day) => day.followUp !== null)

  if (!hasRecords) {
    return (
      <div className={styles.root}>
        {rangeSelector}
        <EmptyState
          title="Todavía no hay nada que medir aquí"
          description={`No hay ningún registro entre el ${formatShortDate(window.from)} y el ${formatShortDate(window.to)}. Prueba con otro rango o marca algún día.`}
        />
      </div>
    )
  }

  const rangeLabel = HABIT_PANEL_RANGE_LONG_LABELS[range]
  // «Cómo se te hizo» no aparece si no hay ninguna dificultad registrada.
  const showDifficulty = hasAnyDifficulty(days) && difficulty.length > 0

  return (
    <div className={styles.root}>
      {rangeSelector}

      {reading ? (
        <div className={styles.reading}>
          <p className={styles.readingText}>{reading}</p>
        </div>
      ) : null}

      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previousSummary}
        comebacks={comebacks}
        rangeLabel={range === 365 ? 'del año' : HABIT_PANEL_RANGE_LABELS[range]}
        rangeScopeLabel={range === 365 ? 'el último año' : `los últimos ${rangeLabel}`}
        avgDifficulty={avgDifficulty}
      />

      <div className={styles.charts}>
        {showTrend ? (
          <HabitWeeklyComplianceChart points={weekly} rangeLabel={rangeLabel} />
        ) : null}
        <HabitWeekdayChart stats={weekdays} worst={worstWeekday} rangeLabel={rangeLabel} />
      </div>

      {episodes.length > 0 || showDifficulty ? (
        <div className={styles.chartsEven}>
          {episodes.length > 0 ? (
            <HabitStreakEpisodesChart
              episodes={episodes}
              lifetimeRecordDays={habit.maxStreak}
              recordIsOngoing={habit.maxStreak > 0 && habit.streak === habit.maxStreak}
            />
          ) : null}
          {showDifficulty ? <HabitDifficultyChart points={difficulty} /> : null}
        </div>
      ) : null}

      {goalPoints.length > 0 ? (
        <HabitGoalChart
          points={goalPoints}
          goal={getHabitDailyGoal(habit)}
          unit={measureUnit(habit)}
          formatDate={formatShortDate}
        />
      ) : null}
    </div>
  )
}
