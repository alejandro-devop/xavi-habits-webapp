import { motion } from 'framer-motion'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { reducedTransition } from '@/shared/motion/transitions'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import styles from './Switch.module.scss'

/** Travel distance for thumb (track width − thumb width − padding) */
const THUMB_TRAVEL = 22

const springTransition = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 32,
  mass: 0.75,
}

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & {
  label?: ReactNode
  description?: string
  error?: string | null
}

export function Switch({
  id,
  label,
  description,
  error,
  disabled,
  checked,
  defaultChecked,
  className,
  onChange,
  ...props
}: SwitchProps) {
  const prefersReducedMotion = useReducedMotionPreference()
  const [internalChecked, setInternalChecked] = useState(Boolean(defaultChecked))
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : internalChecked

  const handleChange: InputHTMLAttributes<HTMLInputElement>['onChange'] = (event) => {
    if (!isControlled) {
      setInternalChecked(event.target.checked)
    }
    onChange?.(event)
  }

  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  const thumbTransition = prefersReducedMotion ? reducedTransition : springTransition

  return (
    <div
      className={[
        styles.root,
        isChecked ? styles.checked : '',
        disabled ? styles.disabled : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.control}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className={styles.input}
          checked={isControlled ? checked : undefined}
          defaultChecked={isControlled ? undefined : defaultChecked}
          disabled={disabled}
          aria-checked={isChecked}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={handleChange}
          {...props}
        />
        <span className={styles.track} aria-hidden>
          <motion.span
            className={styles.thumb}
            animate={{ x: isChecked ? THUMB_TRAVEL : 0 }}
            transition={thumbTransition}
          />
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
