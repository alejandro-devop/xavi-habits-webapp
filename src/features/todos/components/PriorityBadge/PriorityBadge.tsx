import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TodoPriority } from '@/features/todos/types/todo.types'
import styles from './PriorityBadge.module.scss'

const PRIORITIES: TodoPriority[] = ['urgent', 'high', 'medium', 'low']

const LABELS: Record<TodoPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

function PriorityIcon({ priority }: { priority: TodoPriority }) {
  switch (priority) {
    case 'low':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'medium':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'high':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 10V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'urgent':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 5v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6" cy="9" r="0.6" fill="currentColor" />
        </svg>
      )
  }
}

const DROPDOWN_WIDTH = 130
const DROPDOWN_ITEM_HEIGHT = 34
const DROPDOWN_HEIGHT = PRIORITIES.length * DROPDOWN_ITEM_HEIGHT + 8 // 8px padding
const SCREEN_MARGIN = 8

function calcDropdownStyle(rect: DOMRect): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Horizontal: align right edge of dropdown to right edge of button; flip if off-screen
  let left = rect.right - DROPDOWN_WIDTH
  if (left < SCREEN_MARGIN) left = rect.left
  if (left + DROPDOWN_WIDTH > vw - SCREEN_MARGIN) left = vw - DROPDOWN_WIDTH - SCREEN_MARGIN

  // Vertical: prefer below button; flip above if not enough space
  const spaceBelow = vh - rect.bottom - SCREEN_MARGIN
  const top = spaceBelow >= DROPDOWN_HEIGHT
    ? rect.bottom + 4
    : rect.top - DROPDOWN_HEIGHT - 4

  return { position: 'fixed', top, left, width: DROPDOWN_WIDTH }
}

type Props = {
  priority: TodoPriority
  selected?: boolean
  iconOnly?: boolean
  onClick?: () => void
  onChangePriority?: (priority: TodoPriority) => void
}

export function PriorityBadge({ priority, selected, iconOnly = false, onClick, onChangePriority }: Props) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    if (onChangePriority) {
      e.stopPropagation()
      if (!open && btnRef.current) {
        setDropdownStyle(calcDropdownStyle(btnRef.current.getBoundingClientRect()))
      }
      setOpen((v) => !v)
      return
    }
    onClick?.()
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={[
          styles.badge,
          styles[priority],
          selected ? styles.selected : '',
          iconOnly ? styles.iconOnly : styles.withLabel,
          onChangePriority ? styles.interactive : '',
        ].join(' ')}
        onClick={handleClick}
        aria-label={LABELS[priority]}
        title={onChangePriority ? `Prioridad: ${LABELS[priority]} — click para cambiar` : LABELS[priority]}
        aria-haspopup={onChangePriority ? 'listbox' : undefined}
        aria-expanded={onChangePriority ? open : undefined}
        aria-pressed={!onChangePriority ? selected : undefined}
      >
        <PriorityIcon priority={priority} />
        {!iconOnly && <span>{LABELS[priority]}</span>}
      </button>

      {open && onChangePriority && createPortal(
        <div
          className={styles.dropdown}
          style={dropdownStyle}
          role="listbox"
          aria-label="Cambiar prioridad"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              role="option"
              aria-selected={p === priority}
              className={[styles.dropdownItem, styles[p], p === priority ? styles.dropdownItemActive : ''].join(' ')}
              onClick={(e) => {
                e.stopPropagation()
                onChangePriority(p)
                setOpen(false)
              }}
            >
              <PriorityIcon priority={p} />
              <span>{LABELS[p]}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
