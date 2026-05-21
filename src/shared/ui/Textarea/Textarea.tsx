import { forwardRef, type TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.scss'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string | null
  helperText?: string
  showCount?: boolean
  resize?: 'none' | 'vertical' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    error,
    helperText,
    showCount = false,
    maxLength,
    resize = 'vertical',
    className,
    value,
    defaultValue,
    disabled,
    ...props
  },
  ref,
) {
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-hint` : undefined
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

  const currentLength = String(value ?? defaultValue ?? '').length

  const resizeClass =
    resize === 'none' ? styles.resizeNone : resize === 'both' ? styles.resizeBoth : ''

  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        className={[styles.textarea, resizeClass, error ? styles.errorInput : '', className]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      <div className={styles.footer}>
        {helperText ? (
          <span id={helperId} className={styles.helper}>
            {helperText}
          </span>
        ) : (
          <span />
        )}
        {showCount && maxLength ? (
          <span className={styles.count} aria-live="polite">
            {currentLength}/{maxLength}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
})
