import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'
import { storage } from '@/shared/lib/storage'

export const ACTIVITY_TRACKING_STORAGE_KEY = 'xavi-activity-tracking-session'

export interface ActivityTrackingState {
  session: RunningActivitySession | null
  startSession: (session: RunningActivitySession) => void
  updateSessionNotes: (notes: string) => void
  clearSession: () => void
}

export const useActivityTrackingStore = create<ActivityTrackingState>()(
  persist(
    (set) => ({
      session: null,

      startSession: (session) => set({ session }),

      updateSessionNotes: (notes) =>
        set((state) =>
          state.session
            ? { session: { ...state.session, notes: notes.trim() || null } }
            : state,
        ),

      clearSession: () => set({ session: null }),
    }),
    {
      name: ACTIVITY_TRACKING_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      partialize: (state) => ({ session: state.session }),
    },
  ),
)

export const selectRunningSession = (state: ActivityTrackingState) => state.session
