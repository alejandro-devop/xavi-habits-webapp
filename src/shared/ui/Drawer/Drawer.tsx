import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import styles from './Drawer.module.scss'

export type DrawerSide = 'left' | 'right' | 'bottom'
export type DrawerVariant = 'default' | 'notebook'
export type DrawerSize = 'sm' | 'md'

type DrawerProps = {
  open: boolean
  onClose: () => void
  side?: DrawerSide
  variant?: DrawerVariant
  /** Ancho del panel lateral: `md` (por defecto) o `sm` (~400px). */
  size?: DrawerSize
  /**
   * Ámbito del design system para el portal (p. ej. `'aura'`). El panel se
   * monta en `document.body`, fuera del árbol que lleva `data-ds`, así que sin
   * esto heredaría los tokens de `:root` en lugar de los del módulo que lo abre.
   */
  ds?: string
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}

const slideVariants = {
  left: { hidden: { x: '-100%' }, visible: { x: 0 } },
  right: { hidden: { x: '100%' }, visible: { x: 0 } },
  bottom: { hidden: { y: '100%' }, visible: { y: 0 } },
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  variant = 'default',
  size = 'md',
  ds,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotionPreference()

  useBodyScrollLock(open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  const variants = slideVariants[side]

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.overlay}
          data-ds={ds}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? reducedTransition : transitions.fast}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={[
              styles.panel,
              styles[side],
              size === 'sm' ? styles.sizeSm : '',
              variant === 'notebook' ? styles.notebook : '',
            ]
              .filter(Boolean)
              .join(' ')}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
            exit={prefersReducedMotion ? undefined : 'hidden'}
            variants={prefersReducedMotion ? undefined : variants}
            transition={prefersReducedMotion ? reducedTransition : transitions.normal}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
              ×
            </button>
            <header className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              ) : null}
            </header>
            {children ? <div className={styles.body}>{children}</div> : null}
            {footer ? <footer className={styles.footer}>{footer}</footer> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
