import { useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import type { CommandAction } from '@/shared/ui/CommandPalette/command-palette.types'
import styles from './CommandPalette.module.scss'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  actions: CommandAction[]
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter((action) => {
      const haystack = [action.label, action.id, ...(action.keywords ?? [])].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [actions, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setHighlightedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  const runAction = (action: CommandAction) => {
    action.onSelect()
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const action = filtered[highlightedIndex]
      if (action) runAction(action)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Paleta de comandos"
      description="Busca una acción o usa las flechas y Enter."
      size="md"
    >
      <div onKeyDown={handleKeyDown}>
        <Input
          type="search"
          placeholder="Buscar acción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar comando"
          autoFocus
        />
        <ul ref={listRef} className={styles.list} role="listbox" aria-label="Acciones">
          {filtered.length === 0 ? (
            <li className={styles.empty} role="presentation">
              Sin resultados
            </li>
          ) : (
            filtered.map((action, index) => (
              <li key={action.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={[
                    styles.item,
                    index === highlightedIndex ? styles.itemHighlighted : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => runAction(action)}
                >
                  {action.icon ? <AppIcon name={action.icon} size="sm" /> : null}
                  <span>{action.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className={styles.hint}>
          <kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>Enter</kbd> ejecutar · <kbd>Esc</kbd> cerrar
        </p>
      </div>
    </Modal>
  )
}
