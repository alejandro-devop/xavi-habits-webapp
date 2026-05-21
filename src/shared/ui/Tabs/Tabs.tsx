import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { TabsContext, useTabsContext } from '@/shared/ui/Tabs/Tabs.context'
import styles from './Tabs.module.scss'

type TabsProps = {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}

function TabsRoot({ value, onChange, children, className }: TabsProps) {
  const baseId = useId()

  return (
    <TabsContext.Provider value={{ value, onChange, baseId }}>
      <div className={[styles.root, className].filter(Boolean).join(' ')}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children }: { children: ReactNode }) {
  const { value, onChange } = useTabsContext()
  const listRef = useRef<HTMLDivElement>(null)
  const tabs = Array.isArray(children) ? children : [children]

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabButtons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    if (!tabButtons?.length) return

    const values = Array.from(tabButtons).map((btn) => btn.dataset.value ?? '')
    const index = values.indexOf(value)

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = values[(index + 1) % values.length]
      if (next) onChange(next)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const next = values[(index - 1 + values.length) % values.length]
      if (next) onChange(next)
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      className={styles.list}
      onKeyDown={handleKeyDown}
    >
      {tabs}
    </div>
  )
}

function TabsTab({ value: tabValue, children }: { value: string; children: ReactNode }) {
  const { value, onChange, baseId } = useTabsContext()
  const isActive = value === tabValue

  return (
    <button
      type="button"
      role="tab"
      data-value={tabValue}
      id={`${baseId}-tab-${tabValue}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${tabValue}`}
      tabIndex={isActive ? 0 : -1}
      className={[styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')}
      onClick={() => onChange(tabValue)}
    >
      {children}
    </button>
  )
}

function TabsPanel({ value: panelValue, children }: { value: string; children: ReactNode }) {
  const { value, baseId } = useTabsContext()
  const isActive = value === panelValue

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${panelValue}`}
      aria-labelledby={`${baseId}-tab-${panelValue}`}
      hidden={!isActive}
      className={[styles.panel, !isActive ? styles.panelHidden : ''].filter(Boolean).join(' ')}
    >
      {isActive ? children : null}
    </div>
  )
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
})
