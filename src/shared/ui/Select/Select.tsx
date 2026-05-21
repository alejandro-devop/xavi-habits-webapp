import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.scss'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string | null
  helperText?: string
  onChange?: (value: string) => void
}

export function Select({
  id,
  label,
  options,
  placeholder,
  error,
  helperText,
  value,
  disabled,
  className,
  onChange,
  ...props
}: SelectProps) {
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-hint` : undefined
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className={styles.wrapper}>
        <select
          id={id}
          className={[styles.select, error ? styles.errorSelect : '', className].filter(Boolean).join(' ')}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </div>
      {helperText ? (
        <span id={helperId} className={styles.helper}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
