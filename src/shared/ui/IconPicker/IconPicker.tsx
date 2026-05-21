import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  APP_ICON_CATEGORY_ORDER,
  appIcons,
  filterAppIcons,
  getCategoryLabel,
  groupIconsByCategory,
  normalizeIconName,
} from '@/shared/icons'
import type { AppIconEntry } from '@/shared/icons'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import styles from './IconPicker.module.scss'

type IconPickerProps = {
  label?: string
  value?: string | null
  onChange: (iconName: string | null) => void
  placeholder?: string
  error?: string
  helperText?: string
  disabled?: boolean
  clearable?: boolean
}

function IconGridCells({
  icons,
  storedName,
  focusedName,
  onFocusCell,
  onSelect,
}: {
  icons: AppIconEntry[]
  storedName: string | null
  focusedName: string | null
  onFocusCell: (name: string) => void
  onSelect: (name: string) => void
}) {
  return (
    <>
      {icons.map((entry) => (
        <button
          key={entry.name}
          type="button"
          role="option"
          data-icon={entry.name}
          aria-selected={storedName === entry.name}
          aria-label={entry.label}
          title={entry.label}
          tabIndex={focusedName === entry.name ? 0 : -1}
          className={[
            styles.iconCell,
            storedName === entry.name ? styles.iconCellSelected : '',
            focusedName === entry.name ? styles.iconCellFocused : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onFocus={() => onFocusCell(entry.name)}
          onClick={() => onSelect(entry.name)}
        >
          <AppIcon name={entry.name} size="lg" />
        </button>
      ))}
    </>
  )
}

export function IconPicker({
  label,
  value = null,
  onChange,
  placeholder = 'Elegir icono…',
  error,
  helperText,
  disabled = false,
  clearable = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [focusedName, setFocusedName] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const storedName = value ? normalizeIconName(value) : null
  const selectedEntry = appIcons.find((entry) => entry.name === storedName)

  const filtered = useMemo(
    () => filterAppIcons(appIcons, search, { pickerOnly: true }),
    [search],
  )

  const grouped = useMemo(
    () => groupIconsByCategory(filtered, APP_ICON_CATEGORY_ORDER),
    [filtered],
  )

  const isSearching = search.trim().length > 0

  const flatFiltered = useMemo(
    () => (isSearching ? filtered : grouped.flatMap((group) => group.icons)),
    [filtered, grouped, isSearching],
  )

  useEffect(() => {
    if (!open) return
    const first = flatFiltered[0]?.name ?? null
    setFocusedName(first)
  }, [open, search, flatFiltered])

  const handleSelect = useCallback(
    (name: string) => {
      onChange(normalizeIconName(name))
      setOpen(false)
      setSearch('')
      setFocusedName(null)
    },
    [onChange],
  )

  const focusIcon = useCallback((name: string) => {
    setFocusedName(name)
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-icon="${name}"]`)
      ?.focus()
  }, [])

  const moveFocus = useCallback(
    (direction: 'next' | 'prev' | 'up' | 'down') => {
      if (!flatFiltered.length) return

      const currentIndex = focusedName
        ? flatFiltered.findIndex((e) => e.name === focusedName)
        : 0
      const start = currentIndex >= 0 ? currentIndex : 0
      const cols = Math.max(1, Math.floor((gridRef.current?.clientWidth ?? 288) / 48))

      let nextIndex = start
      if (direction === 'next') nextIndex = (start + 1) % flatFiltered.length
      if (direction === 'prev') nextIndex = (start - 1 + flatFiltered.length) % flatFiltered.length
      if (direction === 'down') nextIndex = Math.min(start + cols, flatFiltered.length - 1)
      if (direction === 'up') nextIndex = Math.max(start - cols, 0)

      const entry = flatFiltered[nextIndex]
      if (entry) focusIcon(entry.name)
    },
    [flatFiltered, focusedName, focusIcon],
  )

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveFocus('next')
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus('prev')
        break
      case 'ArrowDown':
        event.preventDefault()
        moveFocus('down')
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocus('up')
        break
      case 'Enter':
      case ' ':
        if (focusedName) {
          event.preventDefault()
          handleSelect(focusedName)
        }
        break
      default:
        break
    }
  }

  const errorId = error ? 'icon-picker-error' : undefined
  const helperId = helperText ? 'icon-picker-hint' : undefined
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}

      <div className={styles.control}>
        <button
          type="button"
          className={[
            styles.trigger,
            error ? styles.triggerError : '',
            disabled ? styles.triggerDisabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onClick={() => !disabled && setOpen(true)}
        >
          {selectedEntry ? (
            <>
              <span className={styles.triggerIcon}>
                <AppIcon name={selectedEntry.name} size="md" />
              </span>
              <span className={styles.triggerText}>
                <span className={styles.triggerLabel}>{selectedEntry.label}</span>
                <span className={styles.triggerValue}>{selectedEntry.name}</span>
              </span>
            </>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </button>

        {clearable && value && !disabled ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="Quitar icono"
            onClick={() => onChange(null)}
          >
            ×
          </button>
        ) : null}
      </div>

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

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setSearch('')
          setFocusedName(null)
        }}
        title="Elegir icono"
        description="Busca por nombre, categoría o palabra clave. El valor guardado es solo el nombre (ej. bell)."
        size="lg"
      >
        <Input
          type="search"
          placeholder="Buscar icono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar icono"
        />

        {selectedEntry ? (
          <div className={styles.preview} aria-live="polite">
            <span className={styles.previewIcon}>
              <AppIcon name={selectedEntry.name} size="xl" />
            </span>
            <span className={styles.previewMeta}>
              <span className={styles.previewLabel}>{selectedEntry.label}</span>
              <span className={styles.previewName}>{selectedEntry.name}</span>
              <span className={styles.previewCategory}>
                {getCategoryLabel(selectedEntry.category)}
              </span>
            </span>
          </div>
        ) : null}

        <div
          ref={gridRef}
          className={styles.gridWrap}
          onKeyDown={handleGridKeyDown}
        >
          {isSearching ? (
            <div className={styles.iconGrid} role="listbox" aria-label="Iconos disponibles">
              <IconGridCells
                icons={flatFiltered}
                storedName={storedName}
                focusedName={focusedName}
                onFocusCell={setFocusedName}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            grouped.map((group) => (
              <section
                key={group.category}
                className={styles.categorySection}
                aria-labelledby={`icon-cat-${group.category}`}
              >
                <h3 id={`icon-cat-${group.category}`} className={styles.categoryTitle}>
                  {group.label}
                </h3>
                <div className={styles.iconGrid} role="listbox" aria-label={group.label}>
                  <IconGridCells
                    icons={group.icons}
                    storedName={storedName}
                    focusedName={focusedName}
                    onFocusCell={setFocusedName}
                    onSelect={handleSelect}
                  />
                </div>
              </section>
            ))
          )}
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>Sin iconos para esta búsqueda.</p>
        ) : null}

        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
