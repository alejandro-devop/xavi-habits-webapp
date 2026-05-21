import { AnimatePresence, motion } from 'framer-motion'
import { useId, useRef, useState, type ReactNode } from 'react'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import styles from './Popover.module.scss'

export type PopoverPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

type PopoverProps = {
  trigger: ReactNode
  content: ReactNode
  placement?: PopoverPlacement
  disabled?: boolean
}

export function Popover({
  trigger,
  content,
  placement = 'bottom-start',
  disabled = false,
}: PopoverProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const prefersReducedMotion = useReducedMotionPreference()

  useClickOutside(rootRef, () => setOpen(false), open)
  useEscapeKey(() => setOpen(false), open)

  return (
    <div className={styles.root} ref={rootRef}>
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-controls={`${id}-popover`}
      >
        {trigger}
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={`${id}-popover`}
            role="dialog"
            className={[styles.content, styles[placement]].join(' ')}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={prefersReducedMotion ? reducedTransition : transitions.fast}
          >
            {content}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
