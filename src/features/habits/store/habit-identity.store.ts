import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getSnoozeUntil } from '@/features/habits/utils/habit-identity.utils'
import { storage } from '@/shared/lib/storage'

/**
 * Lo que el usuario ha dicho que **no**.
 *
 * Vive en `localStorage` a propósito: son datos de piloto —silencios y
 * descartes— y la alternativa era pedirle al backend un campo por algo que
 * quizá se tire. **Limitación aceptada: no viaja entre dispositivos.**
 */

export const HABIT_IDENTITY_STORAGE_KEY = 'xavi.habits.identity'

export interface HabitIdentityState {
  /** `habitId` → fecha (`YYYY-MM-DD`) a partir de la cual vuelve a preguntar. */
  snoozedUntil: Record<string, string>
  /** Último hito enseñado, para la regla de «como mucho uno por semana». */
  lastShown: { habitId: string; date: string } | null
  /** `habitId:suggestionId` que ya recibieron un «no me suena». */
  dismissedSuggestions: string[]

  /** «Ahora no»: catorce días de silencio para ese hábito. */
  snoozeHabit: (habitId: string, today: string) => void
  /** Se llama cuando el hito llega a verse, no cuando se calcula. */
  markMomentShown: (habitId: string, today: string) => void
  /** «No me suena»: ese rasgo concreto no se vuelve a proponer. */
  dismissSuggestion: (habitId: string, suggestionId: string) => void
}

function suggestionKey(habitId: string, suggestionId: string): string {
  return `${habitId}:${suggestionId}`
}

export const useHabitIdentityStore = create<HabitIdentityState>()(
  persist(
    (set) => ({
      snoozedUntil: {},
      lastShown: null,
      dismissedSuggestions: [],

      snoozeHabit: (habitId, today) =>
        set((state) => ({
          snoozedUntil: { ...state.snoozedUntil, [habitId]: getSnoozeUntil(today) },
        })),

      markMomentShown: (habitId, today) =>
        set((state) => {
          if (state.lastShown?.habitId === habitId && state.lastShown.date === today) {
            return state
          }
          return { lastShown: { habitId, date: today } }
        }),

      dismissSuggestion: (habitId, suggestionId) =>
        set((state) => {
          const key = suggestionKey(habitId, suggestionId)
          if (state.dismissedSuggestions.includes(key)) return state
          return { dismissedSuggestions: [...state.dismissedSuggestions, key] }
        }),
    }),
    {
      name: HABIT_IDENTITY_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      partialize: (state) => ({
        snoozedUntil: state.snoozedUntil,
        lastShown: state.lastShown,
        dismissedSuggestions: state.dismissedSuggestions,
      }),
    },
  ),
)

/** Ids descartados para un hábito, ya sin el prefijo. */
export function getDismissedSuggestionIds(
  dismissed: string[],
  habitId: string,
): string[] {
  const prefix = `${habitId}:`
  return dismissed
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => entry.slice(prefix.length))
}
