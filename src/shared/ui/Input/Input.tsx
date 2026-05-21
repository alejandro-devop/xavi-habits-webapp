import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Input.module.scss'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, leftIcon, rightElement, className, ...props },
  ref,
) {
  const inputClass = [
    styles.input,
    leftIcon ? styles.hasLeftIcon : '',
    rightElement ? styles.hasRightElement : '',
    hasError ? styles.error : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {leftIcon ? <span className={styles.leftIcon}>{leftIcon}</span> : null}
      <input ref={ref} className={inputClass} {...props} />
      {rightElement ? <span className={styles.rightElement}>{rightElement}</span> : null}
    </div>
  )
})
