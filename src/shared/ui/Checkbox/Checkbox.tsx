import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Checkbox.module.scss'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode
  description?: string
  error?: string | null
}

export function Checkbox({
  id,
  label,
  description,
  error,
  disabled,
  className,
  ...props
}: CheckboxProps) {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={[styles.root, disabled ? styles.disabled : '', className].filter(Boolean).join(' ')}>
      <div className={styles.control}>
        <input
          id={id}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        <span className={styles.box} aria-hidden>
          <span className={styles.check}>✓</span>
        </span>
      </div>
      {(label || description || error) && (
        <div className={styles.content}>
          {label ? (
            <label className={styles.label} htmlFor={id}>
              {label}
            </label>
          ) : null}
          {description ? (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          ) : null}
          {error ? (
            <span id={errorId} className={styles.error} role="alert">
              {error}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
