import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './FormField.module.scss'

type FormFieldProps = {
  id: string
  label: string
  error?: string | null
  hint?: string
  children?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>

export function FormField({
  id,
  label,
  error,
  hint,
  children,
  className,
  ...inputProps
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children ?? (
        <input
          id={id}
          className={[styles.input, className].filter(Boolean).join(' ')}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...inputProps}
        />
      )}
      {hint ? (
        <span id={hintId} className={styles.hint}>
          {hint}
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
