import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { reducedTransition, transitions } from '@/shared/motion/transitions'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonCommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
  className?: string
}

export type ButtonProps = ButtonCommonProps &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { to?: never })
    | (Omit<LinkProps, 'children'> & { type?: never })
  )

function useButtonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: Pick<ButtonCommonProps, 'variant' | 'size' | 'fullWidth' | 'className'>) {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ')
}

function ButtonContent({
  isLoading,
  leftIcon,
  rightIcon,
  children,
}: Pick<ButtonCommonProps, 'isLoading' | 'leftIcon' | 'rightIcon' | 'children'>) {
  return (
    <>
      {isLoading ? (
        <Spinner size="sm" decorative />
      ) : leftIcon ? (
        <span className={styles.icon}>{leftIcon}</span>
      ) : null}
      <span className={styles.label}>{children}</span>
      {!isLoading && rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </>
  )
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest
  } = props

  const prefersReducedMotion = useReducedMotionPreference()
  const classNames = useButtonClasses({ variant, size, fullWidth, className })
  const content = (
    <ButtonContent isLoading={isLoading} leftIcon={leftIcon} rightIcon={rightIcon}>
      {children}
    </ButtonContent>
  )

  const motionProps = prefersReducedMotion
    ? { transition: reducedTransition }
    : {
        whileTap: { scale: 0.98 },
        transition: transitions.fast,
      }

  if ('to' in rest && rest.to) {
    const { to, ...linkProps } = rest
    return (
      <motion.span
        {...motionProps}
        style={{ display: fullWidth ? 'block' : 'inline-block' }}
      >
        <Link className={classNames} to={to} aria-busy={isLoading} {...linkProps}>
          {content}
        </Link>
      </motion.span>
    )
  }

  const { type = 'button', disabled, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  const isDisabled = disabled || isLoading

  return (
    <motion.span
      {...motionProps}
      style={{ display: fullWidth ? 'block' : 'inline-block' }}
    >
      <button
        type={type}
        className={classNames}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...buttonProps}
      >
        {content}
      </button>
    </motion.span>
  )
}
