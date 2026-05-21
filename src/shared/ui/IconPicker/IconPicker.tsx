import { useMemo, useState } from 'react'
import { appIcons, normalizeIconName } from '@/shared/icons'
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

  const storedName = value ? normalizeIconName(value) : null
  const selectedEntry = appIcons.find((entry) => entry.name === storedName)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return appIcons
    return appIcons.filter((entry) => {
      const haystack = [entry.name, entry.label, ...entry.keywords].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [search])

  const handleSelect = (name: string) => {
    onChange(normalizeIconName(name))
    setOpen(false)
    setSearch('')
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
              <span className={styles.triggerValue}>{selectedEntry.name}</span>
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
        }}
        title="Elegir icono"
        description="Busca por nombre o palabra clave. El valor guardado es solo el nombre (ej. bell)."
        size="lg"
      >
        <Input
          type="search"
          placeholder="Buscar icono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar icono"
        />
        <div className={styles.gridWrap}>
          <div className={styles.iconGrid} role="listbox" aria-label="Iconos disponibles">
            {filtered.map((entry) => (
              <button
                key={entry.name}
                type="button"
                role="option"
                aria-selected={storedName === entry.name}
                aria-label={entry.label}
                title={entry.label}
                className={[
                  styles.iconCell,
                  storedName === entry.name ? styles.iconCellSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelect(entry.name)}
              >
                <AppIcon name={entry.name} size="lg" />
              </button>
            ))}
          </div>
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
