import type { InputHTMLAttributes, ReactNode } from 'react'
import { Input } from '@/shared/ui/Input/Input'
import styles from './FormField.module.scss'

type FormFieldProps = {
  id: string
  label: string
  error?: string | null
  helperText?: string
  /** @deprecated Use helperText */
  hint?: string
  children?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>

export function FormField({
  id,
  label,
  error,
  helperText,
  hint,
  children,
  className,
  ...inputProps
}: FormFieldProps) {
  const resolvedHelper = helperText ?? hint
  const errorId = error ? `${id}-error` : undefined
  const helperId = resolvedHelper ? `${id}-hint` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children ?? (
        <Input
          id={id}
          className={className}
          hasError={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...inputProps}
        />
      )}
      {resolvedHelper ? (
        <span id={helperId} className={styles.helper}>
          {resolvedHelper}
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
