import { useId, useRef, useState, type ReactNode } from 'react'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import styles from './Tooltip.module.scss'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  placement?: TooltipPlacement
  delay?: number
}

export function Tooltip({ content, children, placement = 'top', delay = 300 }: TooltipProps) {
  const id = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visible, setVisible] = useState(false)
  const prefersReducedMotion = useReducedMotionPreference()
  const showDelay = prefersReducedMotion ? 0 : delay

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setVisible(true), showDelay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <span
      className={styles.root}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible ? (
        <span id={id} role="tooltip" className={[styles.tip, styles[placement]].join(' ')}>
          {content}
        </span>
      ) : null}
    </span>
  )
}
