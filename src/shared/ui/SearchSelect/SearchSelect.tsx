import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import styles from './SearchSelect.module.scss'

export type SearchSelectOption = {
  label: string
  value: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

type SearchSelectProps = {
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  value?: string | null
  options: SearchSelectOption[]
  onChange: (value: string | null, option?: SearchSelectOption) => void
  error?: string
  helperText?: string
  disabled?: boolean
  clearable?: boolean
  emptyMessage?: string
}

type DropdownPos = { top: number; left: number; width: number }

export function SearchSelect({
  label,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  value = null,
  options,
  onChange,
  error,
  helperText,
  disabled = false,
  clearable = false,
  emptyMessage = 'Sin resultados',
}: SearchSelectProps) {
  const id = useId()
  const listboxId = `${id}-listbox`
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-hint` : undefined
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 })
  const prefersReducedMotion = useReducedMotionPreference()

  const selected = options.find((opt) => opt.value === value) ?? null

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => {
      const haystack = [opt.label, opt.value, opt.description ?? ''].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [options, searchQuery])

  const updatePos = useCallback(() => {
    // Always anchor to the search input when it's mounted (open state),
    // fall back to the trigger button otherwise.
    const anchor = searchRef.current ?? triggerRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vpHeight = window.visualViewport?.height ?? window.innerHeight
    const dropdownMaxH = 240
    const spaceBelow = vpHeight - rect.bottom
    const openUpward = spaceBelow < dropdownMaxH && rect.top > spaceBelow
    setDropdownPos({
      top: openUpward ? rect.top - dropdownMaxH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, []) // no deps — reads refs directly, always current

  const close = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(0)
  }, [])

  const open = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    setHighlightedIndex(0)
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [disabled])

  // Recalculate position once the search input is mounted and positioned
  useEffect(() => {
    if (isOpen) requestAnimationFrame(updatePos)
  }, [isOpen, updatePos])

  // Reposition on scroll / resize / virtual keyboard
  useEffect(() => {
    if (!isOpen) return
    const onViewportChange = () => requestAnimationFrame(updatePos)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('scroll', onViewportChange)
    return () => {
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('scroll', onViewportChange)
    }
  }, [isOpen, updatePos])

  // Click outside: close if outside both the root and the portal dropdown
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [isOpen, close])

  const selectOption = (opt: SearchSelectOption) => {
    if (opt.disabled) return
    onChange(opt.value, opt)
    close()
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filteredOptions[highlightedIndex]
      if (opt) selectOption(opt)
    }
  }

  const activeOptionId =
    filteredOptions[highlightedIndex] != null
      ? `${id}-option-${filteredOptions[highlightedIndex].value}`
      : undefined

  return (
    <div className={styles.field} ref={rootRef}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className={styles.control}>
        {/* Closed state: button trigger */}
        {!isOpen ? (
          <button
            ref={triggerRef}
            id={id}
            type="button"
            role="combobox"
            aria-expanded={false}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            disabled={disabled}
            className={[
              styles.trigger,
              error ? styles.triggerError : '',
              disabled ? styles.triggerDisabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={open}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={styles.triggerValue}>
              {selected ? (
                <>
                  {selected.icon ? <span className={styles.optionIcon}>{selected.icon}</span> : null}
                  <span>{selected.label}</span>
                </>
              ) : (
                <span className={styles.placeholder}>{placeholder}</span>
              )}
            </span>
            <span className={styles.chevron} aria-hidden>▾</span>
          </button>
        ) : (
          /* Open state: search input replaces the trigger, stays in document flow */
          <input
            ref={searchRef}
            id={id}
            type="search"
            role="combobox"
            aria-expanded={true}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-describedby={describedBy}
            className={[styles.trigger, styles.searchInput].filter(Boolean).join(' ')}
            placeholder={selected ? selected.label : searchPlaceholder}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(0) }}
            onKeyDown={handleSearchKeyDown}
            onBlur={(e) => {
              // Close only if focus moves outside both root and dropdown
              if (!dropdownRef.current?.contains(e.relatedTarget as Node)) close()
            }}
          />
        )}

        {clearable && value && !disabled && !isOpen ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="Limpiar selección"
            onClick={() => onChange(null)}
          >
            ×
          </button>
        ) : null}
      </div>

      {/* Portal: only the options list */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  ref={dropdownRef}
                  className={styles.dropdown}
                  style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                  }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={prefersReducedMotion ? reducedTransition : transitions.fast}
                >
                  <ul
                    id={listboxId}
                    role="listbox"
                    className={styles.list}
                    aria-label={label ?? 'Opciones'}
                  >
                    {filteredOptions.length === 0 ? (
                      <li className={styles.empty} role="presentation">{emptyMessage}</li>
                    ) : (
                      filteredOptions.map((opt, index) => (
                        <li
                          key={opt.value}
                          id={`${id}-option-${opt.value}`}
                          role="option"
                          aria-selected={value === opt.value}
                          aria-disabled={opt.disabled}
                          className={[
                            styles.option,
                            index === highlightedIndex ? styles.optionHighlighted : '',
                            value === opt.value ? styles.optionSelected : '',
                            opt.disabled ? styles.optionDisabled : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectOption(opt)}
                        >
                          {opt.icon ? <span className={styles.optionIcon}>{opt.icon}</span> : null}
                          <span className={styles.optionText}>
                            <span className={styles.optionLabel}>{opt.label}</span>
                            {opt.description ? (
                              <span className={styles.optionDescription}>{opt.description}</span>
                            ) : null}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      {helperText ? <p id={helperId} className={styles.helper}>{helperText}</p> : null}
      {error ? <p id={errorId} className={styles.error} role="alert">{error}</p> : null}
    </div>
  )
}
