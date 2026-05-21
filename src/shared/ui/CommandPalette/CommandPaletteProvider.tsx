import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useHotkey } from '@/shared/hooks/useHotkey'
import { CommandPalette } from '@/shared/ui/CommandPalette/CommandPalette'
import type { CommandAction } from '@/shared/ui/CommandPalette/command-palette.types'

type CommandPaletteContextValue = {
  open: () => void
  close: () => void
  isOpen: boolean
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

type CommandPaletteProviderProps = {
  children: ReactNode
  actions: CommandAction[]
}

export function CommandPaletteProvider({ children, actions }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useHotkey('k', open, { metaOrCtrl: true })

  const ctx = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen])

  return (
    <CommandPaletteContext.Provider value={ctx}>
      {children}
      <CommandPalette open={isOpen} onClose={close} actions={actions} />
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  }
  return ctx
}
