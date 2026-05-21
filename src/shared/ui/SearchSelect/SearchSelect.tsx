import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
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
  const searchRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
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

  useClickOutside(rootRef, close, isOpen)

  const selectOption = (opt: SearchSelectOption) => {
    if (opt.disabled) return
    onChange(opt.value, opt)
    close()
    rootRef.current?.querySelector<HTMLButtonElement>('button[role="combobox"]')?.focus()
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) open()
      else if (event.key === 'ArrowDown') setHighlightedIndex(0)
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      close()
    }
  }

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
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
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-activedescendant={isOpen ? activeOptionId : undefined}
          disabled={disabled}
          className={[
            styles.trigger,
            error ? styles.triggerError : '',
            disabled ? styles.triggerDisabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => (isOpen ? close() : open())}
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
          <span className={styles.chevron} aria-hidden>
            ▾
          </span>
        </button>

        {clearable && value && !disabled ? (
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

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={prefersReducedMotion ? reducedTransition : transitions.fast}
            onKeyDown={handleListKeyDown}
          >
            <input
              ref={searchRef}
              type="search"
              className={styles.search}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              aria-label={searchPlaceholder}
            />
            <ul
              id={listboxId}
              role="listbox"
              className={styles.list}
              aria-label={label ?? 'Opciones'}
            >
              {filteredOptions.length === 0 ? (
                <li className={styles.empty} role="presentation">
                  {emptyMessage}
                </li>
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
      </AnimatePresence>

      {helperText ? (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
