import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type ExampleState = {
  count: number
  increment: () => void
  reset: () => void
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ count: 0 }),
    }),
    {
      name: 'xavi-habits-example',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ count: state.count }),
    },
  ),
)
