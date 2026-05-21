import { createContext, useContext } from 'react'

type TabsContextValue = {
  value: string
  onChange: (value: string) => void
  baseId: string
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within Tabs')
  return ctx
}
