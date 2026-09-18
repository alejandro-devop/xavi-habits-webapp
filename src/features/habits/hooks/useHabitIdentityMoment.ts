import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHabitFollowUpsInDatesQuery } from '@/features/habits/hooks/useHabits'
import { useHabitIdentityClaim } from '@/features/habits/hooks/useHabitIdentityClaim'
import {
  getDismissedSuggestionIds,
  useHabitIdentityStore,
} from '@/features/habits/store/habit-identity.store'
import type { Habit, HabitMyDayEntry } from '@/features/habits/types/habit.types'
import {
  detectHabitMilestone,
  RETURN_GAP_DAYS,
  selectIdentityMoment,
  type HabitIdentityCandidate,
  type HabitMilestoneKind,
} from '@/features/habits/utils/habit-identity.utils'
import { addDaysToString } from '@/features/habits/utils/habit-type.utils'

interface SavedIdentity {
  habit: Habit
  milestone: HabitMilestoneKind
  name: string
  icon: string | null
}

export interface HabitIdentityMomentState {
  /** El único hito visible, o `null`. */
  moment: HabitIdentityCandidate | null
  /** Rellena cuando acabamos de guardar: la tarjeta se sustituye por el acuse. */
  saved: SavedIdentity | null
  isSaving: boolean
  dismissedSuggestionIds: string[]
  choose: (choice: { name: string; icon: string | null }) => void
  dismiss: () => void
}

/**
 * Decide si hoy hay un hito que enseñar, y cuál.
 *
 * Las reglas de silencio están en `habit-identity.utils`; aquí solo se juntan
 * los datos que ya tenemos con lo que el usuario ya dijo que no.
 */
export function useHabitIdentityMoment(
  entries: HabitMyDayEntry[],
  focusDate: string,
  today: string,
): HabitIdentityMomentState {
  const snoozedUntil = useHabitIdentityStore((state) => state.snoozedUntil)
  const lastShown = useHabitIdentityStore((state) => state.lastShown)
  const dismissedSuggestions = useHabitIdentityStore((state) => state.dismissedSuggestions)
  const snoozeHabit = useHabitIdentityStore((state) => state.snoozeHabit)
  const markMomentShown = useHabitIdentityStore((state) => state.markMomentShown)

  const claim = useHabitIdentityClaim()
  const [saved, setSaved] = useState<SavedIdentity | null>(null)

  // Solo se celebra el día de hoy: un hito en una semana pasada es ruido.
  const isToday = focusDate === today

  // Para distinguir un regreso hace falta ver los siete días anteriores. Es el
  // mismo hook que ya usa la tira de la semana, con otra ventana.
  const windowStart = addDaysToString(today, -RETURN_GAP_DAYS)
  const { data: previousGroups } = useHabitFollowUpsInDatesQuery(windowStart, today)

  const previousAccomplishedByHabit = useMemo(() => {
    const byHabit = new Map<string, string[]>()
    for (const group of previousGroups ?? []) {
      for (const followUp of group.followUps) {
        if (!followUp.isAccomplished || followUp.isLifeline) continue
        const list = byHabit.get(followUp.habitId) ?? []
        list.push(followUp.date)
        byHabit.set(followUp.habitId, list)
      }
    }
    return byHabit
  }, [previousGroups])

  const candidates = useMemo<HabitIdentityCandidate[]>(() => {
    if (!isToday) return []

    const found: HabitIdentityCandidate[] = []
    for (const entry of entries) {
      const habit: Habit = entry.habit
      // Con propósito ya asignado no se pregunta nada.
      if (habit.purposeId != null) continue

      const accomplishedToday =
        entry.followUp?.isAccomplished === true && entry.followUp.isLifeline !== true
      if (!accomplishedToday) continue

      const milestone = detectHabitMilestone({
        habit,
        date: today,
        accomplishedToday,
        previousAccomplishedDates: previousAccomplishedByHabit.get(habit.id) ?? [],
        previousWindowStart: windowStart,
      })
      if (milestone) found.push({ habit, milestone })
    }
    return found
  }, [entries, isToday, previousAccomplishedByHabit, today, windowStart])

  const moment = useMemo(
    () => selectIdentityMoment(candidates, { snoozedUntil, lastShown }, today),
    [candidates, snoozedUntil, lastShown, today],
  )

  // Se anota cuando llega a verse, no cuando se calcula: así la regla de «uno
  // por semana» cuenta hitos enseñados, no hitos posibles.
  useEffect(() => {
    if (moment) markMomentShown(moment.habit.id, today)
  }, [moment, markMomentShown, today])

  const choose = useCallback(
    (choice: { name: string; icon: string | null }) => {
      if (!moment) return
      claim.mutate(
        {
          habit: moment.habit,
          milestone: moment.milestone,
          name: choice.name,
          icon: choice.icon,
          today,
        },
        {
          onSuccess: () =>
            setSaved({
              habit: moment.habit,
              milestone: moment.milestone,
              name: choice.name,
              icon: choice.icon,
            }),
        },
      )
    },
    [claim, moment, today],
  )

  const dismiss = useCallback(() => {
    if (!moment) return
    snoozeHabit(moment.habit.id, today)
  }, [moment, snoozeHabit, today])

  const dismissedSuggestionIds = useMemo(
    () => (moment ? getDismissedSuggestionIds(dismissedSuggestions, moment.habit.id) : []),
    [dismissedSuggestions, moment],
  )

  return {
    moment,
    saved,
    isSaving: claim.isPending,
    dismissedSuggestionIds,
    choose,
    dismiss,
  }
}
