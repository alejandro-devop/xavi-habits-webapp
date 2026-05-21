import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useToastContext } from '@/shared/ui/Toast/toast.context'
import styles from './Toast.module.scss'

const ROLE_BY_VARIANT = {
  success: 'status',
  info: 'status',
  warning: 'alert',
  error: 'alert',
} as const

export function ToastViewport() {
  const { toasts, position, dismiss } = useToastContext()
  const prefersReducedMotion = useReducedMotionPreference()

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={[styles.viewport, styles[position]].join(' ')} aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role={ROLE_BY_VARIANT[toast.variant]}
            className={[styles.toast, styles[toast.variant]].join(' ')}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={prefersReducedMotion ? reducedTransition : transitions.normal}
            layout
          >
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Cerrar notificación"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
